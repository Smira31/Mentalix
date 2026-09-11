---
status: current
last_verified: 2026-09-11
---

# PROJECT_STATE — подтверждённый current/release snapshot

> Этот файл фиксирует только проверяемое текущее состояние frontend-репозитория и release/production-факты. Он **не является backlog**: активные задачи находятся в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а подробный scope — в связанных GitHub Issue/PR.

**Последняя сверка:** 11.09.2026, read-only сверка GitHub, открытых PR и runtime endpoints. Текущий `main` — `b099dfe7`; это документационная сверка, не production release и не замена ручному Telegram/iPhone gate. Предыдущий baseline: [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md).

## Подтверждённые факты

| Область | Подтверждённый факт | Доказательство |
|---|---|---|
| Frontend repository | `Smira31/Mentalix`, каноническая ветка `main` | [GitHub](https://github.com/Smira31/Mentalix) |
| Текущий `main` | [`b099dfe770b3660e389daea4222cb31fdf1756f0`](https://github.com/Smira31/Mentalix/commit/b099dfe770b3660e389daea4222cb31fdf1756f0) — актуальный `origin/main` на момент read-only сверки 11.09.2026 | [GitHub main](https://github.com/Smira31/Mentalix/tree/main) |
| Baseline frontend до merge | `d4b908903d97be74e4ada645f843aafe024ecb91` | [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md) |
| Backend `main` на момент сверки | `6b170e7` (`6b170e7d0fd0af7e532a1bbb1bc4b9593de0f90f`) — актуальный `main` приватного backend-репозитория `Smira31/mentalix-bot` на момент сверки 11.09.2026 | Подтверждено **authenticated GitHub API** аккаунта владельца (Smira31) к private repo; публичная ссылка стороннему читателю недоступна |
| Scope C / Progress V2 | **Смёржен в `main` и присутствует в текущем коде за флагом `VITE_PROGRESS_LAYOUT_V2`** | [PR #572](https://github.com/Smira31/Mentalix/pull/572), merge commit [`dfb6bed18b86a83d21478c141badee6d8dc74072`](https://github.com/Smira31/Mentalix/commit/dfb6bed18b86a83d21478c141badee6d8dc74072), `src/screens/Analytics.jsx` |
| Координационный трек | [Issue #600](https://github.com/Smira31/Mentalix/issues/600) — граф разработки и evaluator–optimizer; Phase 0 ограничена синхронизацией состояния и task passport | GitHub Issue #600 |
| Open PRs | На момент сверки открыты PR #601, #599, #593, #592, #589, #584 и #565; #601 относится к Issue #600, остальные являются отдельными треками | [Open PRs](https://github.com/Smira31/Mentalix/pulls) |
| Production | **Production:** `main` → Vercel project `mentalix` → <https://mentalix.vercel.app>; HTTP 200 на сверке 11.09.2026 | `README.md`, [Production](https://mentalix.vercel.app) |
| Owner QA Preview | **Owner QA Preview:** Vercel project `mentalix-preview` → <https://mentalix-preview.vercel.app>; HTTP 200 на сверке 11.09.2026 | `README.md`, [Preview](https://mentalix-preview.vercel.app) |
| Render backend | `https://mentalix-bot.onrender.com`; `/api/health` вернул `{"status":"ok"}`; HTTP 200 на сверке 11.09.2026 | [Health endpoint](https://mentalix-bot.onrender.com/api/health); SHA работающего Render deployment не подтверждён |
| Unit и CI baseline | `npm run check:core`, `npm run docs:drift`, Playwright UX smoke/MXL-010, backend health, dependency audit — последний frontend CI run `34510045515` успешен | [`.github/workflows/ci.yml`](.github/workflows/ci.yml), [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md) |

## Канонический словарь окружений

- **Production** — `main` → Vercel project `mentalix` → <https://mentalix.vercel.app>.
- **Owner QA Preview** — Vercel project `mentalix-preview` → <https://mentalix-preview.vercel.app>.
- **UI Lab** — встроенные экспериментальные маршруты в репозитории; это не Production.
- **Local Preview** — `vite preview` после production build.
- **Branch Deployment** — временный Vercel deployment под конкретный branch/commit; это не канонический Owner QA Preview.

## Merge inventory после baseline PR #574

Проверено через GitHub compare от baseline-коммита PR #574 до текущего `main` `b099dfe770b3660e389daea4222cb31fdf1756f0`. Ниже перечислены все 19 PR, смёрженных после baseline; это фиксация фактов без оценки и без решения по светлой теме.

| PR | Краткая суть | Merge commit |
|---:|---|---|
| [#575](https://github.com/Smira31/Mentalix/pull/575) | Зафиксирована каноническая карта окружений. | `fef12f3` |
| [#576](https://github.com/Smira31/Mentalix/pull/576) | Добавлены advisory-проверки документационного drift. | `8be3783` |
| [#577](https://github.com/Smira31/Mentalix/pull/577) | В Progress выровнены типографика, контраст и tap targets. | `ca8296e` |
| [#578](https://github.com/Smira31/Mentalix/pull/578) | Зафиксировано удаление устаревших TypeScript-копий. | `2c3a583` |
| [#579](https://github.com/Smira31/Mentalix/pull/579) | Добавлена проверка frontend API-контракта. | `81c2250` |
| [#580](https://github.com/Smira31/Mentalix/pull/580) | В Today выровнены accessibility и tap targets. | `690106b` |
| [#581](https://github.com/Smira31/Mentalix/pull/581) | Добавлены индекс документации и снижение стоимости контекста. | `0817b9b` |
| [#585](https://github.com/Smira31/Mentalix/pull/585) | В Library исправлены a11y, типографика и tap targets. | `9b4e38c` |
| [#586](https://github.com/Smira31/Mentalix/pull/586) | В Practices исправлены a11y, типографика и tap targets. | `9e8ee4d` |
| [#587](https://github.com/Smira31/Mentalix/pull/587) | В Mentor исправлены a11y, типографика и tap targets. | `cb92e9a` |
| [#588](https://github.com/Smira31/Mentalix/pull/588) | В Path/History исправлены a11y, типографика и tap targets. | `f77ac70` |
| [#590](https://github.com/Smira31/Mentalix/pull/590) | Обновлены шкала размера текста и spacing tokens. | `21d7461` |
| [#591](https://github.com/Smira31/Mentalix/pull/591) | Изменены цвета тёмной темы и шкала размера текста. | `4d1b076` |
| [#594](https://github.com/Smira31/Mentalix/pull/594) | Добавлен Vercel Production Watchdog. | `64b287b` |
| [#595](https://github.com/Smira31/Mentalix/pull/595) | Исправлено quoting watchdog event output. | `48320f9` |
| [#596](https://github.com/Smira31/Mentalix/pull/596) | Добавлен skip Vercel builds для non-runtime изменений. | `c77bb38` |
| [#597](https://github.com/Smira31/Mentalix/pull/597) | Зафиксированы пять направлений редизайна picker-а персон «Наставник». | `361489b` |
| [#598](https://github.com/Smira31/Mentalix/pull/598) | Автоматизирован Cloudflare Owner QA Direct Upload. | `b099dfe` |

PR [#589](https://github.com/Smira31/Mentalix/pull/589) не входит в merged inventory: на момент сверки он открыт.

### Факты по PR #590 и #591

PR #590 изменил шкалу размера текста и spacing tokens. PR #591 изменил цвета тёмной темы и шкалу размера текста. Вопрос о пересечении этих изменений со светлой темой остаётся отдельным открытым вопросом владельца; этот snapshot не содержит решения по нему.

## Ограничения подтверждения

Зелёный CI и HTTP health-check подтверждают автоматические проверки и доступность маршрутов, но **не заменяют реальный iPhone/Telegram UX gate**. Не следует объявлять Telegram WebView, safe-area, keyboard или полноразмерный ручной core-loop gate пройденными только по CI, desktop smoke или HTTP 200.

Production URL и `/api/health` проверяются при каждой значимой сверке. Эта проверка подтверждает доступность на момент сверки, но не является доказательством всех data-dependent сценариев или постоянного deployment provenance. SHA фактически обслуживаемых Vercel и Render deployment в baseline не удалось подтвердить доступными credentials.

## Правило обновления

Изменяйте `PROJECT_STATE.md` только после проверенного merge, release, production/runtime проверки, инцидента или явного решения владельца. Записывайте короткий факт с датой и доказательством. Активный backlog живёт в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md), а исторические причины — в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

## References

[1]: https://github.com/Smira31/Mentalix/commit/b099dfe770b3660e389daea4222cb31fdf1756f0 'Текущий frontend main на сверке 11.09.2026'
[2]: https://mentalix.vercel.app 'Production: Vercel project mentalix'
[3]: https://mentalix-preview.vercel.app 'Owner QA Preview: Vercel project mentalix-preview'
