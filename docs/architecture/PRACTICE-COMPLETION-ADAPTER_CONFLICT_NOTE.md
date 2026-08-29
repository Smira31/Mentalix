# Practice completion local-first storage adapter — conflict note

**Статус:** discovery/conflict note, docs-only. Никакой код не добавлен и не изменён.
Новый task ID не заводится — четыре домена ниже уже имеют канонические ID
(`MXL-PRB-001`/`MXL-DEC-014`, `MXL-PRB-002`/`MXL-DEC-013`, `MXL-PRB-003`/`MXL-DEC-015`,
`MXL-PRB-015`/`MXL-DEC-016`).

**Дата:** 29.08.2026, GMT+3.
**Контекст:** третий трек параллельной задачи «подготовить независимый local-first
adapter для completion records четырёх одноразовых practices» (аналог
`journalEntryAdapter.js` из трека 1, см. #315). Задача явно требовала: «Если
существующий storage contract конфликтует с #311, остановись и зафиксируй conflict
note вместо переписывания чужой работы». Это тот случай.

## Что было найдено

При корректировке #311 (см. этот PR, comment на #311) обнаружилось, что практика
completion **уже** персистентна и локальна — четыре независимых файла в `src/lib/`,
каждый вызывается из своего flow-компонента при завершении:

| Практика     | Storage-файл                     | Вызывается из             | PR  | ID                          |
| ------------ | -------------------------------- | ------------------------- | --- | --------------------------- |
| Первый шаг   | `src/lib/firstStepPractice.js`   | `FirstStepFlow.jsx`       | #61 | `MXL-PRB-002`/`MXL-DEC-013` |
| Без вины     | `src/lib/noBlamePractice.js`     | `ProcrastinationFlow.jsx` | #61 | `MXL-PRB-001`/`MXL-DEC-014` |
| Один финиш   | `src/lib/oneFinishPractice.js`   | `FinishFlow.jsx`          | #62 | `MXL-PRB-003`/`MXL-DEC-015` |
| Одно из всех | `src/lib/narrowFocusPractice.js` | `NarrowFocusFlow.jsx`     | #63 | `MXL-PRB-015`/`MXL-DEC-016` |

Общий паттерн во всех четырёх (независимо друг от друга): `readLocal`/`writeLocal`
(`src/lib/store.js`), ключ `mx-{practice}-v1:<userId>`, `RETAIN_ENTRIES=60`, запись
формы `{ day, outcome, reflection, completed_at }`, добавление через
`[...log, entry].slice(-RETAIN_ENTRIES)` — без upsert, без `entry_id`, без
`schema_version`.

## Почему это конфликт, а не пробел, который можно закрыть новым модулем

Задача трека — «независимый adapter, по образцу `journalStorage.js`». Но в отличие
от Journal Flow (где до трека 1 был ровно один storage-файл, и `journalEntryAdapter.js`
из #315 мог спокойно спроецировать его на unified contract, не трогая ничего), здесь
уже есть **четыре** параллельных, реально используемых хранилища. Создание пятого
независимого модуля с собственной schema (как буквально просил трек: `entry_id`,
`practice_type` allowlist, `schema_version`, `source=practice_completion`, idempotent
upsert) при этом:

- не могло бы писать данные (задача сама запрещает подключать adapter к
  flow-компонентам — они в зоне другого агента), то есть новый модуль был бы мёртвым
  кодом до отдельного решения о миграции;
- если бы вместо этого adapter читал данные четырёх существующих логов (по аналогии
  с `journalEntryAdapter.js`), он унаследовал бы их текущий пробел — **отсутствие
  idempotency/upsert в источнике**: повторный `onComplete` уже сегодня создаёт две
  разные записи в `firstStepPractice.js` и остальных трёх (см. #311 addendum §6) — adapter
  поверх этого мог бы только _отражать_ дубли в unified-виде, не мог бы их устранить,
  не трогая сами `saveXxxEntry` в четырёх файлах;
- добавило бы **пятую** параллельную схему записи практики (Journal `journalStorage.js`,
  Journal-adapter #315, четыре practice-лога, и новый independent adapter) вместо
  унификации — прямо противоположно тому, что #311 (исправленный) определяет как
  реальный пробел: «не отсутствие сохранения, а отсутствие единого entry contract».

## Рекомендация (не реализовано в этой задаче)

Один из двух путей, оба требуют решения владельца/согласования с агентом, владеющим
action loop/practices (эти файлы в его зоне):

1. **Read-only adapter поверх существующих четырёх логов**, без записи и без
   idempotency-фикса — честно отражает текущее состояние (включая дубли), закрывает
   только представление, не источник. Безопасно сделать без координации с другим
   агентом, но не решает idempotency-риск из #311 §6.
2. **Миграция четырёх `saveXxxEntry` на unified contract с upsert по `entry_id`** —
   решает idempotency, но требует правки самих `saveXxxEntry`/`readXxxLog` (в `src/lib/`,
   формально не «Journal UI», но common-sense в зоне того же агента, который ведёт
   `FirstStepFlow.jsx`/`NarrowFocusFlow.jsx`/`ProcrastinationFlow.jsx`/`FinishFlow.jsx`,
   так как storage и flow для каждой практики фактически являются одной единицей
   работы) — не сделано в этой задаче именно поэтому.

Ни один из путей не реализован здесь по прямому требованию задачи «зафиксировать
conflict note вместо переписывания чужой работы».

## Что намеренно не менялось

`src/lib/firstStepPractice.js`, `src/lib/noBlamePractice.js`, `src/lib/oneFinishPractice.js`,
`src/lib/narrowFocusPractice.js`, все четыре flow-компонента, `Practices.jsx`, `App.jsx`,
`Today.jsx`, backend, `TASKS.md`, `docs/TASK_INDEX.md`. Новый task ID не заводился,
новый модуль в `src/lib/` не создавался.

## References

- #311 (docs/architecture/MXL-JOURNAL-PERSISTENCE-001_ENTRY_CONTRACT.md) — addendum
  §2/§6/§10, источник этого discovery
- #315 — `journalEntryAdapter.js`, аналогичный паттерн для Journal Flow (для сравнения,
  не как прецедент, применимый напрямую — Journal Flow не имел дублирующих хранилищ
  до adapter)
- #61, #62, #63 — исходные PR четырёх practice-логов
- `src/lib/store.js` — общий `readLocal`/`writeLocal`, который используют все четыре
