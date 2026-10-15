---
status: current
last_verified: 2026-10-15
---
# Contract/regression harness

**Статус:** test infrastructure only. No production code changed.

**Что это:** `tests/unit/contract-regression.test.mjs`, подключён к существующей команде
`npm run test:unit` автоматически (glob `tests/unit/*.test.mjs` в `package.json` уже
покрывает новые файлы — package.json не менялся).

## Зачем skip, а не fail

**Обновление 15.10.2026 (AUD-014):** состояние harness проверено прогоном
`node --test tests/unit/contract-regression.test.mjs` — 5 тестов, 4 pass, 1 skipped,
0 failed. Пропущен импорт `src/lib/journalEntryContract.js`: модуля в `main` нет, и
проверка остаётся `t.skip` до его появления. Проверки четырёх practice-completion
логов из harness удалены вместе с практиками (см. «Известные ограничения»).

**Обновление 29.08.2026:** `MXL-JOURNAL-PERSISTENCE-001` (#315) и `MXL-date-policy`
(#316) были смёржены в `main`; после rebase этой ветки часть ранее `t.skip`-тестов
исполнялась. Секция ниже описана в прошедшем времени как контекст решения, не текущее
состояние.

Эта ветка была создана от `main` независимо от `MXL-JOURNAL-PERSISTENCE-001` (frontend
adapter) и `MXL-date-policy` — оба тогда ещё открытые PR, не смёрженные. Часть проверок
целилась в модули из этих PR (`src/lib/journalEntryContract.js`,
`src/lib/journalEntryAdapter.js`, `src/lib/dateTimezonePolicy.js`), которых не было на
`main`. Чтобы harness не ломал `npm run test:unit` до их мерджа и не требовал
координации мерджа веток, такие проверки делали `t.skip(...)` через
`node:test`, если `import()` целевого модуля возвращает `ERR_MODULE_NOT_FOUND` —
это единственный код ошибки, который трактуется как «модуля ещё нет», любая другая
ошибка при импорте остаётся настоящим failure. Дизайн подтвердился: после мерджа
обоих PR проверки заработали без единой правки самого harness.

## Что проверяется сейчас

- `src/lib/api.js` не содержит терминов ещё не подтверждённых backend-концепций
  entry-контракта (`entry_id`, `practice_completion`, `one_shot_practice`,
  `checkin_reflection`, `sync_status`) — защита от преждевременно выдуманного endpoint.
- Вызовы `api.mentalix.send(...)` (AI persona) и `sendData(...)` (Telegram) не передают
  идентификаторы journal/practice полей (`reflection`/`outcome`/`next_action`/
  `freeWrites`/...) как есть.

## Timezone/date policy и entry-контракт

- Timezone/date policy (`toLocalCalendarDate` не возвращает `NaN`-строки,
  `resolveCalendarDate({policy:'server'})` кидает `UnimplementedDatePolicyError`,
  не выдумывает backend) — `src/lib/dateTimezonePolicy.js` в `main` есть, проверка
  исполняется.
- Entry schema и обязательные поля (`ENTRY_KEY_ORDER`, `normalizeEntry` требует
  `entry_id`/`user_id`/`entry_type`), idempotency (`dedupeEntries` схлопывает дубли по
  `entry_id`), deterministic ordering (`readJournalEntries` стабилен между вызовами) и
  malformed/legacy handling (`normalizeEntry`/`deserializeEntry` не падают на мусорном
  вводе) — всё это про `src/lib/journalEntryContract.js`, которого в `main` нет:
  проверки пропускаются как `t.skip`.

## Известные ограничения

- Проверки четырёх practice-completion логов удалены из harness вместе с практиками
  (2026-09-22, см. `docs/audit/archive/2026-09-22-practices-removal-inventory.md`):
  `src/lib/firstStepPractice.js`, `noBlamePractice.js`, `oneFinishPractice.js` и
  `narrowFocusPractice.js` в `main` больше нет, поэтому прежнее ограничение об
  отсутствии idempotency у этих логов больше не относится к текущему коду.
- Проверка «нет journal/practice текста в AI/Telegram payload» — статический скан
  сигнатуры вызова, не runtime data-flow анализ; не ловит непрямую передачу через
  промежуточную переменную с другим именем.
- Harness не подключён в `check:core` явно — он уже покрыт существующим glob'ом
  `test:unit`, поэтому `npm run check:core` включает его без изменений в
  `package.json`.
