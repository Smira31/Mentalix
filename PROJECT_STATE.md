---
status: current
last_verified: 2026-09-11
---

# PROJECT_STATE — подтверждённый current/release snapshot

> Этот файл фиксирует только проверяемое текущее состояние frontend-репозитория и release/production-факты. Он **не является backlog**: активные задачи находятся в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а подробный scope — в связанных GitHub Issue/PR.

**Последняя сверка:** 11.09.2026. Независимая проверка `origin/main` через GitHub API: HEAD = `b099dfe770b3660e389daea4222cb31fdf1756f0` (дата коммита 2026-09-11T19:27:25Z) — merge PR #598. Это документационная сверка, не production release и не замена ручному Telegram/iPhone gate. Предыдущий зафиксированный baseline: [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md) / PR #574 (`893ad72d`).

## Подтверждённые факты

| Область | Подтверждённый факт | Доказательство |
|---|---|---|
| Frontend repository | `Smira31/Mentalix`, каноническая ветка `main` | [GitHub](https://github.com/Smira31/Mentalix) |
| Текущий `main` | [`b099dfe770b3660e389daea4222cb31fdf1756f0`](https://github.com/Smira31/Mentalix/commit/b099dfe770b3660e389daea4222cb31fdf1756f0) — `ci: автоматизировать Cloudflare Owner QA Direct Upload (#598)`, 11.09.2026 | [commit](https://github.com/Smira31/Mentalix/commit/b099dfe770b3660e389daea4222cb31fdf1756f0), [PR #598](https://github.com/Smira31/Mentalix/pull/598) |
| Предыдущий baseline в `main` | [`893ad72d7f73792135a4b0ab6bde06b79d02ede9`](https://github.com/Smira31/Mentalix/commit/893ad72d7f73792135a4b0ab6bde06b79d02ede9) — docs: Phase 0 baseline snapshot (PR #574) | [PR #574](https://github.com/Smira31/Mentalix/pull/574), [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md) |
| Baseline frontend до #574 | `d4b908903d97be74e4ada645f843aafe024ecb91` | [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md) |
| Backend `main` | Приватный `Smira31/mentalix-bot`. SHA на момент этой сверки **не переподтверждён** публичным API (репозиторий private). В baseline был `d6694f58…`; отдельная сессия указывала `6b170e7` — требует проверки владельцем с доступом. | [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md); private repo |
| Scope C / Progress V2 | **Смёржен в `main` и присутствует в коде за флагом `VITE_PROGRESS_LAYOUT_V2`** | [PR #572](https://github.com/Smira31/Mentalix/pull/572), merge [`dfb6bed1`](https://github.com/Smira31/Mentalix/commit/dfb6bed18b86a83d21478c141badee6d8dc74072), `src/screens/Analytics.jsx` |
| Production | **Production:** `main` → Vercel project `mentalix` → <https://mentalix.vercel.app> | HTTP **200** на сверке 11.09.2026 ~20:28 UTC; `last-modified: Fri, 11 Sep 2026 20:23:15 GMT` |
| Owner QA Preview | **Owner QA Preview:** Vercel project `mentalix-preview` → <https://mentalix-preview.vercel.app> | HTTP **200** на сверке 11.09.2026 ~20:28 UTC |
| Render backend | `https://mentalix-bot.onrender.com`; `/api/health` → `{"status":"ok"}` | HTTP проверка 11.09.2026; SHA работающего Render deployment не подтверждён |
| Unit и CI | CI workflows на `main` присутствуют; конкретный run ID после #598 не пересчитывался в этой сверке | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |

## Merge inventory после baseline PR #574

Проверено по GitHub API commits на `main` от `893ad72d` (не включая) до `b099dfe7` (включая). Ниже — все merge-коммиты с номером PR; краткая суть без оценки.

| PR | Краткая суть | Merge commit (short) |
|---:|---|---|
| [#575](https://github.com/Smira31/Mentalix/pull/575) | docs: каноническая карта окружений | `fef12f35` |
| [#576](https://github.com/Smira31/Mentalix/pull/576) | ci: advisory documentation drift checks | `8be3783e` |
| [#577](https://github.com/Smira31/Mentalix/pull/577) | fix(progress): типографика, контраст, tap targets | `ca8296eb` |
| [#578](https://github.com/Smira31/Mentalix/pull/578) | docs: запись об удалении устаревших TypeScript-копий | `2c3a583c` |
| [#579](https://github.com/Smira31/Mentalix/pull/579) | Усиление frontend API contract checks | `81c2250b` |
| [#580](https://github.com/Smira31/Mentalix/pull/580) | fix(today): accessibility и tap targets | `690106b0` |
| [#581](https://github.com/Smira31/Mentalix/pull/581) | docs: canonical index и freshness advisory | `0817b9b9` |
| [#591](https://github.com/Smira31/Mentalix/pull/591) | Modify dark theme colors and text size scale | `4d1b0769` |
| [#590](https://github.com/Smira31/Mentalix/pull/590) | Update text size scale and spacing tokens | `21d7461c` |
| [#588](https://github.com/Smira31/Mentalix/pull/588) | fix: Путь/История — a11y, типографика, тап-таргеты | `f77ac70a` |
| [#587](https://github.com/Smira31/Mentalix/pull/587) | fix: Наставник — a11y, типографика, тап-таргеты | `cb92e9a4` |
| [#586](https://github.com/Smira31/Mentalix/pull/586) | fix: Практики — a11y, типографика, тап-таргеты | `9e8ee4d5` |
| [#585](https://github.com/Smira31/Mentalix/pull/585) | fix: Библиотека — a11y, типографика, тап-таргеты | `9b4e38c2` |
| [#594](https://github.com/Smira31/Mentalix/pull/594) | ci: сторож Production для Vercel | `64b287b2` |
| [#558](https://github.com/Smira31/Mentalix/pull/558) | chore(deps-dev): bump js-yaml 4.3.1 → 4.3.2 | `1418af79` |
| [#597](https://github.com/Smira31/Mentalix/pull/597) | docs: направления редизайна пикера персон | `361489b0` |
| [#596](https://github.com/Smira31/Mentalix/pull/596) | ci: skip Vercel builds for non-runtime changes | `c77bb388` |
| [#595](https://github.com/Smira31/Mentalix/pull/595) | fix(ci): quote watchdog event output | `48320f9b` |
| [#598](https://github.com/Smira31/Mentalix/pull/598) | ci: автоматизировать Cloudflare Owner QA Direct Upload | `b099dfe7` |

**19 PR** после #574. PR [#589](https://github.com/Smira31/Mentalix/pull/589) **не** входит в inventory: на момент сверки открыт.

### Факты по PR #590 и #591

- **#590** (`21d7461c`): обновлены шкала размера текста (text size scale) и spacing tokens.
- **#591** (`4d1b0769`): изменены цвета тёмной темы (dark theme colors) и шкала размера текста.

Вопрос о пересечении этих изменений со **светлой темой** остаётся отдельным открытым вопросом владельца. Этот snapshot **не** содержит решения и **не** интерпретирует влияние на light theme.

## Канонический словарь окружений

- **Production** — `main` → Vercel project `mentalix` → <https://mentalix.vercel.app>.
- **Owner QA Preview** — Vercel project `mentalix-preview` → <https://mentalix-preview.vercel.app>.
- **UI Lab** — встроенные экспериментальные маршруты в репозитории; это не Production.
- **Local Preview** — `vite preview` после production build.
- **Branch Deployment** — временный Vercel deployment под конкретный branch/commit; это не канонический Owner QA Preview.
- **Cloudflare Owner QA** — Pages project `mentalix-owner-qa` (workflow из #598); не Production и не замена iPhone/Telegram gate.

## Ограничения подтверждения

Зелёный CI и HTTP health-check подтверждают автоматические проверки и доступность маршрутов, но **не заменяют реальный iPhone/Telegram UX gate**. Не следует объявлять Telegram WebView, safe-area, keyboard или полноразмерный ручной core-loop gate пройденными только по CI, desktop smoke или HTTP 200.

Production URL и `/api/health` проверяются при каждой значимой сверке. Эта проверка подтверждает доступность на момент сверки, но не является доказательством всех data-dependent сценариев или постоянного deployment provenance. SHA фактически обслуживаемых Vercel и Render deployment в этой сверке не подтверждён credentials.

## Правило обновления

Изменяйте `PROJECT_STATE.md` только после проверенного merge, release, production/runtime проверки, инцидента или явного решения владельца. Записывайте короткий факт с датой и доказательством. Активный backlog живёт в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а исторические причины — в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

## References

[1]: https://github.com/Smira31/Mentalix/commit/b099dfe770b3660e389daea4222cb31fdf1756f0 'Текущий frontend main на сверке 11.09.2026'
[2]: https://mentalix.vercel.app 'Production: Vercel project mentalix'
[3]: https://mentalix-preview.vercel.app 'Owner QA Preview: Vercel project mentalix-preview'
