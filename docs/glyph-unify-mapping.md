# MXL-GLYPH-UNIFY-001 — картирование потребителей SemanticGlyph и CardSystemGlyph

Дата: 12.08.2026
Часть: Цикл 1 (см. `TASKS.md` → `MXL-GLYPH-UNIFY-001`) — только факты, код не менялся.
Метод: сплошной `grep` по `src/` на `SemanticGlyph`/`CardSystemGlyph`/`Glyph`, затем построчное чтение каждого найденного файла (22 файла). Разграничение факт/гипотеза — по `AI_RULES.md` §1.

## 1. Сводная таблица потребителей

| Экран/компонент | Какой Glyph | kind-варианты (факт из кода) | Переключатель `cardSystemPreviewEnabled` | Зависимость от UI Lab 05/09/12/14/16/18 |
|---|---|---|---|---|
| `screens/Ascezas.jsx` — карточка аскезы | `CardSystemGlyph` **или** `SemanticGlyph` (условно) | `CardSystemGlyph kind="asceza-boundary"` только когда `semanticKindForAsceza() === 'asceza'`; иначе `SemanticGlyph kind={semanticKindForAsceza(asceza)}` (`asceza`/`alcohol`/`smoking`) | Да — определяет ветку `CardSystemGlyph` vs `SemanticGlyph` | Нет |
| `screens/Ascezas.jsx` — пустое состояние (нет аскез) | `SemanticGlyph` | `kind="asceza"`, жёстко задан | Нет — флаг не читается в этом месте | Нет |
| `screens/Breathing.jsx` | `CardSystemGlyph` **или** `SemanticGlyph` | `CardSystemGlyph kind="breath-flow"` / `SemanticGlyph kind="breath"` (2 места: превью и активный экран) | Да | Нет |
| `screens/Focus.jsx` | `CardSystemGlyph` **или** `SemanticGlyph` | `CardSystemGlyph kind="focus-convergence"` / `SemanticGlyph kind="focus"` | Да | Нет |
| `screens/BrainTrainer.jsx` — герой-иллюстрация | `CardSystemGlyph` **или** `SemanticGlyph` | `CardSystemGlyph kind="neuro-synapse"` / `SemanticGlyph kind="neuro"` | Да | Нет |
| `screens/BrainTrainer.jsx` — список упражнений (`EXERCISES`) | только `SemanticGlyph` | `brain-attention`, `brain-memory`, `brain-reaction`, `brain-plasticity`, `brain-gymnastics` | Нет — флаг не читается для этого блока | Нет |
| `screens/Practices.jsx` — карточка «Ритуалы» | только `SemanticGlyph` (через `RitualsArt`) | `kind="ritual"` | Импортирован, но для этой карточки не применяется — у `CardSystemGlyph` нет аналога `ritual` | Нет |
| `screens/Practices.jsx` — карточка «Аскезы» | `CardSystemGlyph` **или** `SemanticGlyph` (через `AskesisArt`) | `CardSystemGlyph kind="asceza-boundary"` / `SemanticGlyph kind="asceza"` | Да | Нет |
| `screens/Practices.jsx` — карточка «Нейротренажёр» | `CardSystemGlyph` **или** `SemanticGlyph` (через `NeuroArt`) | `CardSystemGlyph kind="neuro-synapse"` / `SemanticGlyph kind="neuro"` | Да | Нет |
| `screens/Practices.jsx` — карточка «Дыхание» | `CardSystemGlyph` **или** `SemanticGlyph` (через `BreathingArt`) | `CardSystemGlyph kind="breath-flow"` / `SemanticGlyph kind="breath"` | Да | Нет |
| `screens/Practices.jsx` — карточка «Фокус» | `CardSystemGlyph` **или** `SemanticGlyph` (через `FocusArt`) | `CardSystemGlyph kind="focus-convergence"` / `SemanticGlyph kind="focus"` | Да | Нет |
| `screens/Practices.jsx` — карточка «Медитация» | `CardSystemGlyph` **или** `SemanticGlyph` (через `MeditationArt`) | `CardSystemGlyph kind="meditation-contours"` / `SemanticGlyph kind="meditation"` | Да | Нет |
| `screens/Today.jsx` | только `CardSystemGlyph` | `kind="path-corridor"` — **не совпадает ни с одним объявленным `kind` в `CardSystemGlyph.jsx`**, рендерится через `default`-ветку компонента (см. §3) | Да (условие рендера всего блока, не выбор компонента) | Нет |

### Экраны/компоненты вне заданного списка, но использующие один из двух Glyph

Найдены при сплошном поиске по `src/`; не входят в перечень Ascezas/Breathing/Focus/BrainTrainer/Practices/Today из задачи, но являются потребителями и релевантны для единого реестра.

| Файл | Glyph | kind-варианты | Зависимость от 05/09/12/14/16/18 |
|---|---|---|---|
| `screens/Rituals.jsx` | только `SemanticGlyph` | `semanticKindForRitual()` → `prayer`/`shower`/`purpose`/`water`/`ritual`; плюс жёсткий `kind="ritual"` в пустом состоянии | Нет. `cardSystemPreviewEnabled` здесь переключает только CSS-класс контейнера карточки, компонент не выбирает |
| `screens/mentalix/PersonaPicker.jsx` | только `SemanticGlyph` | `semanticKindForPersona()` → `mentor`/`pathfinder`/`companion` | Нет. Флаг влияет только на CSS-класс обёртки |
| `screens/mentalix/art/PersonaArt.jsx` (используется в `JournalStart.jsx`) | только `SemanticGlyph` | `semanticKindForPersona()` | Нет |
| `components/ArticleCover.jsx` (используется в `screens/Articles.jsx`) | только `SemanticGlyph` | `semanticKindForArticle()` → `anxiety`/`sleep`/`neuro`/`focus`/`breath`/`template` | Нет |
| `components/practice-art/{AskesisArt,NeuroArt,BreathingArt,FocusArt,MeditationArt,RitualsArt}.jsx` | только `SemanticGlyph` | по одному жёсткому `kind` каждый (`asceza`/`neuro`/`breath`/`focus`/`meditation`/`ritual`) — это обёртки, на которые падает `Practices.jsx`, когда `cardSystemPreviewEnabled` выключен | Нет |

## 2. Dev-only / UI Lab слой (не production)

Гейтится `import.meta.env.DEV` в `src/main.jsx` и параметром `?ui_lab=1` — недоступен в обычном Vercel Preview и в Telegram (тот же вывод уже зафиксирован в `TASKS.md`, здесь — построчная проверка).

| Файл | Что рендерит | Использует `SemanticGlyph`/`CardSystemGlyph`? |
|---|---|---|
| `components/ui-lab/UiExperiments.jsx` — варианты **05/09/12/14/16/18** (`CheckinExperiment`, `SoftFacetExperiment`, `ChoiceLensExperiment`, `BreathingWaveExperiment`, `NextStepGateExperiment`, `ResonanceExperiment`) | Инлайновая SVG/CSS геометрия, целиком module-private | **Нет, ни один.** Проверено построчно по диапазонам каждой функции. |
| `components/ui-lab/UiExperiments.jsx` — варианты 20/21 (`RitualCardsExperiment`, `AscezaCardsExperiment`) | Галерея карточек ритуалов/аскез | Да, `SemanticGlyph` с `kind={ritual.kind}` / `kind={asceza.kind}` |
| `components/ui-lab/PracticeMotionKit.jsx` | Отдельная лаборатория motion-примеров | Определяет **третий**, самостоятельный компонент `MotionKitGlyph` со своим набором `kind` (`ritual`, `asceza-boundary`, `neuro-synapse`, `breath-aperture`, `focus-convergence`, `meditation-contours`, `practice-gate`, `path-corridor`, `energy-field`, `prayer`, `shower`, `purpose`, `morning-exercise`, `water`, `alcohol`, `smoking`); часть — под тем же именем, что в `CardSystemGlyph`, но `breath-aperture` вместо `breath-flow`. Также напрямую подключает `SemanticGlyph` для не-motion веток. |
| `components/ui-lab/CardDirectionsLab.jsx` | Ещё одна лаборатория сравнения направлений карточек | Собственный `LabGlyph`, переключающий `MotionKitGlyph` и `SemanticGlyph` по одному пропу |

**Вывод по зависимости от 05/09/12/14/16/18:** ни один из этих шести вариантов не использует `SemanticGlyph` или `CardSystemGlyph` и не может быть «мигрирован» — перенос в единый реестр потребует написания нового `kind` с нуля на основе их инлайновой геометрии, а не миграции вызова компонента. Это подтверждает оценку, уже зафиксированную в `TASKS.md` (10.08.2026), на уровне построчной проверки, а не по памяти.

## 3. Устройство самих компонентов (факт из кода)

**`src/components/SemanticGlyph.jsx`** — один `Guide()` (крестовина), один `switch (kind)` на 22 case: `neuro`, `brain-attention`, `brain-memory`, `brain-reaction`, `brain-plasticity`, `brain-gymnastics`, `breath`, `focus`, `meditation`, `prayer`, `shower`, `purpose`, `water`, `alcohol`, `smoking`, `mentor`, `companion`, `pathfinder`, `anxiety`, `sleep`, `asceza`, `ritual` + `default` (общий «template»-глиф для необработанных `kind`, например всех статей вне 6 категорий). CSS-namespace: `mx-semantic-glyph__*`.

**`src/components/CardSystemGlyph.jsx`** — свой `Guide()` (та же крестовина, отдельная копия), пять именованных `kind`: `asceza-boundary`, `neuro-synapse`, `breath-flow`, `focus-convergence`, `meditation-contours` + один безымянный `default` (рисунок «path-wall»/тропа), на который сейчас попадает **любой другой `kind`**, включая `path-corridor` из `Today.jsx` — там нет case с этим именем. CSS-namespace: `mx-card-system-glyph__*`.

Оба компонента независимо реализуют одну архитектуру (гид-крестовина + `kind`-переключатель SVG, собственный `Guide()`, собственный CSS-namespace) — это и есть дублирование, зафиксированное в `TASKS.md` под `MXL-GLYPH-UNIFY-001`.

## 4. Факты, которые стоит учесть в плане Цикла 1 (без предложений — только наблюдение)

- `cardSystemPreviewEnabled` (`src/lib/cardSystem.js`) — `true` по умолчанию, отключается только через `?card_system=0`. Это не флаг «canonical-компонент для всего приложения», а локальная ветка `? :` в каждом месте вызова — новые случаи `SemanticGlyph`, добавленные без этой ветки (пустое состояние `Ascezas.jsx`, список `BrainTrainer.jsx`, `Rituals.jsx`, `PersonaPicker.jsx`, `ArticleCover.jsx`), никогда не переключаются на `CardSystemGlyph`, даже при включённом флаге.
- Набор `kind` у `CardSystemGlyph` — подмножество сценариев `SemanticGlyph` (5 против 22): нет аналогов для `ritual`, `prayer`, `shower`, `purpose`, `water`, `alcohol`, `smoking`, `mentor`, `companion`, `pathfinder`, `anxiety`, `sleep`, всех `brain-*`. Отсюда — карточка «Ритуалы» в `Practices.jsx` физически не может переключиться на `CardSystemGlyph`.
- `Today.jsx` передаёт `kind="path-corridor"`, которого не существует в `CardSystemGlyph` — сейчас это молча рендерит `default`-рисунок; при объединении реестров это несоответствие имени и результата нужно либо явно поименовать, либо исправить.
- Обнаружен третий, независимый набор геометрии — `MotionKitGlyph` в `PracticeMotionKit.jsx` (dev-only), с собственным именем для «дыхания» (`breath-aperture` вместо `breath-flow`) — при объединении реестра стоит решить, входит ли этот компонент в объединение или остаётся отдельным dev-инструментом.
