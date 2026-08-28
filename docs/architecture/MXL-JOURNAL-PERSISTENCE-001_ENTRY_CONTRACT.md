# MXL-JOURNAL-PERSISTENCE-001 / MXL-JOURNAL-HISTORY-001 — Entry contract discovery

**Статус:** discovery/data-contract, docs-only. Backend implementation, schema-миграции и новые endpoints этой задачей не делаются — приватный backend-репозиторий (`mentalix-bot`) не подключён к этой сессии, и по правилу execution backlog («нельзя предполагать endpoint, retention или data model по frontend-коду») любая backend-схема ниже — **предложение для review**, не факт контракта.

**Дата:** 29.08.2026, GMT+3.
**Источник:** прямая постановка задачи владельцем («persistent Journal/history for completed practices»), скорректированная после обнаруженной коллизии ID (см. §1).
**Метод:** аудит фактического local-first кода (`src/lib/journalStorage.js`, `src/lib/journalHistory.js`, `src/lib/checkinDraft.js`), четырёх one-shot practice-flow (`FinishFlow.jsx`, `NarrowFocusFlow.jsx`, `ProcrastinationFlow.jsx`, `FirstStepFlow.jsx` — только чтение, не менялись), существующих доков (`TASKS.md`, `docs/TASK_INDEX.md`, `docs/architecture/MXL-JOURNAL-HISTORY-001_ARCHITECTURE.md`, `docs/product/MXL-JOURNAL-PRIVACY-001_PRIVACY_AND_AI_CONSENT_DRAFT.md`, `docs/research/mentalix_competitive_analysis_execution_backlog_2026-08-28.md`).

> **Главный вывод:** «завершённая практика» сейчас означает три разных, не связанных между собой вещи в коде, и только одна из них вообще что-то сохраняет. Journal Flow (idea → action → analysis → newStep) имеет полноценное local-first хранилище с версионированием и историей. Check-in (`lessons`/`wins`) сохраняется отдельно через backend. А четыре one-shot practice-flow — `FinishFlow`, `NarrowFocusFlow`, `ProcrastinationFlow`, `FirstStepFlow` — **не сохраняют факт завершения вообще**: `onComplete` — чистый navigation-callback (`Practices.jsx` мапит его прямо на `onReturnToToday`), без единого вызова `api.*`, `localStorage` или `events.log`. Если задача — «вернуться к прошлым outcomes практик», это и есть главный пробел, а не отсутствие Journal/History UI.

## 1. Коррекция scope: MXL-009 → канонические ID

Первоначальная постановка задачи ссылалась на `MXL-009` — эта задача уже закрыта (PR #221, «Описательные AI-insights без причинных claims», `verified/completed`) и прямо перечислена в `docs/TASK_INDEX.md` как ID, который **нельзя** дублировать новой Journal-задачей. Свежедобавленный `docs/research/mentalix_competitive_analysis_execution_backlog_2026-08-28.md` подтверждает: работа над persistent Journal/history уже разбита на канонические `MXL-JOURNAL-PERSISTENCE-001` (P0, in progress) и `MXL-JOURNAL-HISTORY-001` (P1, backlog, зависит от persistence) — этот документ работает под этими двумя ID, не заводит третий.

## 2. Что уже реализовано локально (аудит кода)

| Домен                                                                                                   | Хранилище                                                      | Что есть                                                                                                                                                                                              | Что отсутствует                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Journal Flow** (idea/action/analysis/newStep)                                                         | `localStorage`, `mx-journal-v2:user:<id>`, `journalStorage.js` | Версионирование (`STORAGE_VERSION=2`), user-scoped ключи, explicit opt-in миграция со старого browser-wide ключа (`migrateLegacyJournalToUser`), `updatedAt` на фазу и на запись, `freeWrites[]` с id | Backend/cloud sync — не начат                                                                                                 |
| **История Journal**                                                                                     | производное чтение, `journalHistory.js`                        | Read-only view поверх того же store, фильтр `completedCount > 0`, **детерминированная сортировка** `date.localeCompare` по убыванию — уже готовый прецедент                                           | Не видит ничего, кроме Journal Flow — check-in и practice-flow сюда не попадают                                               |
| **Check-in** (`lessons`/`wins`, `mood`/`energy`/`anxiety`/`focus`)                                      | backend, `api.checkin`                                         | Отдельный контракт, уже в проде, `sanitizeCheckins` на клиенте (см. `MXL-INSIGHTS-001` discovery)                                                                                                     | Не связан с Journal/practice-flow ни по данным, ни по UI                                                                      |
| **Ритуалы/аскезы**                                                                                      | backend, `api.rituals`/`api.ascezas`                           | Свой streak/`held_days`/`clean_rate`-контракт, уже в проде                                                                                                                                            | Другая доменная модель (ежедневная привычка, не разовая сессия) — вероятно не то, что имеется в виду под «completed practice» |
| **Одноразовые practice-flow** (`FinishFlow`, `NarrowFocusFlow`, `ProcrastinationFlow`, `FirstStepFlow`) | **нет**                                                        | Ничего — `onComplete` в `Practices.jsx` вызывает только `onReturnToToday()`                                                                                                                           | **Полное отсутствие персистентности факта завершения.** Ни `api.*`, ни `localStorage`, ни `events.log`                        |

Из этого следует, что «practice type» в контракте ниже (§4) должен явно перечислить домены, а не считаться самоочевидным — «Journal», «check-in reflection» и «one-shot practice completion» это разные вещи с разным текущим состоянием готовности.

## 3. Backend-возможности — не проверены, честно

Backend (`mentalix-bot`) не подключён к этой сессии; ничего из перечисленного ниже не подтверждено фактическим кодом backend. Это открытый список вопросов, а не контракт. (На машине есть локальные каталоги, похожие на клоны `mentalix-bot`, но подключение отдельного репозитория к текущей задаче — решение владельца, не сделано по умолчанию.)

## 4. Минимальный entry contract (предложение для review)

| Поле             | Тип                                                            | Обязательное                             | Комментарий                                                                                                                                   |
| ---------------- | -------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `entry_id`       | string (client-generated UUID)                                 | да                                       | Генерируется на клиенте в момент старта, не на backend — нужно для идемпотентности (§6) до подтверждения серверной генерации                  |
| `user_id`        | string/number, по образцу существующего `normalizeUserId`      | да                                       | Тот же паттерн, что уже в `journalStorage.js`/`checkinDraft.js`                                                                               |
| `practice_type`  | enum: `journal` \| `checkin_reflection` \| `one_shot_practice` | да                                       | Явно разводит три домена из §2; `one_shot_practice` дополнительно несёт `practice_key` (`finish_flow`/`narrow_focus`/`no_blame`/`first_step`) |
| `started_at`     | ISO 8601 timestamp (не только дата)                            | да                                       | Нужен именно timestamp, не calendar date — calendar day выводится сервером по timezone policy (§5), не хранится дублем на клиенте             |
| `completed_at`   | ISO 8601 timestamp \| `null`                                   | да (может быть `null` для незавершённых) | Отдельно от `started_at` — нужно для будущих метрик длительности (не только для этой задачи)                                                  |
| `outcome`        | short string, bounded length                                   | нет                                      | По аналогии с `MXL-009`: описательный, не диагностический текст; не структурированный «результат лечения»                                     |
| `reflection`     | string, bounded length                                         | нет                                      | Свободный текст пользователя; см. privacy boundary §7 — не отправляется в AI по умолчанию                                                     |
| `next_action`    | string, bounded length                                         | нет                                      | Уже существует как UX-паттерн (`TodayFocusFlow`/«Разгрузить голову») — контракт должен переиспользовать тот же формат, не изобретать новый    |
| `source`         | enum: `journal_flow` \| `checkin` \| `practice_flow`           | да                                       | Дублирует часть смысла `practice_type`, но отдельно — нужен для миграции/дедупликации, если один и тот же факт когда-то придёт из двух путей  |
| `schema_version` | integer                                                        | да                                       | По прямой аналогии с `journalStorage.js` (`STORAGE_VERSION`) — обязателен с первой же версии, не добавляется задним числом                    |
| `sync_status`    | enum: `local_only` \| `synced` \| `conflict`                   | да, если задача идёт дальше local-only   | Не нужен, пока всё local-first; обязателен в момент подключения backend                                                                       |

Это набор полей для **обсуждения**, не финальная schema — финальные имена таблиц/endpoint фиксирует backend review, не эта заметка.

## 5. Timezone / date rules — подтверждённый, не гипотетический риск

`docs/architecture/MXL-JOURNAL-HISTORY-001_ARCHITECTURE.md` §7 уже отмечал этот риск как открытый; аудит кода подтверждает его конкретно: и `journalStorage.js` (`todayKey()`), и `checkinDraft.js` (`todayCheckinKey()`) независимо реализуют один и тот же паттерн — `date.getTimezoneOffset()` от **браузера**, не от политики сервера. Это системный, повторяющийся паттерн в двух модулях, не единичный баг. Любой новый persistence-контракт обязан решить это один раз, централизованно, а не породить третью независимую копию той же логики: либо backend возвращает canonical local date, либо явную timezone-политику вместе с timestamp — открытый вопрос из `TASKS.md` («calendar day/timezone в backend») остаётся нерешённым.

## 6. Idempotency

Ни один из трёх доменов (§2) сейчас не сталкивается с проблемой дублей: Journal Flow пишет по дате (upsert по ключу), check-in — отдельный, уже проверенный контракт. Для нового domain `one_shot_practice` идемпотентность — открытый риск: повторный `onComplete` (двойной тап, повторный рендер в StrictMode — см. существующий инвариант «Побочные эффекты» в `AI_RULES.md` §9 про двойной вызов апдейтера) не должен создавать два разных `entry_id` для одного и того же завершения. Предложение: `entry_id` генерируется клиентом один раз при входе в flow (не при завершении), передаётся неизменным через весь flow, backend делает upsert по `entry_id`, а не insert.

## 7. Privacy boundaries

- Полный текст `reflection`/`outcome` не отправляется в AI без отдельного согласия — это уже существующее правило (см. `MXL-JOURNAL-PRIVACY-001` §5: «Нельзя автоматически определять кризис, диагноз или причину состояния по дневнику»), этот контракт его не ослабляет и не расширяет полномочия AI.
- Минимизация данных: контракт в §4 не хранит больше, чем нужно для показа в History и как источник для `MXL-INSIGHTS-001` — никаких геолокации, device fingerprint или контактных данных.
- `outcome`/`reflection` требуют той же наблюдательной, не причинной рамки, что уже установлена в `MXL-009`/`MXL-INSIGHTS-001` — если это поле когда-либо будет анализироваться автоматически, оно обязано пройти тот же `isDescriptiveInsight`-класс фильтра, не новый.
- Черновик `MXL-JOURNAL-PRIVACY-001` уже предлагает похожую минимальную модель для consent audit (`user_id`, timestamp, source, status, policy version — без полного текста) — этот entry-контракт согласован с тем же принципом «не хранить полный текст там, где хватает метаданных», но остаётся отдельным контрактом, не consent ledger.

## 8. Migration/backfill policy

- **Прецедент уже есть и его стоит повторить, а не изобретать заново:** `journalStorage.js` переносит старый browser-wide ключ в user-scoped explicit-opt-in действием пользователя (`migrateLegacyJournalToUser`), не автоматически. Любая будущая local→cloud миграция должна следовать тому же паттерну — не тихая фоновая миграция.
- **Backfill для one-shot practice-flow невозможен принципиально:** поскольку `FinishFlow`/`NarrowFocusFlow`/`ProcrastinationFlow`/`FirstStepFlow` никогда ничего не сохраняли (§2), не существует исторических данных, которые можно было бы перенести — History для этого домена начинается с нуля с момента внедрения контракта, не раньше. Это нужно явно показать пользователю (пустое состояние «начали считать недавно», не ошибка и не «данных нет вообще»).
- **Старые пользователи без Journal-истории** — уже частично покрыто: `readJournalHistory` просто возвращает пустой массив, если `entries` пуст — graceful по конструкции, ничего доделывать не нужно для этого конкретного модуля.

## 9. API-зависимости (вопросы к backend, не предположения)

Список ниже — не новый: почти дословно повторяет то, что уже зафиксировано как открытое в `TASKS.md` для `MXL-JOURNAL-PERSISTENCE-001` («Нужно решить/зафиксировать до следующих подэтапов»), плюс два новых пункта из этого аудита:

- entry ID — генерируется клиентом или сервером (§6)?
- server schema для `practice_type`/`source` — совпадает ли предложение §4 с тем, что backend уже может отдать по check-in/ritual/asceza моделям?
- calendar day/timezone policy на backend (§5) — единая точка правды, не третья копия `getTimezoneOffset()`.
- edit/delete across devices — вне scope этого документа, но контракт должен оставить для этого поле (`schema_version`, `sync_status`).
- offline behavior, export и retention — прямая зависимость от ещё не решённого `MXL-JOURNAL-PRIVACY-001`.
- **Новое:** нужен ли отдельный endpoint для `one_shot_practice`-завершений, или они пишутся туда же, куда уже пишутся check-in `lessons`/`wins` (переиспользование существующего контракта vs. новый)?
- **Новое:** зарезервированы ли имена событий из `MXL-INSIGHTS-001`/`MXL-WTP-001` discovery notes (`journal_completed`, `next_action_created` и т.п. из measurement plan execution backlog) так, чтобы этот контракт их не конфликтовал?

## 10. Что можно сделать frontend-only, без backend, прямо сейчас

Явно НЕ реализовано в рамках этой задачи (docs-only), но зафиксировано как конкретный, небольшой, не требующий backend следующий шаг: завести **local-only** completion-record для четырёх one-shot practice-flow по образцу уже существующего `journalStorage.js`/`checkinDraft.js` (тот же паттерн: user-scoped `localStorage`, `schema_version`, explicit read-model). Это закрыло бы главный пробел §2 без единого backend-изменения и без риска потерять данные при последующей интеграции backend — тот же migration-паттерн (§8) перенёс бы их позже.

**Нельзя** сделать frontend-only: межустройственную синхронизацию, серверно-авторитетную timezone-политику (§5), гарантии долгосрочного retention, honest backfill уже потерянных завершений (§8 — их физически нет).

## 11. Критерии готовности backend handoff

- Владелец подтвердил или скорректировал поля §4.
- Backend review подтвердил (не предположил) entry ID, schema, timezone policy, idempotency-подход, sync conflict policy.
- `MXL-JOURNAL-PRIVACY-001` решения по этому контракту либо приняты, либо явно отложены с зафиксированным риском (не молчаливым допущением).
- Имена событий сверены с уже предложенными в `MXL-INSIGHTS-001`/`MXL-WTP-001` discovery notes — не дублируются и не конфликтуют.
- Privacy-review подтвердил §7 (минимизация данных, отсутствие journal text в AI-каналах по умолчанию).

## 12. Что намеренно не менялось

По прямому ограничению задачи не тронуты: `src/App.jsx`, `src/screens/Today.jsx`, `src/screens/Practices.jsx`, `src/screens/CheckIn.jsx`, все четыре practice-flow (`FinishFlow.jsx`, `NarrowFocusFlow.jsx`, `ProcrastinationFlow.jsx`, `FirstStepFlow.jsx` — только читались), Series & Badges (`#301`/`MXL-SERIES-001`), payment, Telegram workflow, `TASKS.md`, `docs/TASK_INDEX.md`. Новый ID не заводился, фиктивные endpoints не создавались, backend-код не писался.

## 13. Открытые вопросы для владельца

1. Подтвердить поля §4 или скорректировать до backend review.
2. Разрешить ли следующим шагом local-only completion-record для practice-flow (§10) как отдельную задачу — без backend, без нового ID (расширение `MXL-JOURNAL-PERSISTENCE-001`)?
3. Стоит ли подключать локальный клон `mentalix-bot` к отдельной будущей сессии для настоящего backend review — и если да, какой каталог считать актуальным.
4. Приоритет между `MXL-JOURNAL-PERSISTENCE-001` (persistence) и `MXL-JOURNAL-PRIVACY-001` (retention/consent) — контракт §4 частично зависит от решений по privacy, которые сейчас `needs-owner`.

## References

- `TASKS.md` — `MXL-009` (закрыта, не путать), `MXL-JOURNAL-PERSISTENCE-001`, `MXL-JOURNAL-HISTORY-001`, `MXL-JOURNAL-PRIVACY-001`
- `docs/TASK_INDEX.md`
- `docs/architecture/MXL-JOURNAL-HISTORY-001_ARCHITECTURE.md`
- `docs/product/MXL-JOURNAL-PRIVACY-001_PRIVACY_AND_AI_CONSENT_DRAFT.md`
- `docs/research/mentalix_competitive_analysis_execution_backlog_2026-08-28.md`
- `docs/research/MXL-INSIGHTS-001_DESCRIPTIVE_PATTERN_INSIGHTS_DISCOVERY.md`
- `src/lib/journalStorage.js`, `src/lib/journalHistory.js`, `src/lib/checkinDraft.js`
- `src/screens/Practices.jsx`, `src/screens/FinishFlow.jsx` (чтение)
- `AI_RULES.md` §9 (инвариант «Побочные эффекты»)
