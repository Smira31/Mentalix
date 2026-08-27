# MXL-JOURNAL-HISTORY-001 — техническая архитектура

**Статус:** архитектурный draft; не является разрешением на изменение приватного backend.

## 1. Цель

История должна объединить датированные записи Journal, существующие check-in и activity в одну спокойную хронологическую поверхность. Пользователь должен видеть, что произошло в конкретный день, раскрывать детали по запросу и возвращаться к незавершённому сегодняшнему циклу через CTA «Продолжить сегодня».

## 2. Текущее состояние

Существующий `src/screens/History.jsx` загружает `api.checkin.history(user.id, 30)` и `api.analytics.get(user.id, 30)`, объединяет данные по `date`, а badges и theme reflections показывает отдельными блоками, потому что их текущий контракт не даёт честной общей даты. `src/lib/mentalixHistoryCache.js` кеширует только AI message history в памяти. `src/lib/journalStorage.js` из PR #232 хранит Journal local-first в `mx-journal-v2`; это не cloud source и не может само по себе считаться полной историей аккаунта.

## 3. Целевой read model

На frontend нужен нормализованный read model, не зависящий от конкретного backend response shape:

```js
{
  date: 'YYYY-MM-DD',
  timezone: 'Europe/Moscow', // источник должен быть определён контрактом
  checkin: { mood, energy, anxiety, focus, note, emotion } | null,
  journal: {
    idea, action, analysis, newStep,
    completion: 'empty' | 'draft' | 'final'
  } | null,
  activity: { rituals, ascezas, focus } | null,
  sourceStatus: { checkin, journal, activity },
  canContinueToday: boolean
}
```

Это **концептуальная модель**, а не готовая backend-схема. Поля и названия должны быть согласованы с владельцем backend.

## 4. Слои реализации

| Слой | Ответственность | Предлагаемое место |
|---|---|---|
| Источники | Получить check-in, activity и journal data; не смешивать ошибки | `src/lib/api.js`, отдельные adapters |
| Нормализация | Объединить записи по валидной календарной дате и timezone | `src/lib/journalHistory.js` |
| Local fallback | Показать local-first Journal entries, пока cloud source недоступен; обозначить статус | `src/lib/journalStorage.js` + adapter |
| Presentation | Свернуть/раскрыть день, показывать пустые/частичные источники | `History.jsx` и выделенный `JournalHistoryDay.jsx` при необходимости |
| Cache | Короткий TTL для чтения, invalidate после save | существующий cache pattern, отдельный journal cache после подтверждения |
| Navigation | Перейти к сегодняшней незавершённой фазе без потери draft | существующий navigation contract и Journal Home |

## 5. Backend contract gate

До реализации cloud path требуется получить приватный backend contract: endpoint или query, авторизацию по подписанному Telegram initData, user ownership, формат даты и timezone, pagination, сортировку, draft/final semantics, partial failure behavior, export/delete implications и versioning. Нельзя выводить `user_id` из URL как достаточную авторизацию: frontend уже посылает `Authorization: tma <initData>`, но backend validation — отдельный контракт.

Если backend contract пока недоступен, допустим только безопасный frontend slice: нормализатор для уже существующих `checkin/history` и activity, чтение local-first Journal как явно помеченного источника и отсутствие заявления, что данные синхронизированы.

## 6. Сценарий чтения

1. History запрашивает источники параллельно с независимыми error boundaries.
2. Каждый источник возвращает `{ data, status }`, где `status` — `ready`, `empty` или `error`.
3. Нормализатор принимает только валидные `YYYY-MM-DD` даты, не создаёт дату из локального времени для старой записи и сортирует newest-first.
4. Для сегодняшнего дня добавляется `canContinueToday`, если хотя бы одна journal-фаза имеет текст и цикл не final.
5. UI показывает день даже при частичных данных, но не маскирует ошибку одного источника пустым успешным состоянием.
6. Недатированные badges/themes остаются отдельными секциями до появления backend date contract.

## 7. Дата, timezone и конфликты

Ключом группировки должен быть календарный день источника, а не момент рендера клиента. Backend должен возвращать либо canonical local date пользователя, либо timestamp плюс timezone policy. На переходе через полночь нельзя переместить запись в другой день только потому, что пользователь открыл приложение в другом часовом поясе. При конфликте local draft и cloud final приоритет не должен выбираться молча: нужна явная policy `local newer`, `cloud newer` или отдельный conflict state.

## 8. Error, privacy и performance

Одна ошибка не должна скрывать остальные данные. UI обязан различать «за этот день ничего нет» и «история не загрузилась». Записи не следует отправлять в analytics payload, logs или error messages. Для списка нужен ограниченный период и pagination/infinite loading только после backend contract. Полный текст journal не должен заранее загружаться для всех дней, если UI показывает только summary.

## 9. Тестовая стратегия

Unit-тесты должны покрыть нормализацию дат, сортировку, пустые и частичные источники, duplicate dates, invalid dates, `canContinueToday`, local/cloud merge и error status. Integration-тесты должны проверить вызовы с Telegram auth header, отсутствие user leakage и invalidate после save. UX smoke — 390×844 и 320×568: loading, empty, partial error, раскрытие дня, переход «Продолжить сегодня», keyboard и back.

## 10. Rollout и rollback

Сначала выпустить read-only History adapter за feature flag без изменения backend. Затем подключить journal source в режиме local-only. После подтверждения backend contract включить cloud source для небольшой тестовой выборки. Rollback — отключить journal adapter и вернуть текущий check-in/activity feed; существующая History и local-first Journal должны продолжать открываться независимо.

## 11. Definition of Done

Задача готова, когда согласован backend contract, датированные источники объединяются без потери данных, частичные ошибки видимы, сегодняшнее продолжение работает, тексты не попадают в telemetry, unit/integration/UX проверки зелёные, документация обновлена на русском и ручной Telegram/iPhone gate пройден.
