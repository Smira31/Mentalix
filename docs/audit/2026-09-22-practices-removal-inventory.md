# Опись перед закрытием и удалением практик (2026-09-22)

## Объём задачи

Удаляем production-реализации коллекций **«Психологические практики»** и **«Живая линза»**, оставляя их карточки коллекций видимыми в каталоге со статусом **«Скоро»**. Ритуалы, Аскезы и Check-In не входят в удаление.

## Найденные production-компоненты и связанный код

### Психологические практики

| Практика | Экран | Стили / art | Persistence / history | Точка маршрутизации |
|---|---|---|---|---|
| Без вины (`no-blame`) | `src/screens/ProcrastinationFlow.jsx` | `src/screens/ProcrastinationFlow.css` | `src/lib/noBlamePractice.js` | `src/screens/Practices.jsx` |
| Узкий фокус (`narrow-focus`) | `src/screens/NarrowFocusFlow.jsx` | `src/screens/NarrowFocusFlow.css`, `src/components/practice-art/NarrowFocusArt.jsx` | `src/lib/narrowFocusPractice.js` | `src/screens/Practices.jsx` |
| Одно завершение (`one-finish`) | `src/screens/FinishFlow.jsx` | `src/screens/FinishFlow.css`, `src/components/practice-art/OneFinishArt.jsx` | `src/lib/oneFinishPractice.js` | `src/screens/Practices.jsx` |
| Первый шаг (`first-step`) | `src/screens/FirstStepFlow.jsx` | `src/screens/FirstStepFlow.css`, `src/components/practice-art/FirstStepArt.jsx` | `src/lib/firstStepPractice.js` | `src/screens/Practices.jsx` |

Коллекция также использует общую историю разовых практик: `src/lib/oneOffPracticeHistory.js`, которая агрегирует четыре перечисленных helper-а и отображается в `src/screens/History.jsx`. Эти файлы и интеграция подлежат удалению, поскольку старый внутренний flow и его persistence больше не нужны.

В коде **нет отдельного `NoBlameFlow.jsx`**: фактическая реализация «Без вины» называется `ProcrastinationFlow.jsx`.

### Живая линза

| Практика | Экран | Дополнительные точки |
|---|---|---|
| Focus | `src/screens/Focus.jsx` | `src/components/practice-art/FocusArt.jsx`, `src/components/ui-lab/FocusCheck.jsx`, `src/components/ui-lab/FocusCheck.css`, `tests/unit/focus-check.test.mjs`, `tests/ux/focus-check-route-smoke.mjs`, `tests/ux/focus-check-route-smoke.spec.mjs` |
| Meditation | `src/screens/MeditationFlow.jsx` | `src/components/practice-art/MeditationArt.jsx`; маршрут gated в `src/screens/Practices.jsx` |
| Дыхание | `src/screens/Breathing.jsx` | `src/components/practice-art/BreathingArt.jsx`; shortcut в `src/components/QuickAdd.jsx` |
| Мозговой тренажёр | `src/screens/BrainTrainer.jsx` | `src/components/practice-art/NeuroArt.jsx`; production route в `src/screens/Practices.jsx` |

Для `Focus`, `Meditation`, `Breathing` и `BrainTrainer` отдельные persistence-helper-ы в `src/lib` не найдены; удаляется их production route и связанный flow/UI-код. Общие слова `focus`, `breathing` и `meditation` в Check-In, Today, UI-lab и визуальных primitives не являются этими каталоговыми флоу и не удаляются без прямой связи.

## Каталог, allowlist и коллекции

* `src/config/practiceAvailability.js` содержит ключи `first-step`, `no-blame`, `narrow-focus`, `one-finish`, `brain`, `breathing`, `focus`, `meditation` и `AVAILABLE_PRACTICES`.
* `src/lib/practiceCatalogRegistry.js` содержит карточки практик и коллекций; `src/components/PracticeCatalogV2.jsx` отображает карточки и использует `practice.soon` для disabled-карточек.
* `src/screens/Practices.jsx` строит view models и маршрутизирует все перечисленные sub-route значения.
* `src/components/PinnedPractices.jsx`, `src/components/QuickAdd.jsx` и `src/lib/demoMode.js` содержат связанные shortcut/demo references; они должны быть удалены или адаптированы только там, где ссылка ведёт на удаляемую production-практику.

## Unit-тесты

* `tests/unit/maintenance-contracts.test.mjs`: контракты `meditation` availability, production catalog wiring и `MXL-310` история разовых практик; сценарии удаляемых flows и исторического persistence нужно убрать/адаптировать.
* `tests/unit/contract-regression.test.mjs`: существование `firstStepPractice.js`, `noBlamePractice.js`, `oneFinishPractice.js`, `narrowFocusPractice.js` и их поведенческие контракты; эти проверки удаляются вместе с кодом.
* `tests/unit/focus-check.test.mjs`: отдельные Focus-check сценарии; удаляются вместе с Focus-check production/UI-lab маршрутом, если после поиска не остаётся потребителя.

## UX-тесты и артефакты

* `tests/ux/ux-check.spec.mjs` содержит сценарии коллекции «Психологические практики», First Step, Narrow Focus и One Finish, включая back-navigation изменения из PR #738 и #741; эти сценарии и snapshots удаляются.
* `tests/ux/focus-check-route-smoke.mjs` и `tests/ux/focus-check-route-smoke.spec.mjs` проверяют Focus route и удаляются.
* Snapshot-файлы с именами `06f0-narrow-focus-*`, `06g1-one-finish-*` и иные snapshots, используемые только удаляемыми UX-сценариями, удаляются.
* Сценарии Ритуалов, Аскез и Check-In сохраняются.

## История недавних изменений

* PR #738 (`96671aa2`) менял `FinishFlow.jsx`, `NarrowFocusFlow.jsx`, `ProcrastinationFlow.jsx`, `tests/unit/maintenance-contracts.test.mjs`.
* PR #741 (`db9cbfea`) добавлял back-navigation сценарий в `tests/ux/ux-check.spec.mjs` и обновлял Check-In snapshots. Изменения, относящиеся к удаляемым flow, будут удалены; Check-In snapshots и сценарии сохраняются.

## Уточнения по границам удаления

Не удаляются `TodayFocusFlow`, `TodayFocusCard`, Check-In focus state, общие `SemanticGlyph`/анимации, а также UI-lab демонстрации, если они не импортируют или не запускают удаляемые production-флоу. После удаления повторный `rg` и полный test gate проверят отсутствие битых импортов и сохранность остальных коллекций.
