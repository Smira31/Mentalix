---
status: current
last_verified: 2026-09-10
---

# PROJECT_STATE — подтверждённый current/release snapshot

> Этот файл фиксирует только проверяемое текущее состояние frontend-репозитория и release/production-факты. Он **не является backlog**: активные задачи находятся в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а подробный scope — в связанных GitHub Issue/PR.

**Последняя сверка:** 11.09.2026, read-only сверка GitHub после создания Issue #600. Это документационная Phase 0 сверка; она не является production release и не заменяет ручной Telegram/iPhone gate. Предыдущий baseline: [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md).

## Подтверждённые факты

| Область | Подтверждённый факт | Доказательство |
|---|---|---|
| Frontend repository | `Smira31/Mentalix`, каноническая ветка `main` | [GitHub](https://github.com/Smira31/Mentalix) |
| Текущий `main` | [`b099dfe770b3660e389daea4222cb31fdf1756f0`](https://github.com/Smira31/Mentalix/commit/b099dfe770b3660e389daea4222cb31fdf1756f0) — актуальный `origin/main` на момент read-only сверки 11.09.2026 | [GitHub main](https://github.com/Smira31/Mentalix/tree/main) |
| Baseline frontend до merge | `d4b908903d97be74e4ada645f843aafe024ecb91` | [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md) |
| Backend `main` на момент сверки | [`6b170e7`](https://github.com/Smira31/mentalix-bot/commit/6b170e7) — актуальный `main` приватного backend-репозитория на момент read-only сверки 11.09.2026 | [Backend main](https://github.com/Smira31/mentalix-bot/tree/main) |
| Scope C / Progress V2 | **Смёржен в `main` и присутствует в текущем коде за флагом `VITE_PROGRESS_LAYOUT_V2`** | [PR #572](https://github.com/Smira31/Mentalix/pull/572), merge commit [`dfb6bed18b86a83d21478c141badee6d8dc74072`](https://github.com/Smira31/Mentalix/commit/dfb6bed18b86a83d21478c141badee6d8dc74072), `src/screens/Analytics.jsx` |
| Координационный трек | [Issue #600](https://github.com/Smira31/Mentalix/issues/600) — граф разработки и evaluator–optimizer; Phase 0 ограничена синхронизацией состояния и task passport | GitHub Issue #600 |
| Open PRs | На момент сверки открыты PR #599, #593, #592, #589, #584 и #565; они не являются частью Issue #600 и не меняются этим PR | [Open PRs](https://github.com/Smira31/Mentalix/pulls) |
| Production | **Production:** `main` → Vercel project `mentalix` → <https://mentalix.vercel.app> | `README.md`, Vercel URL; HTTP 200 на сверке 10.09.2026 |
| Owner QA Preview | **Owner QA Preview:** Vercel project `mentalix-preview` → <https://mentalix-preview.vercel.app> | `README.md`, Vercel URL; HTTP 200 на сверке 10.09.2026 |
| Render backend | `https://mentalix-bot.onrender.com`; `/api/health` вернул `{"status":"ok"}` | [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md); SHA работающего Render deployment не подтверждён |
| Unit и CI baseline | `npm run check:core`, `npm run docs:drift`, Playwright UX smoke/MXL-010, backend health, dependency audit — последний frontend CI run `34510045515` успешен | [`.github/workflows/ci.yml`](.github/workflows/ci.yml), [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md) |

## Канонический словарь окружений

- **Production** — `main` → Vercel project `mentalix` → <https://mentalix.vercel.app>.
- **Owner QA Preview** — Vercel project `mentalix-preview` → <https://mentalix-preview.vercel.app>.
- **UI Lab** — встроенные экспериментальные маршруты в репозитории; это не Production.
- **Local Preview** — `vite preview` после production build.
- **Branch Deployment** — временный Vercel deployment под конкретный branch/commit; это не канонический Owner QA Preview.

## Ограничения подтверждения

Зелёный CI и HTTP health-check подтверждают автоматические проверки и доступность маршрутов, но **не заменяют реальный iPhone/Telegram UX gate**. Не следует объявлять Telegram WebView, safe-area, keyboard или полноразмерный ручной core-loop gate пройденными только по CI, desktop smoke или HTTP 200.

Production URL и `/api/health` проверяются при каждой значимой сверке. Эта проверка подтверждает доступность на момент сверки, но не является доказательством всех data-dependent сценариев или постоянного deployment provenance. SHA фактически обслуживаемых Vercel и Render deployment в baseline не удалось подтвердить доступными credentials.

## Правило обновления

Изменяйте `PROJECT_STATE.md` только после проверенного merge, release, production/runtime проверки, инцидента или явного решения владельца. Записывайте короткий факт с датой и доказательством. Активный backlog живёт в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а исторические причины — в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

## References

[1]: https://github.com/Smira31/Mentalix/commit/b099dfe770b3660e389daea4222cb31fdf1756f0 'Текущий frontend main на сверке 11.09.2026'
[2]: https://mentalix.vercel.app 'Production: Vercel project mentalix'
[3]: https://mentalix-preview.vercel.app 'Owner QA Preview: Vercel project mentalix-preview'
