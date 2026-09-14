---
status: current
last_verified: 2026-09-14
---

# PROJECT_STATE — подтверждённое состояние Mentalix

Этот файл содержит только проверенные факты о репозиториях, окружениях, release provenance и активных GitHub-треках. Активный backlog находится в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md). История решений находится в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

**Последняя сверка:** 14.09.2026. Проверены GitHub API, открытые PR/issues, текущий `main`, production deployment Vercel и production HTTP endpoint.

## Каноническое состояние

| Область | Факт | Доказательство |
|---|---|---|
| Frontend | `Smira31/Mentalix`, default branch `main` | [GitHub](https://github.com/Smira31/Mentalix) |
| Frontend `main` | `ce25ad2ca23ed9f4fdd1a785fd9dd885410582a8`; ветка защищена | [commit](https://github.com/Smira31/Mentalix/commit/ce25ad2ca23ed9f4fdd1a785fd9dd885410582a8) |
| Production | `main → Vercel mentalix → https://mentalix.vercel.app` | Deployment `dpl_5pC9UU5h2BE25rfFjNK3ZQM8uHT3`; target `production`; HTTP 200 |
| Production provenance | Production опубликован из `main`, SHA `ce25ad2...`, commit verification `verified` | [Vercel project](https://vercel.com/smiraandre2-8311s-projects/mentalix) |
| Owner QA Preview | `Vercel mentalix-preview → https://mentalix-preview.vercel.app` | [Preview](https://mentalix-preview.vercel.app) |
| Backend | `Smira31/mentalix-bot`, `main`=`6b170e7d0fd0af7e532a1bbb1bc4b9593de0f90f`; ветка не защищена | GitHub authenticated API |
| Backend runtime | `https://mentalix-bot.onrender.com/api/health` | Проверять перед backend-релизом; SHA Render не подтверждён |

## Канонический словарь окружений

- **Production:** `main → Vercel project mentalix → https://mentalix.vercel.app`.
- **Owner QA Preview:** `Vercel project mentalix-preview → https://mentalix-preview.vercel.app`.
- **UI Lab:** экспериментальные маршруты внутри репозитория; это не Production.
- **Branch Deployment:** временный deployment конкретной ветки или commit; это не Owner QA Preview.

## Активные GitHub-треки

На 14.09.2026 открыты только два PR и пять issues.

| Объект | Состояние | Следствие |
|---|---|---|
| PR #592 | Открыт, docs/reorg-2026-09, `DIRTY` относительно старого base | После актуализации и rebase — единственный docs PR |
| PR #565 | Открыт, `feat/mentor-mvp-kompas-ux` | Единственный активный продуктовый PR после закрытия Dialog-треков |
| Issue #612 | Мониторинг Progress после rollout | Закрыть после записи evidence и короткого наблюдения |
| Issue #600 | Evaluator–optimizer coordination | Координационный, не заменяет product backlog |
| Issue #582 | Library Programs UI Lab | Preview-only, не production-приоритет |
| Issue #516 | Illustration system | Preview-only, отложено |
| Issue #480 | AI handoff context | Backend-dependent, отложено |

PR #608 и PR #609 закрыты как выполненная/заменённая работа по Dialog. Issue #515 закрыта. Ветки `feat/515-dialog-ux-ui-lab` и `feat/515-dialog-production-parity` удалены.

## Документационный источник истины

`docs/INDEX.md` — полный каталог документов и их статусов. `docs/TASK_INDEX.md` — единственный активный backlog. `PROJECT_STATE.md` — только текущее подтверждённое состояние. `TASKS.md` и `CHANGES.md` — история и архив, а не очередь разработки.

## Ограничения подтверждения

Зелёный CI и HTTP 200 не заменяют manual iPhone/Telegram gate. Нельзя объявлять safe-area, keyboard, Telegram WebView или data-dependent сценарии пройденными без соответствующей ручной проверки.

## References

[1]: https://github.com/Smira31/Mentalix/commit/ce25ad2ca23ed9f4fdd1a785fd9dd885410582a8 "Текущий frontend main"
[2]: https://mentalix.vercel.app "Mentalix production"
[3]: https://mentalix-preview.vercel.app "Mentalix Owner QA Preview"
[4]: https://vercel.com/smiraandre2-8311s-projects/mentalix "Vercel production project"
