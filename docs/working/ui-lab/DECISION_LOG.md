# UI Lab — decision log

Этот журнал отвечает на вопрос: **какое решение принято по результатам UI Lab и что из него следует**. Он не заменяет канонический реестр продуктовых решений в [`docs/core/PRODUCT_DECISIONS.md`](../../core/PRODUCT_DECISIONS.md), а хранит рабочую трассировку UI Lab.

## Формат

Каждая запись содержит дату, решение, evidence, границы и следующий gate. Решение должно быть проверяемым и не должно подразумевать изменение production, если это не написано явно и не оформлено отдельным PR.

## Решения

### `UI-DEC-001` — сохранить production без изменений, UI Lab сделать постоянной рабочей доской

- **Дата:** 02.09.2026
- **Статус:** принято владельцем
- **Решение:** канонический production Mentalix сохраняется без изменений; UI Lab используется как постоянная доска для экспериментов, сравнений и выводов.
- **Evidence:** [PR #483](https://github.com/Smira31/Mentalix/pull/483), [PR #489](https://github.com/Smira31/Mentalix/pull/489), [Telegram Preview baseline](https://mentalix-git-fix-telegram-pre-5904a8-smiraandre2-8311s-projects.vercel.app/?ui_lab=baseline)
- **Manual Telegram/iPhone gate:** **PASS**, подтверждён владельцем на реальном iPhone внутри Telegram Mini App. Baseline, Experiments и Compare открываются; «Рядом» показывает обе версии; состояния переключаются и синхронно меняются в Compare; vertical scroll, Telegram header/top safe area и отсутствие явного horizontal overflow проверены.
- **Диагностический инструмент:** `preview_diagnostics=1` использовался только для расследования маршрутизации и удалён из Preview UI после фиксации evidence.
- **Не следует из решения:** UI Lab не становится production, Preview не считается release, а визуально удачный вариант не получает автоматического разрешения на перенос.
- **Следующий шаг:** вести `EXPERIMENT_JOURNAL.md`; переносить только выводы с отдельным PR, evidence и manual gate.

### `UI-DEC-002` — DailyCanonicalExperiment собран из реальных источников; «Смысловая мозаика» не интегрирована

- **Дата:** 03.09.2026
- **Статус:** принято владельцем
- **Решение:** `DailyCanonicalExperiment` (`?ui_lab=daily-canonical`, `MXL-DAILY-CANONICAL-UI-LAB-001`) реализован как Preview-only сборка полного дневного цикла (Welcome → Check-in → Morning Check-in → Today/dayInProgress → completion → Today/reviewPending → Evening Review → Today/dayClosed → Next Day) из уже существующих UI Lab прототипов: узлы Today рендерятся через реальный prod `Today.jsx` (тот же приём, что уже использует `TodayStatePreview.baseline`), Morning Check-in портирован из PR #498, Evening Review уже в `main`. Владелец явно подтвердил (03.09.2026): узлы Today используют реальный `Today.jsx`, а не «Смысловую мозаику» (`MeaningBentoPreview` из `CardDirectionsLab.jsx`) — на момент решения `MeaningBentoPreview` существует только как невыгружаемая статическая mock-верстка внутри самого `CardDirectionsLab.jsx`, без привязки к реальным данным/fixture; вынос её в отдельный exported/data-driven компонент остаётся нерешённой задачей. По ходу реализации найден и исправлен баг: Exit из Morning Check-in (портированного из PR #498 без изменений) вызывал только внутренний `reset()` компонента, а не выход из чек-ина — пользователь оставался запертым внутри модалки. Добавлен опциональный проп `onExit` (по тому же паттерну, что `onComplete`/`onDayClosed`): при передаче Exit реально возвращает на Today/checkinPending; без `onExit` старое поведение сохранено для других потребителей компонента.
- **Evidence:** коммиты `732405ae`, `78e2b90e`, `d3a395e2` на ветке `feature/mxl-daily-canonical-ui-lab-001` (не запушена); `tests/ux/mxl-daily-canonical-ui-lab-001.spec.mjs` — 9/9 PASS (полный флоу на 320/390/430px, debug-переходы, Morning Check-in Exit → реально возвращает на Today/checkinPending, Back с середины wizard'а — обычный шаг назад, reload на середине флоу, keyboard-only навигация, `prefers-reduced-motion: reduce`); `npm run check:core` зелёный.
- **Не следует из решения:** это не production promotion и не финальный визуальный язык Today — Preview-only сборка, реальный Telegram/iPhone manual gate не проходился; вопрос интеграции «Смысловой мозаики» остаётся открытым, а не отклонённым.
- **Следующий шаг:** owner-decision — нужна ли «Смысловая мозаика» для узлов Today в этом флоу, или реальный `Today.jsx` остаётся достаточным reuse-источником; если да — отдельная задача на выгрузку `MeaningBentoPreview` из `CardDirectionsLab.jsx` в exported data-driven компонент.
