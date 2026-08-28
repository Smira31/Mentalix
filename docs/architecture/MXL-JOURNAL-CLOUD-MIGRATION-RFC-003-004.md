# RFC: MXL-JOURNAL-HISTORY-001 — этапы 3 и 4 миграции к cloud sync

**Статус:** draft для review frontend/backend/privacy команды. **Не утверждает** конкретные endpoint, таблицы или provider contract.

## 1. Краткое резюме

Этап 3 переводит локальные записи из `mx-journal-v2` в единый canonical migration model, не меняя пользовательский текст и не отправляя его на сервер. Этап 4 выполняет dry-run reconciliation: сравнивает локальную canonical-копию с cloud snapshot по безопасным идентификаторам и метаданным, классифицирует результат и подготавливает план синхронизации. До окончания этапа 4 никаких cloud writes быть не должно.

## 2. Предпосылки и ограничения

Текущий `journalStorage.js` хранит версию `1`, записи по локальной дате, четыре фазы `idea/action/analysis/newStep`, `draft/final`, timestamps и `freeWrites`. Legacy `mx-journal-prototype-v1` мигрируется локально. Backend journal endpoint и финальная schema не подтверждены, поэтому все серверные поля ниже являются candidate contract и требуют согласования.

Нельзя отправлять полный journal text для dry-run, нельзя удалять local storage после предварительного сравнения, нельзя считать отсутствие cloud record ошибкой и нельзя выбирать сторону конфликта молча.

## 3. Цели и нецели

| Цели | Не входит в RFC |
|---|---|
| Получить детерминированную canonical representation | Реализация backend endpoint или SQL schema |
| Идемпотентно подготовить локальные entries | Принудительный cloud upload |
| Классифицировать local/cloud состояния | Автоматическое разрешение конфликта |
| Сделать dry-run повторяемым и наблюдаемым | Export/delete, retention и AI consent policy |
| Поддержать rollback без потери текста | Media attachments и full-text search |

## 4. Canonical migration model

Кандидатная внутренняя модель, не являющаяся публичным API:

```ts
type CanonicalJournalEntry = {
  clientEntryId: string
  localDate: string // YYYY-MM-DD, сохранённый календарный ключ
  timezonePolicy: 'device-local-v1'
  schemaVersion: 1
  phases: {
    idea: CanonicalPhase
    action: CanonicalPhase
    analysis: CanonicalPhase
    newStep: CanonicalPhase
  }
  freeWrites: CanonicalFreeWrite[]
  entryUpdatedAt: string | null
  source: 'prototype-v1' | 'journal-v2'
  contentHash: string
}

type CanonicalPhase = {
  text: string
  status: 'draft' | 'final'
  updatedAt: string | null
}
```

`contentHash` нужен для сравнения и idempotency, но алгоритм и правовые ограничения его использования должны быть согласованы. Хеш не заменяет encryption и не должен публиковаться в telemetry вместе с user identity без основания.

## 5. Этап 3 — локальная нормализация

### 5.1 Алгоритм

1. Прочитать v2 через существующий safe reader.
2. Если v2 отсутствует, попытаться мигрировать legacy prototype один раз.
3. Проверить дату регулярным правилом `YYYY-MM-DD`; invalid entry оставить в quarantine result, не удаляя исходный JSON.
4. Нормализовать phase keys, text types, `draft/final` и ISO timestamps.
5. Преобразовать legacy `next`/prototype naming в canonical `newStep`.
6. Сформировать стабильный `clientEntryId` из версии migration, local date и детерминированного content identity; не использовать raw journal text в ID.
7. Рассчитать content hash по canonical payload.
8. Сохранить нормализованный snapshot и migration marker атомарно, если storage позволяет; при ошибке сохранить исходный v2 и вернуть `migration-error`.
9. Повторный запуск с тем же входом должен дать тот же canonical output и тот же ID.

### 5.2 Результаты этапа 3

```ts
type NormalizationResult = {
  entries: CanonicalJournalEntry[]
  migratedCount: number
  skippedCount: number
  errors: Array<{ code: string; date?: string }>
  sourceVersion: number
  targetVersion: number
}
```

В результатах ошибок нельзя сохранять полный текст. Пользовательский UI должен получить понятное состояние «не удалось подготовить часть записей» и сохранить возможность открыть локальный Journal.

### 5.3 Инварианты

- Исходный текст и переносы не меняются.
- `draft` не превращается в `final` автоматически.
- Повторный migration не создаёт дубликаты.
- Дата записи не пересчитывается через текущий timezone.
- Неизвестные поля не отправляются в cloud payload.
- Ошибка одной записи не удаляет и не блокирует остальные валидные записи.

## 6. Этап 4 — dry-run reconciliation

### 6.1 Входные данные

Local side предоставляет только canonical metadata и content hash. Cloud side должен вернуть минимальный snapshot, ограниченный user-owned records: `clientEntryId`, server record id, date, schema version, status, updatedAt, content hash и deletion marker, если такой contract существует. Получение cloud snapshot допустимо только после авторизации и privacy review; отсутствие write permission должно быть явным.

### 6.2 Классификация

| Состояние | Условие | Следующее действие |
|---|---|---|
| `local-only` | Local ID отсутствует в cloud | Кандидат на upload после opt-in |
| `cloud-only` | Cloud ID отсутствует локально | Кандидат на download после consent/UX решения |
| `equal` | Hash и версия совпадают | Ничего не делать |
| `local-newer` | Local updatedAt новее, hash отличается | Кандидат на upload или conflict review |
| `cloud-newer` | Cloud updatedAt новее, hash отличается | Кандидат на download или conflict review |
| `conflict` | Нельзя надёжно определить порядок/ownership | Только явный пользовательский выбор |
| `invalid` | Нарушен schema/date/ownership contract | Quarantine и диагностируемая ошибка |

Timestamp сравнивается только при подтверждённой общей timezone/clock policy. Если часы или даты нельзя сопоставить честно, результат должен быть `conflict`, а не молчаливое overwrite.

### 6.3 Dry-run output

```ts
type ReconciliationPlan = {
  generatedAt: string
  localSchemaVersion: number
  cloudSchemaVersion: number | null
  readOnly: true
  items: Array<{
    clientEntryId: string
    date: string
    state: 'local-only' | 'cloud-only' | 'equal' | 'local-newer' | 'cloud-newer' | 'conflict' | 'invalid'
    localHash?: string
    cloudHash?: string
    reasonCode: string
  }>
}
```

Plan не должен содержать plaintext journal content. Его можно хранить короткое время локально для UI, но не отправлять в analytics. Для повторяемости нужен `generatedAt`, версия мигратора и schema versions; время генерации не должно использоваться как время записи.

## 7. Безопасность и privacy boundary

Dry-run должен использовать подписанный Telegram auth header текущего клиента и серверную проверку ownership; `user_id` из URL не является достаточной защитой. Не логировать Authorization header, raw initData, journal text, полный payload или provider response. Ошибки должны использовать стабильные коды (`AUTH_REQUIRED`, `OWNERSHIP_MISMATCH`, `SCHEMA_UNSUPPORTED`, `CONFLICT`, `RATE_LIMITED`) без чувствительных деталей.

Cloud read и последующий upload должны быть разделены разными capabilities/consents. Наличие cloud snapshot не означает согласие на upload. AI consent не является cloud-sync consent, а cloud-sync consent не является согласием на AI.

## 8. Rollout

Сначала добавить нормализатор и unit tests без network. Затем включить dry-run только для internal/test accounts с mock cloud snapshot. После проверки privacy и backend contract дать пользователю read-only reconciliation preview. Только после отдельного opt-in включать upload. В каждом этапе сохранять local v2 как rollback source.

## 9. Тестовый план

Unit: legacy migration, canonical determinism, invalid date, unknown fields, draft/final preservation, stable ID/hash, duplicate prevention, timezone boundary, partial failures и no-plaintext diagnostics. Integration: auth/ownership, pagination, schema mismatch, empty cloud snapshot и rate limit. E2E: local-only device, equal records, local-newer, cloud-newer, conflict, interrupted migration и rollback. Security: assertions, что journal text и raw initData отсутствуют в logs/telemetry.

## 10. Decision log и blockers

До implementation cloud path команда должна ответить на вопросы: canonical hash algorithm, server ID/idempotency, timezone policy, revision model, conflict UX, encryption/retention, cloud opt-in wording, delete/export semantics и допустимый grace period для legacy key. Если хотя бы один из вопросов не подтверждён, выпускать только local normalization и read-only mock dry-run.

## 11. Definition of Done

Этап 3 завершён, когда все валидные v1 entries детерминированно нормализуются, migration идемпотентна и rollback сохранён. Этап 4 завершён, когда reconciliation read-only, не содержит plaintext, классифицирует все состояния, не выполняет writes и имеет тесты для equal/newer/conflict/invalid/partial-error сценариев. Cloud upload в эти этапы не входит.
