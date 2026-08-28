# PROJECT_STATE — подтверждённый current/release snapshot

> Этот файл фиксирует только проверяемое текущее состояние frontend-репозитория и известные release-факты. Он **не является backlog, журналом сессий или архивом решений**. Для следующей работы откройте [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md), [`AGENTS.md`](AGENTS.md), [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md) и связанный GitHub Issue/PR.

**Последняя сверка:** 28.08.2026, 08:08 UTC.

## Подтверждённые факты

| Область                       | Подтверждённый факт                                                                                                          | Источник                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Frontend repository           | `Smira31/Mentalix`, ветка `main`                                                                                             | GitHub                                  |
| Текущий `main`                | [`c356a40e`](https://github.com/Smira31/Mentalix/commit/c356a40ed44788344c4b031bb5abe54687f5ba17)                            | Squash-merge PR #282                    |
| Последний product-scope merge | [`6a59926c`](https://github.com/Smira31/Mentalix/commit/6a59926c4c1a74bc2b8401ed711c69347bcfafdd)                            | Squash-merge PR #281                    |
| Базовая CI-проверка           | 85/85 unit-тестов, lint, production build, docs-check и Playwright smoke                                                     | GitHub Actions                          |
| Состав CI                     | `npm run check:core`: unit, lint, production build и `docs:check`; затем health-check доступного Render backend              | [workflow](.github/workflows/ci.yml)    |
| Frontend hosting              | Vercel, URL: <https://mentalix.vercel.app>                                                                                   | [README.md](README.md)                  |
| Backend boundary              | Backend и Telegram bot находятся в приватном `Smira31/mentalix-bot`; их контракт и данные не предполагаются по frontend-коду | [AGENTS.md](AGENTS.md)                  |
| Backend hosting               | Render + Neon; health: `https://mentalix-bot.onrender.com/api/health`                                                        | приватный `mentalix-bot/RENDER.md` и CI |

## Честные ограничения snapshot

Успешная CI-проверка подтверждает состояние кода и внешний health-check, но сама по себе не подтверждает, какой именно commit обслуживает Vercel Production, работу data-dependent сценариев или Telegram/iPhone UX. Для заявлений о production/release необходимо приложить дату, Git SHA, URL deployment и отдельное runtime/manual evidence в связанном PR.

| Факт                                             | Статус                             | Следующее действие                                                                  |
| ------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------- |
| Vercel deployment provenance для текущего `main` | Не подтверждён в этом snapshot     | Проверить в Vercel отдельно от code-изменения и зафиксировать ссылку на deployment. |
| Telegram/iPhone gate для нового UI-scope         | Зависит от конкретной задачи       | Владелец подтверждает его в PR; browser smoke не является заменой.                  |
| Backend/API, данные, privacy и migration         | Не следуют из frontend-репозитория | Работать только по подтверждённому private contract и отдельному решению владельца. |

## Как обновлять этот файл

Изменяйте `PROJECT_STATE.md` только после проверенного merge, release, production/runtime проверки, инцидента или явного решения владельца. Записывайте только короткий факт с датой и доказательством. Активный backlog живёт в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), scope и checks конкретной работы — в GitHub Issue/PR, а исторические причины — в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и [`docs/archive/`](docs/archive/).

## Исторический snapshot

Полная прежняя версия этого файла сохранена в неизменяемой Git-истории на commit [`1f57511f`](https://github.com/Smira31/Mentalix/blob/1f57511f3b0d199ad6613fc205e1c782ec1fb347/PROJECT_STATE.md). Она содержит датированные записи и устаревшие статусы, поэтому не должна использоваться как источник текущего состояния.

## References

[1]: https://github.com/Smira31/Mentalix/pull/260 'Pull Request #260 — единый рабочий контур'
[2]: https://github.com/Smira31/Mentalix/actions/runs/33113340803 'GitHub Actions — успешная базовая проверка `main`'

## 2026-08-28 — reconciliation after final cleanup

- PR #272 added the four-phase Practices Journal and was followed by PR #277, #278, #279, #280, #281 and #282; all confirmed changes are represented in `main`.
- `Mentalix` and `mentalix-bot` have no open PRs and no remote branches besides `main`.
- Historical `automation/project-state-*`, draft and experimental branches were closed and deleted after the owner confirmed that current `main` is the single working source.
- Card Lab remains Preview/UI-lab-only; it does not define a production user flow or backend contract.
- Backend deployment source of truth is private `mentalix-bot/main`, especially `RENDER.md` and `.github/workflows/backend-jobs.yml`.
