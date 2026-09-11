# MXL-435 — UI Lab Preview: старт и ACTIVE LOCK

Дата: **11.09.2026, Europe/Moscow**  
Роль: **Исполнитель одной узкой задачи**  
Режим: **шаг 1 из 4 — только контекст и старт; код не меняется**

## Контекст

Проверены согласованный bounded first scope в [`MXL-435_MENTOR_PERSONA_PICKER_REDESIGN_ADR.md`](../core/MXL-435_MENTOR_PERSONA_PICKER_REDESIGN_ADR.md), формулировки пяти направлений в [`MENTOR_PERSONA_PICKER_REDESIGN_DIRECTIONS.md`](../research/MENTOR_PERSONA_PICKER_REDESIGN_DIRECTIONS.md), production-baseline [`PersonaPicker.jsx`](../../src/screens/mentalix/PersonaPicker.jsx), а также образец сравнения [`CardDirectionsLab.jsx`](../../src/components/ui-lab/CardDirectionsLab.jsx).

Реализуемый в следующих шагах Preview-only scope: сравнение двух статических вариантов карточки для трёх существующих персон — рекомендованный гибрид направления 1 «один следующий обратимый шаг» + направления 2 «проверяемое обещание роли» с safety-языком направления 5 и контрольный вариант направления 3 «мягкое знакомство через starter-сценарий». Нативный horizontal snap-scroll, SemanticGlyph-зона, один dot-пагинатор и touch-friendly controls копируются только в Preview-компонент.

## ACTIVE LOCK

```text
Task: MXL-435 / MXL-435-UI-LAB-001
Branch: feat/mxl-435-mentor-picker-ui-lab
Base SHA: 48320f9b9b806196b1710d208db46cecf7e0a4f9 (origin/main, проверен 11.09.2026)
Writer: Manus / Исполнитель шага 1
Files:
  - docs/handoffs/2026-09-11-mxl-435-ui-lab-start.md (этот handoff)
  - src/components/ui-lab/MentorPersonaPickerExperiment.jsx (шаг 2)
  - src/components/ui-lab/MentorPersonaPickerExperiment.css (шаг 2)
  - src/components/ui-lab/UiLab.jsx (шаг 3)
  - src/components/ui-lab/uiLabCatalog.js (шаг 3)
  - docs/working/ui-lab/EXPERIMENT_JOURNAL.md (шаг 4)
Out of scope:
  - src/screens/mentalix/PersonaPicker.jsx
  - src/screens/mentalix/personas.js
  - src/screens/mentalix/Conversation.jsx
  - весь backend и API, новые endpoints, storage и persistent memory
  - production navigation, production copy и существующие persona-контракты
  - Stoic-art, новый asset pipeline и сторонние иллюстрации
  - merge, production promotion и утверждение manual Telegram/iPhone gate
```

## Что проверено

- `origin/main` актуален на SHA `48320f9b9b806196b1710d208db46cecf7e0a4f9`.
- Рабочая ветка создана от этого SHA: `feat/mxl-435-mentor-picker-ui-lab`.
- Production `PersonaPicker.jsx` использует нативный горизонтальный snap-scroll, `SemanticGlyph`, touch-friendly controls и один dot-пагинатор; этот файл остаётся read-only.
- Текущая рабочая копия после подготовки чистая; кодовые изменения в этом шаге отсутствуют.

## Что не проверено

Реализация, `npm run check:core`, `npm run ux:check`, loading/error/empty states, мобильные viewport 320×568, 390×844 и 430×932, а также реальный Telegram/iPhone gate ещё не выполнялись. Manual gate не заявляется пройденным.

## Точный следующий decision gate

После отдельного сообщения шага 2 создать только Preview-компонент и CSS в пределах ACTIVE LOCK; не менять production/API. Затем wiring, журнал, checks и один PR без merge. Перед любым решением о переносе в production владелец должен отдельно пройти ручной Telegram/iPhone gate и принять отдельное решение.

## Риски

Основные риски — язык «шага» может восприниматься как давление, role-promise может выглядеть как гарантия результата, starter может провоцировать лишнее раскрытие, а safety-copy может создать ожидание терапии или emergency response. Любая session-local обратная связь не должна превращаться в persistent memory.

## Rollback

Для шага 1 достаточно удалить этот handoff-коммит и ветку; production и API не затронуты. Для последующих шагов rollback — удалить только Preview-компонент, его CSS, UI Lab wiring и журнальную строку отдельным revert-коммитом. Merge не выполнять.
