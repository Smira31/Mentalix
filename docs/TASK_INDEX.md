---
status: current
last_verified: 2026-09-14
---

# Mentalix — активный task index

Этот файл — единственный активный backlog. GitHub Issue/PR являются первичными карточками работы; этот индекс задаёт только порядок и границы. `TASKS.md` и `CHANGES.md` не являются backlog.

## Каноническая очередь

| Порядок | Трек | Состояние | Следующий gate |
|---:|---|---|---|
| 1 | [PR #565](https://github.com/Smira31/Mentalix/pull/565) — MVP «Наставник» | Единственный активный продуктовый PR | Проверить preview, сохранение/отложить/закрыть, затем owner iPhone/Telegram PASS |
| 2 | [Issue #612](https://github.com/Smira31/Mentalix/issues/612) — мониторинг Progress | Post-release наблюдение | Записать evidence, проверить ошибки и закрыть |
| 3 | [PR #592](https://github.com/Smira31/Mentalix/pull/592) — документационный индекс | Активный docs PR, требует rebase и проверки | Сверить `PROJECT_STATE`, `docs/INDEX`, frontmatter и drift-check, затем merge |

## Отложено

| Issue | Причина |
|---:|---|
| [#600](https://github.com/Smira31/Mentalix/issues/600) | Координационный evaluator–optimizer трек; не заменяет продуктовую очередь |
| [#582](https://github.com/Smira31/Mentalix/issues/582) | Preview-only Library UI Lab; не начинать production-монетизацию |
| [#516](https://github.com/Smira31/Mentalix/issues/516) | Preview-only illustration system |
| [#480](https://github.com/Smira31/Mentalix/issues/480) | Backend-dependent AI handoff |

## Закрытые текущие треки

Dialog role flow по Issue #515 выполнен и опубликован из `main` через PR #613. PR #608 и #609 закрыты, их ветки удалены. Новую работу по Dialog не начинать без новой Issue и отдельного owner-решения.

## Правила готовности

**Ready:** определены цель, scope, то, что не меняется, проверки, rollback и manual gate. **Done:** проверки зелёные, evidence сохранён, а обязательный manual gate пройден. Production публикуется только из `main`.

## References

[1]: https://github.com/Smira31/Mentalix/pulls "Открытые pull requests Mentalix"
[2]: https://github.com/Smira31/Mentalix/issues "Открытые issues Mentalix"
