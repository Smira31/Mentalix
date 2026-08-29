# Contract/regression harness

**Статус:** test infrastructure only. No production code changed.

**Что это:** `tests/unit/contract-regression.test.mjs`, подключён к существующей команде
`npm run test:unit` автоматически (glob `tests/unit/*.test.mjs` в `package.json` уже
покрывает новые файлы — package.json не менялся).

## Зачем skip, а не fail

**Обновление 29.08.2026:** `MXL-JOURNAL-PERSISTENCE-001` (#315) и `MXL-date-policy`
(#316) смёржены в `main`. После rebase этой ветки на актуальный `main` все 5 ранее
`t.skip`-тестов реально исполняются и проходят — `node --test tests/unit/contract-regression.test.mjs`
даёт 11/11 pass, 0 skipped, 0 failed. Секция ниже описана в прошедшем времени как
контекст решения, не текущее состояние.

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

## Что проверяется уже сейчас, без зависимости от неслитых PR

- Единый allowlist `outcome`/`reflection` у всех четырёх existing practice-completion
  логов (`firstStepPractice.js`/`noBlamePractice.js`/`oneFinishPractice.js`/`narrowFocusPractice.js`)
  и защита от появления пятого нерецензированного лога с другим `STORAGE_PREFIX`.
- `outcome`/`reflection` значения этих логов проходят существующий фильтр
  `isDescriptiveInsight` (`src/lib/descriptiveInsights.js`) — без диагностических/
  лечебных формулировок.
- `src/lib/api.js` не содержит терминов ещё не подтверждённых backend-концепций
  entry-контракта (`entry_id`, `practice_completion`, `one_shot_practice`,
  `checkin_reflection`, `sync_status`) — защита от преждевременно выдуманного endpoint.
- Вызовы `api.mentalix.send(...)` (AI persona) и `sendData(...)` (Telegram) не передают
  идентификаторы journal/practice полей (`reflection`/`outcome`/`next_action`/
  `freeWrites`/...) как есть.

## Что проверяется теперь, что раньше skip-алось до мерджа Track 1/2

- Entry schema и обязательные поля (`ENTRY_KEY_ORDER`, `normalizeEntry` требует
  `entry_id`/`user_id`/`entry_type`).
- Idempotency (`dedupeEntries` схлопывает дубли по `entry_id`).
- Deterministic ordering (`readJournalEntries` стабилен между вызовами).
- Timezone/date policy (`toLocalCalendarDate` не возвращает `NaN`-строки,
  `resolveCalendarDate({policy:'server'})` кидает `UnimplementedDatePolicyError`,
  не выдумывает backend).
- Malformed/legacy entry handling (`normalizeEntry`/`deserializeEntry` не падают на
  мусорном вводе).

## Известные ограничения

- Idempotency/upsert для четырёх practice-completion логов **не проверяется** —
  они сегодня действительно не upsert'ят (см.
  `docs/architecture/PRACTICE-COMPLETION-ADAPTER_CONFLICT_NOTE.md`), и это не
  тестовый баг, а честное отражение текущего кода.
- Проверка «нет journal/practice текста в AI/Telegram payload» — статический скан
  сигнатуры вызова, не runtime data-flow анализ; не ловит непрямую передачу через
  промежуточную переменную с другим именем.
- Harness не подключён в `check:core` явно — он уже покрыт существующим glob'ом
  `test:unit`, поэтому `npm run check:core` включает его без изменений в
  `package.json`.
