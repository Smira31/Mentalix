# UI Lab — журнал экспериментов

Журнал отвечает на вопрос: **что проверяли, в каком окружении и что наблюдали**. Продуктовые решения фиксируются отдельно в [`DECISION_LOG.md`](DECISION_LOG.md) и, если меняется политика продукта, в [`docs/core/PRODUCT_DECISIONS.md`](../../core/PRODUCT_DECISIONS.md).

## Статусы

`draft` — гипотеза формируется; `running` — Preview доступен и проверка идёт; `manual-gate` — нужен реальный Telegram/iPhone gate; `concluded` — наблюдения записаны; `promoted` — результат перенесён в production отдельным PR; `archived` — эксперимент закрыт без переноса.

## Реестр

| ID | Дата | Гипотеза / scope | Варианты | Evidence | Статус | Следующий шаг |
| --- | --- | --- | --- | --- | --- | --- |
| `UI-EXP-001` | 02.09.2026 | Постоянная Compare-доска упростит сопоставление baseline и экспериментальной версии без затрагивания production | Baseline / Experiments / Compare | [PR #483](https://github.com/Smira31/Mentalix/pull/483), [Compare Preview](https://mentalix-preview-181u1ppdq-smiraandre2-8311s-projects.vercel.app/?ui_lab=compare) | `manual-gate` | Проверить на iPhone в Telegram: 320×568, 390×844, 430×932; safe areas и reduced motion |

## Правила записи результата

Для каждой новой записи использовать [`EXPERIMENT_TEMPLATE.md`](EXPERIMENT_TEMPLATE.md). В реестр добавлять только короткую строку; подробности хранить в отдельном файле `UI-EXP-NNN-<slug>.md` рядом с этим журналом, если их становится больше одной страницы.

Разделяйте факты и интерпретации. Снимок Preview, desktop smoke и автоматический тест подтверждают только соответствующее окружение; они не подтверждают реальный Telegram WebView, safe-area, keyboard или production behaviour.

После завершения эксперимента обязательно указать один итог: **принять**, **повторить**, **отложить** или **отклонить**. «Принять» не означает автоматически менять production: для переноса нужен отдельный PR и его собственные проверки.
