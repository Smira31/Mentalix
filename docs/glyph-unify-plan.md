# MXL-GLYPH-UNIFY-001 — план Цикла 2 (пилот)

Дата: 12.08.2026. Статус: план согласован владельцем 12.08.2026, пилот не начат.
Опирается на факты из [`docs/glyph-unify-mapping.md`](glyph-unify-mapping.md) (Цикл 1) и
риски/предохранители из [`docs/glyph-unify-premortem.md`](glyph-unify-premortem.md).
Код не менялся — это план, реализация начинается отдельным циклом после явного
разрешения владельца приступить.

## 1. Архитектурные решения (приняты владельцем 12.08.2026)

1. **`SemanticGlyph.jsx` — канонический реестр глифов.** `CardSystemGlyph.jsx` поглощается:
   его 5 `kind` (`asceza-boundary`, `neuro-synapse`, `breath-flow`, `focus-convergence`,
   `meditation-contours`) переносятся в `SemanticGlyph.jsx` как обновление геометрии
   соответствующих уже существующих там `kind` (`asceza`, `neuro`, `breath`, `focus`,
   `meditation` — см. §3). `CardSystemGlyph.jsx`/`.css` и `cardSystemPreviewEnabled`
   (`src/lib/cardSystem.js`) по итогу удаляются, не остаются параллельным путём.
2. **`MotionKitGlyph` (`src/components/ui-lab/PracticeMotionKit.jsx`, dev-only) вне
   периметра этой задачи.** Остаётся отдельным dev-инструментом; объединение его набора
   `kind` (включая `breath-aperture`, `path-corridor`, `energy-field` и др., которых нет
   ни в `SemanticGlyph`, ни в `CardSystemGlyph`) — отдельная будущая задача, не часть
   Циклов 2–3 `MXL-GLYPH-UNIFY-001`.

## 2. Инфраструктура — до переноса первого `kind`

Оба пункта — предпосылка для остального плана, реализуются первым коммитом Цикла 2,
до переноса `asceza-boundary`/`breath-flow` (§4).

### 2.1. Явная dev-ошибка вместо silent fallback (предусловие 3 из pre-mortem)

Сейчас оба компонента молча проглатывают неизвестный `kind`: `SemanticGlyph` рисует
generic `template`, `CardSystemGlyph` — безымянный `default` («path-wall»). Правка:
в `SemanticGlyph.jsx` при `import.meta.env.DEV` неизвестный `kind` не должен молча
попадать в `default` — обязателен `console.error` с именем `kind` и (где возможно)
именем экрана-источника, чтобы опечатка или несведённое имя не терялись, как случилось
с `path-corridor` (см. 2.2). В production-сборке деградация до generic-рисунка остаётся
осознанным поведением — не ронять экран у реального пользователя из-за одной опечатки.
Это меняет диагностический контракт компонента и требует отдельной проверки (mobile,
light/dark, `npm run build`) как часть первого коммита Цикла 2 — не самостоятельный цикл.

### 2.2. Фикс `Today.jsx` — `kind="path-corridor"`

Факт из картирования: `path-corridor` не совпадает ни с одним `kind` в `CardSystemGlyph`
— `Today.jsx` **уже сегодня** молча получает безымянный `default`-рисунок компонента
(геометрия «path-wall»/тропа, см. `CardSystemGlyph.jsx` §3 в mapping.md). Это не задача
придумать новый визуал — задача назвать то, что уже показывается пользователю.

Фикс: та же геометрия (безымянный `default` из `CardSystemGlyph.jsx`) переносится в
`SemanticGlyph.jsx` как новый явный `kind` (рабочее имя `next-step` — точное имя
согласовать при реализации, `path-corridor` не переиспользовать, чтобы не путать с
одноимённым, но визуально другим `kind` в `MotionKitGlyph`). `Today.jsx` обновляется на
`kind="next-step"` (или согласованное имя). **Визуальный результат для пользователя не
меняется** — тот же рисунок, что показывается сегодня, просто у него появляется
собственное объявленное имя вместо случайного попадания в `default` по несовпадению
строки. После этого фикса неизвестный `kind` в `SemanticGlyph.jsx` (dev-режим, см. 2.1)
может по-настоящему считаться сигналом ошибки, а не нормой.

## 3. Пилот Цикла 2 — какие `kind` переносятся первыми

Из пяти `kind` `CardSystemGlyph` для пилота выбраны **`asceza-boundary`** и
**`breath-flow`** — перенос в `SemanticGlyph.jsx` как обновление геометрии существующих
`kind="asceza"` и `kind="breath"`.

**Почему эти два:**
- Соответствуют первым двум экранам, названным в самой формулировке задачи
  (`MXL-GLYPH-UNIFY-001`: «Ascezas, Breathing, Focus, BrainTrainer, Practices, Today»).
- Оба — самостоятельные, самодостаточные пары «один экран + одна карточка в Practices»
  (`Ascezas.jsx` + карточка «Аскезы»; `Breathing.jsx` + карточка «Дыхание»), без
  дополнительных сложных веток, которые есть у `BrainTrainer.jsx` (список упражнений на
  чистом `SemanticGlyph`, не затрагивается) — минимальный риск задеть код за пределами
  прямой замены.
- Совпадает по объёму с уже действующей формулировкой Цикла 2 в `TASKS.md` — «перенос
  1–2 вариантов».

`focus-convergence`, `neuro-synapse`, `meditation-contours` — Цикл 3, после проверки
пилота на реальном iPhone/Telegram (чекпоинт из предусловий, см. `TASKS.md`).

## 4. Список миграции — все 11 реальных потребителей (из mapping.md)

Статус относится к плану, не к текущему коду.

| # | Файл / место | Сейчас | После пилота (Цикл 2) | После полного объединения (Цикл 3) |
|---|---|---|---|---|
| 1 | `Ascezas.jsx` — карточка аскезы | `CardSystemGlyph kind="asceza-boundary"` ИЛИ `SemanticGlyph kind={semanticKindForAsceza}` через `cardSystemPreviewEnabled` | Тернарник убран — всегда `SemanticGlyph`; `kind="asceza"` использует перенесённую геометрию `asceza-boundary`. Импорт `CardSystemGlyph` удалён из файла. | Без изменений (уже мигрировано) |
| 2 | `Ascezas.jsx` — пустое состояние | `SemanticGlyph kind="asceza"` (жёстко) | Автоматически наследует новую геометрию `asceza` — код не меняется | Без изменений |
| 3 | `Breathing.jsx` (2 места) | `CardSystemGlyph kind="breath-flow"` ИЛИ `SemanticGlyph kind="breath"` через флаг | Тернарник убран — всегда `SemanticGlyph kind="breath"` с перенесённой геометрией `breath-flow`. Импорт `CardSystemGlyph` удалён. | Без изменений |
| 4 | `Practices.jsx` — карточка «Аскезы» (`AskesisArt`) | `CardSystemGlyph kind="asceza-boundary"` ИЛИ `AskesisArt` (→ `SemanticGlyph kind="asceza"`) через флаг | Тернарник убран — всегда `AskesisArt`, без изменений самого компонента (он уже был `SemanticGlyph`-обёрткой, теперь просто единственный путь) | Без изменений |
| 5 | `Practices.jsx` — карточка «Дыхание» (`BreathingArt`) | `CardSystemGlyph kind="breath-flow"` ИЛИ `BreathingArt` через флаг | Тернарник убран — всегда `BreathingArt` | Без изменений |
| 6 | `Focus.jsx` | `CardSystemGlyph kind="focus-convergence"` ИЛИ `SemanticGlyph kind="focus"` через флаг | Не трогается в пилоте | Тернарник убран, `kind="focus"` получает геометрию `focus-convergence`, импорт `CardSystemGlyph` удалён |
| 7 | `Practices.jsx` — карточка «Фокус» (`FocusArt`) | аналогично | Не трогается в пилоте | Тернарник убран — всегда `FocusArt` |
| 8 | `BrainTrainer.jsx` — герой-иллюстрация | `CardSystemGlyph kind="neuro-synapse"` ИЛИ `SemanticGlyph kind="neuro"` через флаг | Не трогается в пилоте | Тернарник убран, `kind="neuro"` получает геометрию `neuro-synapse`, импорт `CardSystemGlyph` удалён |
| 9 | `Practices.jsx` — карточка «Нейротренажёр» (`NeuroArt`) | аналогично | Не трогается в пилоте | Тернарник убран — всегда `NeuroArt` |
| 10 | `Practices.jsx` — карточка «Медитация» (`MeditationArt`) | `CardSystemGlyph kind="meditation-contours"` ИЛИ `MeditationArt` через флаг | Не трогается в пилоте | Тернарник убран — всегда `MeditationArt`, `kind="meditation"` получает геометрию `meditation-contours` |
| 11 | `BrainTrainer.jsx` — список упражнений | только `SemanticGlyph` (`brain-*`) | Без изменений | Без изменений — не связано с `CardSystemGlyph` |
| 12 | `Practices.jsx` — карточка «Ритуалы» (`RitualsArt`) | только `SemanticGlyph kind="ritual"` (у `CardSystemGlyph` нет аналога) | Без изменений | Без изменений |
| 13 | `Today.jsx` | `CardSystemGlyph kind="path-corridor"` → молча `default` | Фикс из §2.2 — `SemanticGlyph kind="next-step"` (или согласованное имя), тот же визуал | Без изменений (уже мигрировано инфраструктурным коммитом) |
| 14 | `Rituals.jsx` | только `SemanticGlyph`; `cardSystemPreviewEnabled` переключает только CSS-класс контейнера | Не трогается | CSS-тернарник упрощается до одного класса (флага больше нет) либо убирается — решить при реализации, визуально не меняется |
| 15 | `PersonaPicker.jsx` | только `SemanticGlyph`; тот же CSS-класс-тернарник | Не трогается | Аналогично п. 14 |
| 16 | `PersonaArt.jsx`/`JournalStart.jsx` | только `SemanticGlyph`, флаг не читается | Не трогается | Без изменений |
| 17 | `ArticleCover.jsx` | только `SemanticGlyph`, флаг не читается | Не трогается | Без изменений |

(Нумерация — по строкам таблицы, не по количеству файлов; некоторые файлы дают
несколько строк из-за нескольких мест вызова, как и в `mapping.md`.)

## 5. Финал Цикла 3 — удаление `CardSystemGlyph`

После переноса оставшихся трёх `kind` (`focus-convergence`, `neuro-synapse`,
`meditation-contours`) и уборки CSS-тернарников в `Rituals.jsx`/`PersonaPicker.jsx`:

- Удалить `src/components/CardSystemGlyph.jsx` и `CardSystemGlyph.css`.
- Удалить `src/lib/cardSystem.js` (`cardSystemPreviewEnabled`) и все его импорты.
- Проверить `grep -r "CardSystemGlyph\|cardSystemPreviewEnabled" src/` — ноль совпадений
  вне `src/components/ui-lab/**` (там `MotionKitGlyph`/`CardDirectionsLab.jsx` — вне
  периметра задачи по решению §1.2, не трогаются).
- `?card_system=0` в URL перестаёт что-либо значить — упомянуть в `CHANGES.md`, если
  кто-то использовал этот параметр (сейчас — только внутренний dev-флаг, не публичный API).

## 6. Правило коммитов (предусловие 2 из pre-mortem)

Каждый коммит — один экран целиком, без промежуточных состояний. Порядок пилота:

1. Коммит 1 — инфраструктура (§2.1 dev-ошибка + §2.2 фикс `Today.jsx`), без переноса
   `kind` из `CardSystemGlyph` ещё.
2. Коммит 2 — `Ascezas.jsx` целиком (карточка + пустое состояние уже совместимы, но
   диффом идёт весь файл) + геометрия `kind="asceza"` в `SemanticGlyph.jsx`.
3. Коммит 3 — `Practices.jsx`, только карточка «Аскезы» (`AskesisArt`-ветка), без
   остальных карточек экрана — они не в объёме пилота.
4. Коммит 4 — `Breathing.jsx` целиком (оба места) + геометрия `kind="breath"`.
5. Коммит 5 — `Practices.jsx`, карточка «Дыхание» (`BreathingArt`-ветка).

После каждого коммита — проверка по `AI_RULES.md` §5 (build, сценарий, loading/error/
empty, mobile viewport, light/dark, Telegram/web) на реальном iPhone для 2 и 4
(fixed/визуальные правки). Чекпоинт перед Циклом 3 — по критериям из
`docs/glyph-unify-premortem.md` и предусловию 1 в `TASKS.md`.
