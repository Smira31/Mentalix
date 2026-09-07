# PROJECT_STATE — подтверждённый current/release snapshot

> Этот файл фиксирует только проверяемое текущее состояние frontend-репозитория и release/production-факты. Он **не является backlog**: активные задачи находятся в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а подробный scope — в связанных GitHub Issue/PR.

**Последняя сверка:** 07.09.2026 (после merge PR #529 / close Issue #521).

## Подтверждённые факты

| Область             | Подтверждённый факт                                                                                                                        | Доказательство                                                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend repository | `Smira31/Mentalix`, каноническая ветка `main`                                                                                              | GitHub                                                                                                                                                                                                                                                                          |
| Текущий `main`      | [`2ac034de8a01392280e6b1ba885cfdac7f3725ab`](https://github.com/Smira31/Mentalix/commit/2ac034de8a01392280e6b1ba885cfdac7f3725ab)          | Squash merge PR #529 (MeditationFlow guided grammar; Issue #521)                                                                                                                                                                                                                |
| Последние merged PR | PR #520 (Practices Catalog v2); PR #532 (canon / Preview); PR #533 (agent workflow gates); PR #529 (Meditation UX) влиты в `main`          | [PR #520](https://github.com/Smira31/Mentalix/pull/520), [PR #532](https://github.com/Smira31/Mentalix/pull/532), [PR #533](https://github.com/Smira31/Mentalix/pull/533), [PR #529](https://github.com/Smira31/Mentalix/pull/529) |
| Active open PR      | нет                                                                                                                                         | —                                                                                                                                                                                                                                                                               |
| Frontend production | **Единственный канонический frontend production — Vercel project `mentalix`:** <https://mentalix.vercel.app>                               | [README.md](README.md), [`AGENTS.md`](AGENTS.md), Vercel                                                                                                                                                                                                                        |
| QA / Preview        | **Канонический owner QA project — `mentalix-preview`:** <https://mentalix-preview.vercel.app> только. Branch/deployment URL владельцу не отдавать. | Vercel project `mentalix-preview`, workflow Telegram Preview                                                                                                                                                                                                                    |
| Unit и CI baseline  | Состав CI: `npm run check:core`, `npm run docs:drift`, Playwright `ux:check`, backend health, dependency audit                             | [`.github/workflows/ci.yml`](.github/workflows/ci.yml)                                                                                                                                                                                                                          |
| GitHub Pages        | GitHub Pages workflow удалён ранее; GitHub Pages не является product deployment                                                            | historical                                                                                                                                                                                                                                                                      |
| Open Issues (product queue) | Каноническая очередь: #510/#522 → #523 → #524 → #525 → #526 → #527. Completed: #521 via #529. Deferred: #514, #515, #516, #480. | GitHub Issues после cleanup 07.09.2026                                                                                                                                                                                                                                          |
| Starter Set         | Starter Set реализован в frontend, default-off: `import.meta.env.VITE_STARTER_SET_ENABLED === 'true'`                                       | текущий `src/screens/Today.jsx`                                                                                                                                                                                                                                                 |

## Ограничения подтверждения

Зелёный CI и HTTP health-check подтверждают автоматические проверки и доступность маршрутов, но **не заменяют реальный iPhone/Telegram UX gate**. Не следует объявлять Telegram WebView, safe-area, keyboard или полноразмерный ручной core-loop gate пройденными только по CI, desktop smoke или HTTP 200.

Production URL и `/api/health` проверяются при каждой значимой сверке. Эта проверка подтверждает доступность на момент сверки, но не является доказательством всех data-dependent сценариев или постоянного deployment provenance.

## Правило обновления

Изменяйте `PROJECT_STATE.md` только после проверенного merge, release, production/runtime проверки, инцидента или явного решения владельца. Записывайте короткий факт с датой и доказательством. Активный backlog живёт в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а исторические причины — в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

## References

[1]: https://github.com/Smira31/Mentalix/commit/2ac034de8a01392280e6b1ba885cfdac7f3725ab 'Текущий main после #529'
[2]: https://mentalix.vercel.app 'Канонический Vercel production (project mentalix)'
[3]: https://mentalix-preview.vercel.app 'Канонический owner QA Preview (project mentalix-preview)'
