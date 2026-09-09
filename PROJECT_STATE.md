# PROJECT_STATE — подтверждённый current/release snapshot

> Этот файл фиксирует только проверяемое текущее состояние frontend-репозитория и release/production-факты. Он **не является backlog**: активные задачи находятся в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а подробный scope — в связанных GitHub Issue/PR.

**Последняя сверка:** 09.09.2026 (после merge PR #553 / close Issue #547).

## Подтверждённые факты

| Область                     | Подтверждённый факт                                                                                                                                  | Доказательство                                                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend repository         | `Smira31/Mentalix`, каноническая ветка `main`                                                                                                        | GitHub                                                                                                                                                                                                                             |
| Текущий `main`              | [`27b78f725a38b68e046a7b6466157125fbb9f767`](https://github.com/Smira31/Mentalix/commit/27b78f725a38b68e046a7b6466157125fbb9f767)                    | Squash merge PR #553 (approved Practices composition; Issue #547)                                                                                                                                                                  |
| Последние merged PR         | PR #549 (Practices polish); PR #551 (deployment cost control); PR #552 (UI Lab); PR #553 (production integration) влиты в `main`                     | [PR #549](https://github.com/Smira31/Mentalix/pull/549), [PR #551](https://github.com/Smira31/Mentalix/pull/551), [PR #552](https://github.com/Smira31/Mentalix/pull/552), [PR #553](https://github.com/Smira31/Mentalix/pull/553) |
| Active open PR              | нет                                                                                                                                                  | —                                                                                                                                                                                                                                  |
| Frontend production         | **Единственный канонический frontend production — Vercel project `mentalix`:** <https://mentalix.vercel.app>                                         | [README.md](README.md), [`AGENTS.md`](AGENTS.md), Vercel                                                                                                                                                                           |
| QA / Preview                | **Канонический owner QA project — `mentalix-preview`:** <https://mentalix-preview.vercel.app> только. Branch/deployment URL владельцу не отдавать.   | Vercel project `mentalix-preview`, workflow Telegram Preview                                                                                                                                                                       |
| Unit и CI baseline          | Состав CI: `npm run check:core`, `npm run docs:drift`, Playwright `ux:check`, backend health, dependency audit                                       | [`.github/workflows/ci.yml`](.github/workflows/ci.yml)                                                                                                                                                                             |
| GitHub Pages                | GitHub Pages workflow удалён ранее; GitHub Pages не является product deployment                                                                      | historical                                                                                                                                                                                                                         |
| Open Issues (product queue) | Каноническая очередь: #526 → #527. #526 в работе через отдельный Preview-only UI Lab; #527 не начинать до закрытия #526. Deferred: #515, #516, #480. | GitHub Issues и `docs/TASK_INDEX.md` после сверки 09.09.2026                                                                                                                                                                       |
| Starter Set                 | Starter Set реализован в frontend, default-off: `import.meta.env.VITE_STARTER_SET_ENABLED === 'true'`                                                | текущий `src/screens/Today.jsx`                                                                                                                                                                                                    |

## Ограничения подтверждения

Зелёный CI и HTTP health-check подтверждают автоматические проверки и доступность маршрутов, но **не заменяют реальный iPhone/Telegram UX gate**. Не следует объявлять Telegram WebView, safe-area, keyboard или полноразмерный ручной core-loop gate пройденными только по CI, desktop smoke или HTTP 200.

Production URL и `/api/health` проверяются при каждой значимой сверке. Эта проверка подтверждает доступность на момент сверки, но не является доказательством всех data-dependent сценариев или постоянного deployment provenance.

## Правило обновления

Изменяйте `PROJECT_STATE.md` только после проверенного merge, release, production/runtime проверки, инцидента или явного решения владельца. Записывайте короткий факт с датой и доказательством. Активный backlog живёт в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а исторические причины — в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

## References

[1]: https://github.com/Smira31/Mentalix/commit/27b78f725a38b68e046a7b6466157125fbb9f767 'Текущий main после #553'
[2]: https://mentalix.vercel.app 'Канонический Vercel production (project mentalix)'
[3]: https://mentalix-preview.vercel.app 'Канонический owner QA Preview (project mentalix-preview)'
