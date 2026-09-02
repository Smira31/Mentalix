# UI Lab — постоянная рабочая доска

UI Lab — изолированный рабочий слой Mentalix для UI-экспериментов, сравнений и выводов. Он существует рядом с production и не является второй production-веткой, альтернативным deployment или разрешением на автоматическое изменение продукта.

## Канонические ссылки

| Назначение | Ссылка |
| --- | --- |
| Compare | [Vercel Preview — Compare](https://mentalix-preview-181u1ppdq-smiraandre2-8311s-projects.vercel.app/?ui_lab=compare) |
| Baseline | [Vercel Preview — Baseline](https://mentalix-preview-181u1ppdq-smiraandre2-8311s-projects.vercel.app/?ui_lab=baseline) |
| Experiments | [Vercel Preview — Experiments](https://mentalix-preview-181u1ppdq-smiraandre2-8311s-projects.vercel.app/?ui_lab=experiments) |
| PR | [PR #483](https://github.com/Smira31/Mentalix/pull/483) |

Ссылка выше — зафиксированный Preview для текущего UI Lab; новый Preview становится каноническим только после явного обновления этой записи.

## Границы

- Канонический production Mentalix — `https://mentalix.vercel.app`; UI Lab его не заменяет и не изменяет.
- Любой UI-эксперимент начинается в UI Lab или отдельном Preview, а не в production.
- Эксперимент не считается продуктовом решением только потому, что он визуально готов или доступен по Preview-ссылке.
- Перенос результата в production требует отдельного scope, PR, проверок и предусмотренного manual gate.
- Не записывать в журнал персональные данные, Telegram `initData`, токены, секреты, тексты пользовательских journal-записей или production credentials.

## Рабочий цикл

1. **Гипотеза.** Записать, какую проблему и для кого проверяем, а также ожидаемый сигнал.
2. **Варианты.** Зафиксировать baseline, экспериментальный вариант и то, что намеренно остаётся неизменным.
3. **Сравнение.** Проверить одинаковые состояния и сценарии в Compare; записать Preview URL, commit/PR и дату.
4. **Ручной gate.** Для Telegram/iPhone проверить реальные safe areas, keyboard, reduced motion и целевые ширины. Desktop или обычный мобильный браузер не заменяют Telegram gate.
5. **Вывод.** Записать наблюдения отдельно от интерпретаций и указать решение: принять, повторить, отложить или отклонить.
6. **Следствие.** Если результат меняет продуктовую политику, обновить `docs/core/PRODUCT_DECISIONS.md`; если меняется production-факт — отдельно обновить `PROJECT_STATE.md` после проверки.

## Журналы

- [`EXPERIMENT_JOURNAL.md`](EXPERIMENT_JOURNAL.md) — сканируемый реестр экспериментов и их текущего состояния.
- [`DECISION_LOG.md`](DECISION_LOG.md) — решения по UI Lab, включая дату, evidence и следующий шаг.
- [`EXPERIMENT_TEMPLATE.md`](EXPERIMENT_TEMPLATE.md) — копируемый шаблон новой записи.

## Текущий статус

**02.09.2026:** UI Lab принят как постоянная рабочая доска. Production сохраняется без изменений. Текущий Compare Preview связан с PR #483; ручная проверка на реальном iPhone внутри Telegram остаётся открытым gate для владельца.
