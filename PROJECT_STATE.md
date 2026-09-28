---
status: current
last_verified: 2026-09-27
---

# PROJECT_STATE — подтверждённое состояние Mentalix

Этот файл содержит только проверенные факты о репозиториях, окружениях, release provenance и активных GitHub-треках. Активный backlog находится в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md). История решений находится в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

**Последняя сверка:** 27.09.2026. Документная база после PR #905 (`main` `1daa58b0ffe8fc742c936d6b226e74c72f52e53a`); решения владельца от 27.09 имеют приоритет над прежними планами. Статус реализации и production deployment отдельно не подтверждён. Исторический snapshot после #904: `767a3b55e69d670cb3ea9b2adbd6704f0d734a70` (18+); это не exact-SHA Production.

## Решения владельца от 27.09.2026 (цель, не утверждение о готовности)

- Один оркестратор — Claude; агенты A (`mentalix-bot`), B и C (`Mentalix`). Приоритет: сначала визуал «как Stoic» (Шаги/Explore, поток записи, значки, профиль, низ «Сегодня»), затем релиз v1.0.
- v1.0 — **только Telegram Mini App**; Web/PWA gate переносится на период после v1.0 и не блокирует его. Исторический Web/PWA blocker остаётся дефектом для web-сценария, но не blocker Telegram v1.0.
- Целевая серия **мягкая**: любая завершённая активность за день (чек-ин, журнал, ритуал, аскеза, «Настроение», направленная запись); один пропуск в календарную неделю не рвёт серию; «Верни серию» доступно за вчера. «Canonical streak v1» (только чек-ин/журнал, строго подряд) **заменено решением 27.09**. Реализация в работе у A в `mentalix-bot`, ветка `feat/soft-streak`; не выдавать за готовую.
- 18+ сохраняется. Засечки — только в заголовках разделов экранов Explore. Карточки «Сегодня» 260/233 и анимация сжатия — эталон Stoic для визуальной сверки, не заявление о текущем UI.
- Telegram v1.0 gate: визуал по референсам, мягкая серия, Privacy Policy v1.0 опубликована в приложении, PrivacyNotice/Settings не обещают больше серверных возможностей, чем есть, финальный QA владельца на iPhone, нет P0/P1. **Проверить с юристом до публичного запуска:** 152-ФЗ, данные о настроении/психсостоянии как особая категория, согласие, уведомление РКН. См. [`docs/testing/RELEASE_GATE.md`](docs/testing/RELEASE_GATE.md).

## Каноническое состояние

| Область             | Факт                                                                                 | Доказательство                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Card System v2    | Нормативная спецификация в `DESIGN_SYSTEM.md` §5.1, решение владельца от 22.09.2026 | [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) §5.1 |
| Card System v1      | [`docs/archive/CARD_SYSTEM_V1_2026-09-22.md`](docs/archive/CARD_SYSTEM_V1_2026-09-22.md), статус `archived` | Архив; не текущий источник истины |
| Frontend            | `Smira31/Mentalix`, default branch `main`                                            | [GitHub](https://github.com/Smira31/Mentalix)                                                                        |
| Frontend `main`     | commit `1daa58b0ffe8fc742c936d6b226e74c72f52e53a` после мержа PR #905 (на момент сверки); #904 — предыдущий snapshot | [commit](https://github.com/Smira31/Mentalix/commit/1daa58b0ffe8fc742c936d6b226e74c72f52e53a) |
| Production frontend | Policy: `main → Firebase Hosting Live channel → https://mentalix-production.web.app`; exact deployed SHA для #904 в этой сверке не подтверждён | [Firebase workflow](https://github.com/Smira31/Mentalix/actions/workflows/firebase-hosting.yml); run 35119350799 подтверждал прежний snapshot, не #904 |
| `Demo Preview`        | Cloudflare Pages project `mentalix-owner-qa` → `https://mentalix-owner-qa.pages.dev` | workflow [Cloudflare Owner QA](https://github.com/Smira31/Mentalix/actions/workflows/cloudflare-owner-qa.yml)        |
| Backend             | `Smira31/mentalix-bot`, `main`                                                       | [GitHub](https://github.com/Smira31/mentalix-bot)                                                                    |
| Backend runtime     | Исторический адрес health: `https://mentalix-bot.onrender.com/api/health`; текущий статус backend не проверялся в этой docs-сверке | Приватный `mentalix-bot` и отдельная runtime-проверка обязательны для актуального статуса |
| Vercel              | Git integration отключена у проектов `mentalix` и `mentalix-preview`                 | Vercel git context: linked projects отсутствуют                                                                      |

## Канонический словарь окружений

- **`Demo Preview`:** Cloudflare Pages, ручной exact-SHA deploy для быстрой визуальной и Telegram/iPhone QA-проверки.
- **Production:** Firebase Hosting Live channel, автоматический deploy только из `main`.
- **Local Preview:** `vite preview` после production build.
- **UI Lab:** экспериментальные маршруты внутри репозитория; не Production.
- **Vercel:** старый fallback, не используется для новых deploy/checks.

## Hosting policy

1. Разработка и быстрая визуальная проверка выполняются через Cloudflare `Demo Preview`.
2. После QA изменения проходят обычный PR и обязательный GitHub check `Базовая проверка проекта`.
3. Merge в `main` запускает Firebase Hosting Production deploy.
4. `Firebase Preview Channels`, `Vercel Preview` и Vercel watchdog не используются.
5. Render backend не переносится в рамках frontend-задач.

Полная policy: [`docs/handoffs/2026-09-16-hosting-policy.md`](docs/handoffs/2026-09-16-hosting-policy.md).

## Release snapshot и GitHub на 27.09.2026

- `main` после [#904](https://github.com/Smira31/Mentalix/pull/904): публичный MVP **18+**, 16–17 отложены до v1.1 (см. `PRODUCT.md` и решение владельца в `docs/core/PRODUCT_DECISIONS.md`). Не путать commit `main` с доказательством exact-SHA production deployment: post-#904 Firebase run и ручной Web/PWA/Telegram gate здесь не подтверждены.
- [#903](https://github.com/Smira31/Mentalix/pull/903) добавил frontend gate: Telegram user screens монтируются только после появления user и подписанного `initData`; API отправляет `Authorization: tma ...`. Это **не** доказательство backend-проверки подписи или полномочий.
- Web/PWA в `main`: [#847](https://github.com/Smira31/Mentalix/pull/847) server-backed guest → [#861](https://github.com/Smira31/Mentalix/pull/861) bearer session → [#863](https://github.com/Smira31/Mentalix/pull/863) automatic guest login → [#883](https://github.com/Smira31/Mentalix/pull/883) guest save UX. `src/App.jsx`, `src/lib/guestAuth.js`, `src/platform/web.adapter.js`, `src/lib/api.js` подтверждают текущий frontend-контракт. [#615](https://github.com/Smira31/Mentalix/issues/615) первоначально запрещал anonymous backend accounts и предписывал local-only guest; этот аспект **superseded фактической реализацией**, остальной scope лишь частично superseded. [#789](https://github.com/Smira31/Mentalix/issues/789) оставлял выбор storage/merge открытым; фактическая архитектура не равна новому решению владельца по всем вопросам Issue.
- Данные **из evidence, переданного владельцем для этой сверки** (не независимая live DB-проверка): 322 active unmerged guest accounts, один email-only account (владелец/разработчик, использовался для тестирования), aggregate audit не выявил guest personal-content debt. Ничего не удалено и состояние DB не менялось. Известный production defect: отрицательный guest id не является canonical `users` row, `pinned_practices` → HTTP 500. Backend status и полноту guest merge без отдельной проверки не утверждать.
- Историческая сверка до #905: **0 открытых PR, 9 открытых Issues**. [#766](https://github.com/Smira31/Mentalix/issues/766) и [#767](https://github.com/Smira31/Mentalix/issues/767) были открыты, несмотря на merged #852 (ESLint 10) / #862 (`@twa-dev/sdk` 8.0.2). По решению 27.09: **выполнено — закрыть владельцу**; агент их не закрывает. Закрытые #623/#620/#618/#612/#600/#480 больше не активные задачи.

Текущий активный backlog — только [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md); открытая Issue не означает готовность к работе. Прежнее «HTTP 500 для гостя и Web/PWA end-to-end gate блокируют релиз» **заменено решением 27.09** для Telegram-only v1.0: дефект остаётся в Web/PWA scope и должен быть исправлен к его отдельному gate после v1.0; Telegram gate — в [`docs/testing/RELEASE_GATE.md`](docs/testing/RELEASE_GATE.md).

## Исторический документный контекст

Одноразовые аудиты доступности практик, fullscreen-flow и SHA-синхронизации сохранены в [`docs/audit/archive/`](docs/audit/archive/) и не являются текущим production-контрактом. Канонический текущий статус репозитория находится в этом файле; архивные отчёты используются только для исторического контекста и traceability.

## Мягкая серия — frontend в работе (27.09.2026)

Frontend использует `GET /api/streak?user_id=<id>` для числа серии, статистики и значков. Новые флаги `freeze_used_this_week` и `recoverable` отсутствуют на старом backend и в этом случае считаются `false`. Календарная граница и день заморозки определяются сервером; текущий контракт сообщает только факт заморозки недели, но не её конкретную дату, поэтому frontend не приписывает заморозку произвольному дню. Подтверждение релиза зависит от деплоя backend-ветки `feat/soft-streak` и ручной проверки.

## Ограничения подтверждения

Зелёный CI и HTTP 200 не заменяют manual iPhone/Telegram gate. Нельзя объявлять safe-area, keyboard, Telegram WebView или data-dependent сценарии пройденными без соответствующей ручной проверки.

## References

[1]: https://github.com/Smira31/Mentalix/commit/767a3b55e69d670cb3ea9b2adbd6704f0d734a70 'Current frontend main after PR #904'
[2]: https://mentalix-production.web.app 'Mentalix Firebase Production'
[3]: https://mentalix-owner-qa.pages.dev 'Mentalix Cloudflare QA'
[4]: https://github.com/Smira31/Mentalix/actions/workflows/firebase-hosting.yml 'Firebase Hosting workflow'
