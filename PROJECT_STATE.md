---
status: current
last_verified: 2026-09-27
---

# PROJECT_STATE — подтверждённое состояние Mentalix

Этот файл содержит только проверенные факты о репозиториях, окружениях, release provenance и активных GitHub-треках. Активный backlog находится в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md). История решений находится в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

**Последняя сверка:** 27.09.2026. GitHub `origin/main` и Issues сверены после merged PR #904.

Текущий `main`: `767a3b55e69d670cb3ea9b2adbd6704f0d734a70` ([PR #904](https://github.com/Smira31/Mentalix/pull/904), возрастной порог публичного MVP 18+). Это SHA исходного `main` для документной сверки, а не утверждение о точном SHA уже развернутого Production.

## Каноническое состояние

| Область             | Факт                                                                                 | Доказательство                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Card System v2    | Нормативная спецификация в `DESIGN_SYSTEM.md` §5.1, решение владельца от 22.09.2026 | [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) §5.1 |
| Card System v1      | [`docs/archive/CARD_SYSTEM_V1_2026-09-22.md`](docs/archive/CARD_SYSTEM_V1_2026-09-22.md), статус `archived` | Архив; не текущий источник истины |
| Frontend            | `Smira31/Mentalix`, default branch `main`                                            | [GitHub](https://github.com/Smira31/Mentalix)                                                                        |
| Frontend `main`     | commit `767a3b55e69d670cb3ea9b2adbd6704f0d734a70` после мержа PR #904 | [commit](https://github.com/Smira31/Mentalix/commit/767a3b55e69d670cb3ea9b2adbd6704f0d734a70) |
| Production frontend | Policy: `main → Firebase Hosting Live channel → https://mentalix-production.web.app`; exact deployed SHA для #904 в этой сверке не подтверждён | [Firebase workflow](https://github.com/Smira31/Mentalix/actions/workflows/firebase-hosting.yml); run 35119350799 подтверждал прежний snapshot, не #904 |
| Demo Preview        | Cloudflare Pages project `mentalix-owner-qa` → `https://mentalix-owner-qa.pages.dev` | workflow [Cloudflare Owner QA](https://github.com/Smira31/Mentalix/actions/workflows/cloudflare-owner-qa.yml)        |
| Backend             | `Smira31/mentalix-bot`, `main`                                                       | [GitHub](https://github.com/Smira31/mentalix-bot)                                                                    |
| Backend runtime     | Исторический адрес health: `https://mentalix-bot.onrender.com/api/health`; текущий статус backend не проверялся в этой docs-сверке | Приватный `mentalix-bot` и отдельная runtime-проверка обязательны для актуального статуса |
| Vercel              | Git integration отключена у проектов `mentalix` и `mentalix-preview`                 | Vercel git context: linked projects отсутствуют                                                                      |

## Канонический словарь окружений

- **Demo Preview:** Cloudflare Pages, ручной exact-SHA deploy для быстрой визуальной и Telegram/iPhone QA-проверки.
- **Production:** Firebase Hosting Live channel, автоматический deploy только из `main`.
- **Local Preview:** `vite preview` после production build.
- **UI Lab:** экспериментальные маршруты внутри репозитория; не Production.
- **Vercel:** старый fallback, не используется для новых deploy/checks.

## Hosting policy

1. Разработка и быстрая визуальная проверка выполняются через Cloudflare Demo Preview.
2. После QA изменения проходят обычный PR и обязательный GitHub check `Базовая проверка проекта`.
3. Merge в `main` запускает Firebase Hosting Production deploy.
4. Firebase Preview Channels, Vercel Preview и Vercel watchdog не используются.
5. Render backend не переносится в рамках frontend-задач.

Полная policy: [`docs/handoffs/2026-09-16-hosting-policy.md`](docs/handoffs/2026-09-16-hosting-policy.md).

## Release snapshot и GitHub на 27.09.2026

- `main` после [#904](https://github.com/Smira31/Mentalix/pull/904): публичный MVP **18+**, 16–17 отложены до v1.1 (см. `PRODUCT.md` и решение владельца в `docs/core/PRODUCT_DECISIONS.md`). Не путать commit `main` с доказательством exact-SHA production deployment: post-#904 Firebase run и ручной Web/PWA/Telegram gate здесь не подтверждены.
- [#903](https://github.com/Smira31/Mentalix/pull/903) добавил frontend gate: Telegram user screens монтируются только после появления user и подписанного `initData`; API отправляет `Authorization: tma ...`. Это **не** доказательство backend-проверки подписи или полномочий.
- Web/PWA в `main`: [#847](https://github.com/Smira31/Mentalix/pull/847) server-backed guest → [#861](https://github.com/Smira31/Mentalix/pull/861) bearer session → [#863](https://github.com/Smira31/Mentalix/pull/863) automatic guest login → [#883](https://github.com/Smira31/Mentalix/pull/883) guest save UX. `src/App.jsx`, `src/lib/guestAuth.js`, `src/platform/web.adapter.js`, `src/lib/api.js` подтверждают текущий frontend-контракт. [#615](https://github.com/Smira31/Mentalix/issues/615) первоначально запрещал anonymous backend accounts и предписывал local-only guest; этот аспект **superseded фактической реализацией**, остальной scope лишь частично superseded. [#789](https://github.com/Smira31/Mentalix/issues/789) оставлял выбор storage/merge открытым; фактическая архитектура не равна новому решению владельца по всем вопросам Issue.
- Данные **из evidence, переданного владельцем для этой сверки** (не независимая live DB-проверка): 322 active unmerged guest accounts, один email-only account (владелец/разработчик, использовался для тестирования), aggregate audit не выявил guest personal-content debt. Ничего не удалено и состояние DB не менялось. Известный production defect: отрицательный guest id не является canonical `users` row, `pinned_practices` → HTTP 500. Backend status и полноту guest merge без отдельной проверки не утверждать.
- GitHub API: **0 открытых PR, 9 открытых Issues** до этого PR. [#766](https://github.com/Smira31/Mentalix/issues/766) и [#767](https://github.com/Smira31/Mentalix/issues/767) остаются открытыми, несмотря на merged #852 (ESLint 10) / #862 (`@twa-dev/sdk` 8.0.2). Не закрывать автоматически; владелец сверяет acceptance. Закрытые #623/#620/#618/#612/#600/#480 больше не активные задачи.

Текущий активный backlog — только [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md); открытая Issue не означает готовность к работе. Release blocker: HTTP 500 на разрешённой гостю функции и отсутствие подтверждённого Web/PWA end-to-end gate ([`docs/testing/RELEASE_GATE.md`](docs/testing/RELEASE_GATE.md)).

## Исторический документный контекст

Одноразовые аудиты доступности практик, fullscreen-flow и SHA-синхронизации сохранены в [`docs/audit/archive/`](docs/audit/archive/) и не являются текущим production-контрактом. Канонический текущий статус репозитория находится в этом файле; архивные отчёты используются только для исторического контекста и traceability.

## Ограничения подтверждения

Зелёный CI и HTTP 200 не заменяют manual iPhone/Telegram gate. Нельзя объявлять safe-area, keyboard, Telegram WebView или data-dependent сценарии пройденными без соответствующей ручной проверки.

## References

[1]: https://github.com/Smira31/Mentalix/commit/767a3b55e69d670cb3ea9b2adbd6704f0d734a70 'Current frontend main after PR #904'
[2]: https://mentalix-production.web.app 'Mentalix Firebase Production'
[3]: https://mentalix-owner-qa.pages.dev 'Mentalix Cloudflare Demo Preview'
[4]: https://github.com/Smira31/Mentalix/actions/workflows/firebase-hosting.yml 'Firebase Hosting workflow'
