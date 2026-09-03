# MXL-DAILY-CANONICAL-UI-LAB-001

Ты на ветке `feature/mxl-daily-canonical-ui-lab-001` (от main `11dc1128`, doc-коммит
`bc896d7c` про AGENTS.md уже внутри). Push не делал — это ожидаемо, продолжай без push.

Это НЕ новая продуктовая задача — читай это как источник правды для текущей сессии,
у тебя нет истории предыдущего обсуждения.

## Задача

Собрать один цельный Preview-only Daily Experience, переиспользуя существующий код,
а не создавая новый дизайн с нуля. Это сборка/интеграция уже существующих UI Lab
прототипов и веток в один связный flow, **не** отдельный новый визуальный дизайн.

## Источники для reuse (все уже существуют в репо — сначала посмотри их код)

- `origin/feature/mxl-onboarding-ux-001-ui-lab` (#499, Onboarding, Preview-only)
- `origin/feature/mxl-morning-checkin-ux-001` (#498, Morning Check-in, Preview-only)
- `origin/feature/mxl-today-prod-hero-001` (#490, Today 4-state hero contract,
  head SHA `3c7f4918ecfe19ce6c350d5e22ff7897eb5aad57` — **не трогать/не менять эту ветку**)
- `src/components/ui-lab/TodayStatePreview.jsx` — baseline-режим = реальный прод `Today.jsx`
- `src/components/ui-lab/CardDirectionsLab.jsx` — направление «Смысловая мозаика»
  как канонический макет для Today (уже нормативно по `DESIGN_SYSTEM.md` §5.1)
- `src/components/ui-lab/PracticeMotionKit.jsx` / `SemanticGlyph` — словарь знаков,
  не создавай новую glyph-систему
- `src/components/ui-lab/EveningReviewExperiment.jsx` (#496, уже смерджен в main) —
  основа для `reviewPending` → `Day Closed`

У тебя есть `gh` CLI — им можно посмотреть реальное содержимое #490/#498/#499
(`gh pr view 490/498/499`, `gh pr diff`) вместо только git diff по веткам —
воспользуйся этим, чтобы проверить, что ветки действительно соответствуют этим
PR-номерам (в прошлой сессии это не подтверждалось напрямую, только косвенно
по названиям веток).

## Canonical flow, который нужно собрать

```
Welcome
→ Today/checkinPending
→ Morning Check-in (State → Main Thing → First Step → commitment)
→ Today/dayInProgress (тот же First Step дословно, без изменений)
→ completion
→ Today/reviewPending
→ Evening Review (Result → Reflection → Pattern → Tomorrow Step)
→ Day Closed
→ Next Day
```

**Контрольный тест:** ввести `"10 минут разобрать макет"` в Main Thing/First Step
и убедиться, что ТОЧНО эта строка доходит без изменений до `Today/dayInProgress`.

## SCOPE — что можно трогать

- Новые/изменённые файлы только внутри `src/components/ui-lab/` и, если нужно,
  новый маршрут в `UiLab.jsx`/`UiLabSwitch.jsx`.
- Новый query-маршрут: `?ui_lab=daily-canonical` (или свой таб внутри существующего
  `UiLabSwitch` — на твоё усмотрение по месту).

## ЧТО НЕЛЬЗЯ трогать

- production `Today.jsx`, CheckIn, Onboarding screens (можно **читать**/импортировать
  как reuse, но не менять их код)
- backend, API, auth, database
- `feature/mxl-today-prod-hero-001`, `feature/mxl-morning-checkin-ux-001`,
  `feature/mxl-onboarding-ux-001-ui-lab` — эти ветки остаются нетронутыми
  source-ветками, не мержить в свою ветку целиком, а переиспользовать
  паттерны/компоненты вручную

## Правила

- Preview-only, минимальный diff, reuse before create.
- Debug-контролы (`NEW USER` / `CHECKIN PENDING` / `DAY IN PROGRESS` /
  `REVIEW PENDING` / `DAY CLOSED` / `RESET`) — снаружи phone-surface, не в
  пользовательском UI. Никаких технических меток типа «PREVIEW STATE»/«ACTIVE»
  внутри самого экрана.
- Vercel deploy/push — только с явного разрешения владельца, спроси перед первым push.
- PowerShell не использовать без отдельного согласования.

## Definition of Ready

Перед стартом реализации сверься с чек-листом DoR в `TASK_INDEX.md`, если он там
есть. Если чего-то из этого брифа не хватает, чтобы закрыть DoR — остановись
и спроси, не додумывай.

## Тестирование (после реализации)

- `320×568`, `390×844`, `430×932` — no horizontal overflow, safe areas, touch targets.
- Back/Exit/reload/re-entry, keyboard, длинный кастомный First Step, reduced motion,
  disabled CTA, completion, reopen, returning user, ноль неожиданных API-запросов.
- Playwright-прогон полного флоу (Welcome → Check-in → First Step → Today →
  completion → Evening Review → Day Closed → Next Day). Если браузерное окружение
  недоступно — честно писать «NOT RUN / ENV BLOCKED», не писать PASS без реального
  запуска.
- Скриншоты `390×844` (12 шагов флоу) + `320×568` для плотного/keyboard state,
  собрать contact sheet.

## Порядок работы

Работай поэтапно: сначала краткий план (какие файлы создаёшь/трогаешь, как именно
собираешь flow из перечисленных источников) — покажи его владельцу до начала
кодирования. Потом реализация. Потом тесты и скриншоты.
