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
