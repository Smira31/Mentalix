---
status: current
last_verified: 2026-11-06
---

# PROJECT_STATE — подтверждённое состояние Mentalix

Этот файл содержит только проверенные факты о репозиториях, окружениях, release provenance и активных GitHub-треках. Активный backlog находится в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md). История решений находится в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

**Сверка production 06.11.2026.** С 30.10.2026 production — Timeweb App Platform: фронтенд `https://mentalix.space` (статическая сборка `dist`), API `https://api.mentalix.space/api` на Timeweb, база — PostgreSQL 16; сборка задаёт `VITE_API_BASE_URL=https://api.mentalix.space/api`. **Откат:** Firebase Hosting трафик не обслуживает, но workflow `firebase-hosting.yml` запускается только вручную (`workflow_dispatch`) и не удаляется без отдельного решения владельца; Cloud Run `mentalix-auth-proxy`, Render и Neon остановлены с 30.10.2026 — не деплоить и не использовать. Сверены документы и конфигурация; runtime Timeweb в этой docs-сверке не проверялся. Строки о Firebase/Render/Neon ниже сохранены как история и помечены «до 30.10.2026».

**Последняя сверка репозитория и конфигурации:** 15.10.2026. Frontend baseline — `main` `c271ba19174c321f7ae2242acf535ba18c42c598` после PR #1057. Это снимок исходников, не exact-SHA Production. Прочитана backend deployment/proxy-документация на `0a48f04111515df0bf19a3f40f8051110bc17155`; backend runtime и deployed SHA не проверены. Решения владельца от 27.09 сохраняются, назначения исполнителей не менялись. Предыдущий snapshot после #1003 (`b1fdfb2fff939fb515afb878f72a40a14328fc03`) — исторический контекст, не подтверждение текущего production.

## Сверка 15.10.2026: подтверждено и не проверено

- Проверены frontend-коммиты от #1003 (`b1fdfb2f`) до #1057 (`c271ba19`): 20 PR в `main` (с #1028 по #1057). Ниже перечислены ключевые продуктовые изменения по git log; факт слияния не доказывает ручную приёмку или deployment.
- **Путь героя** (#1034–#1038): иллюстрации глав I и III, глава IV, обложка, return; тексты v2, пролог «О курсе», финал; контраст подписи шага (faint → muted); вступление шага без скролла.
- **Privacy** (#1039): статичная страница `/privacy` для BotFather через плагин `privacyPagePlugin` из `src/content/privacyPolicy.js`.
- **Performance** (#1040–#1041): удаление `react-query` из стартового бандла; убрана фоновая предзагрузка вкладок.
- **Журнал** (#1042–#1043): один дневник DailyJournal, безопасная история записей (JOURNAL-001); заметная кнопка «Мои записи» на экране «Вспомни, куда идёшь».
- **Mentalix Pro** (#1044, #1050, #1055): экраны разбора, плана недели и прогресса (PRO-002b/c); карточка «Разбор и план недели» в аналитике; интерфейс подписки и оплата через Tribute (PAY-UI-001, за флагом `VITE_PAYMENT_UI_ENABLED`).
- **Удаление практики «Альтер-эго»** (#1048): код и ассеты удалены, данные и deep-link сохранены.
- **Читаемая шкала и контракт клавиатуры** (#1049): MXL-TYPE-READABLE-001 и MXL-KEYBOARD-001.
- **UX чек-инов** (#1052): единая навигация и сохранение черновиков (утро и вечер).
- **Полный аудит** (#1053): AUDIT-FULL-001 — отчёт `docs/audits/FULL_AUDIT_2026-10-15.md`, 20 находок (0 P0, 2 P1, 10 P2, 8 P3), только документация.
- **Исправления по аудиту** (#1054, #1056, #1057): гостевой guard `pinned_practices` (AUD-001), тап-зоны 44 px (AUD-006/007), честные состояния ошибок (AUD-009/010), ограничение `?debug=api` (AUD-013), CloudStorage version gate (AUD-003); удаление упоминаний «проверенной подписи» и черновик правовых документов (AUD-004); тап-зоны «Прогресс» ≥43×43 pt (AUD-007).
- Проверены `package.json`, `firebase.json`, `.github/workflows/ci.yml`. Объявленные версии стека — в `package.json`, разрешённые точные версии — в `package-lock.json`; lockfile и установленное окружение в этой сверке не анализировались.
- Production frontend SHA, Cloud Run runtime/upstream, Render health/version, данные и ручной Telegram/iPhone gate — NOT RUN. Локальные unit-тесты не запускались (4 известных локальных падения, в CI зелёные); lint, build и docs:check проверены в контейнере.
- Разделы ниже с датами 27.09 и 03.10 сохраняют прежние решения и evidence; они не переаттестованы как текущее состояние продукта или базы данных.

## Маршрут production API (сверка 06.11.2026)

- **Текущий (с 30.10.2026):** фронтенд — Timeweb App Platform, `https://mentalix.space` (статическая сборка `dist`); API — `https://api.mentalix.space/api` на Timeweb, база — PostgreSQL 16. Порядок переноса, переменные сборки и откат — [`docs/TIMEWEB_FRONTEND.md`](docs/TIMEWEB_FRONTEND.md).
- **Откат:** Firebase Hosting трафик не обслуживает, но workflow `firebase-hosting.yml` запускается только вручную (`workflow_dispatch`) — не удалять без отдельного решения владельца. Cloud Run `mentalix-auth-proxy`, Render и Neon остановлены с 30.10.2026: не деплоить и не использовать. Файлы отката (`firebase.json`, `.github/workflows/firebase-hosting.yml`, proxy в `mentalix-bot`) не удаляются; деплой из workflow — только по ручному запуску.

### До 30.10.2026: Firebase + Cloud Run + Render + Neon

По конфигурации production workflow задаёт `VITE_API_BASE_URL=/api`, а `firebase.json` направляет `/api/**` в Cloud Run `mentalix-auth-proxy` (`us-central1`) перед SPA fallback. В `mentalix-bot/proxy` находится same-site proxy: upstream задаётся `BACKEND_ORIGIN`, по умолчанию Render. Схема настроек: frontend → Firebase `/api/**` → Cloud Run proxy → backend. Наличие этих файлов не подтверждает действующий сервис, его текущую переменную upstream, deploy SHA или корректность авторизации; для этого нужна отдельная read-only runtime-проверка.

Источники (до 30.10.2026): frontend `firebase.json` и `.github/workflows/firebase-hosting.yml` на baseline выше, backend `proxy/README.md` на указанном backend SHA. Runtime не проверялся; конфигурация в рамках этой сверки не менялась.

## Решения владельца от 27.09.2026 (цель, не утверждение о готовности)

- Один оркестратор — Claude; агенты A (`mentalix-bot`), B и C (`Mentalix`). Приоритет: сначала визуал «как Stoic» (Шаги/Explore, поток записи, значки, профиль, низ «Сегодня»), затем релиз v1.0.
- v1.0 — **только Telegram Mini App**; Web/PWA gate переносится на период после v1.0 и не блокирует его. Исторический Web/PWA blocker остаётся дефектом для web-сценария, но не blocker Telegram v1.0.
- Целевая серия **мягкая**: любая завершённая активность за день (чек-ин, журнал, ритуал, аскеза, «Настроение», направленная запись); один пропуск в календарную неделю не рвёт серию; «Верни серию» доступно за вчера. «Canonical streak v1» (только чек-ин/журнал, строго подряд) **заменено решением 27.09**. Реализация в работе у A в `mentalix-bot`, ветка `feat/soft-streak`; не выдавать за готовую.
- 18+ сохраняется. Засечки — только в заголовках разделов экранов Explore. Карточки «Сегодня» — 260 всегда, до и после прохождения (решение владельца T12, отменяет «260/233»); анимация сжатия — эталон Stoic для визуальной сверки.
- Telegram v1.0 gate: визуал по референсам, мягкая серия, Privacy Policy v1.0 опубликована в приложении, PrivacyNotice/Settings не обещают больше серверных возможностей, чем есть, финальный QA владельца на iPhone, нет P0/P1. **Проверить с юристом до публичного запуска:** 152-ФЗ, данные о настроении/психсостоянии как особая категория, согласие, уведомление РКН. См. [`docs/testing/RELEASE_GATE.md`](docs/testing/RELEASE_GATE.md).

## Каноническое состояние

| Область             | Факт                                                                                                                               | Доказательство                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card System v2      | Нормативная спецификация в `DESIGN_SYSTEM.md` §5.1, решение владельца от 22.09.2026                                                | [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) §5.1                                                                                                                |
| Card System v1      | [`docs/archive/CARD_SYSTEM_V1_2026-09-22.md`](docs/archive/CARD_SYSTEM_V1_2026-09-22.md), статус `archived`                        | Архив; не текущий источник истины                                                                                                                          |
| Frontend            | `Smira31/Mentalix`, default branch `main`                                                                                          | [GitHub](https://github.com/Smira31/Mentalix)                                                                                                              |
| Frontend `main`     | baseline `c271ba19174c321f7ae2242acf535ba18c42c598` после PR #1057 на момент сверки 15.10.2026; не deployed SHA                    | [commit](https://github.com/Smira31/Mentalix/commit/c271ba19174c321f7ae2242acf535ba18c42c598), [PR #1057](https://github.com/Smira31/Mentalix/pull/1057)   |
| Production frontend | Timeweb App Platform, `https://mentalix.space` (сборка `dist` из `main`); сверка 06.11.2026. До 30.10.2026 — Firebase Hosting: трафик он больше не обслуживает, но workflow `firebase-hosting.yml` запускается только вручную (`workflow_dispatch`) — не удалять без отдельного решения владельца; deployed SHA не проверен | [`docs/TIMEWEB_FRONTEND.md`](docs/TIMEWEB_FRONTEND.md); [Firebase workflow](https://github.com/Smira31/Mentalix/actions/workflows/firebase-hosting.yml) — только откат |
| Backend             | `Smira31/mentalix-bot`, `main`                                                                                                     | [GitHub](https://github.com/Smira31/mentalix-bot)                                                                                                          |
| Backend runtime     | API `https://api.mentalix.space/api` (Timeweb, PostgreSQL 16), сверка 06.11.2026. До 30.10.2026 — `https://mentalix-bot.onrender.com/api/health` (Render, остановлено) | Приватный `mentalix-bot`, его `docs/TIMEWEB.md`; runtime в этой docs-сверке не проверялся |
| Vercel              | Git integration отключена у проектов `mentalix` и `mentalix-preview`                                                               | Vercel git context: linked projects отсутствуют                                                                                                            |

## Канонический словарь окружений

- **Production (с 30.10.2026, сверка 06.11.2026):** Timeweb App Platform, `https://mentalix.space`, API `https://api.mentalix.space/api` (PostgreSQL 16); deploy из `main`.
- **Откат:** Firebase Hosting трафик не обслуживает, но workflow `firebase-hosting.yml` запускается только вручную (`workflow_dispatch`) — не удалять без отдельного решения владельца; Cloud Run proxy, Render и Neon остановлены с 30.10.2026, не деплоить и не использовать.
- **Local Preview:** `vite preview` после production build.
- **UI Lab:** экспериментальные маршруты внутри репозитория; не Production.
- **Vercel:** старый fallback, не используется для новых deploy/checks.

## Hosting policy

1. После QA изменения проходят обычный PR и обязательный GitHub check `Функциональная проверка проекта`.
2. Timeweb App Platform собирает фронтенд из `main`; ждёт ли он успешного CI — **НЕ ПРОВЕРЕНО**. Технической защиты `main` нет — мерж только после зелёного CI и ревью. До 30.10.2026 gate был Firebase Hosting Live channel; трафик он больше не обслуживает, workflow `firebase-hosting.yml` запускается только вручную (`workflow_dispatch`) и решение о его удалении принимает владелец.
3. `Firebase Preview Channels`, `Vercel Preview` и Vercel watchdog не используются.
4. Backend с 30.10.2026 живёт на Timeweb (`https://api.mentalix.space`); Render остановлен. До 30.10.2026 Render backend не переносился в рамках frontend-задач.

Полная policy: [`docs/handoffs/2026-09-16-hosting-policy.md`](docs/handoffs/2026-09-16-hosting-policy.md).

## Исторический release snapshot и GitHub на 27.09.2026

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

## Календарная тема недели — ветка stoic-daily-questions (03.10.2026)

Фронт открывает дни 1…`current_day` из серверного ответа независимо от пропусков. «Сегодня» ведёт на текущий вопрос/ответ, «Шаги» — на выбранный день текущей `is_current` темы; сохранение не переключает день. `409 day_locked` показывает дату без потери текста. Даты и подписи открытия считаются через `mskDate.js` от `server_date`. Контракт backend #127 предоставлен владельцем, production-релиз этого фронта не подтверждён. Проверки и снимки 393×852: [evidence](qa-evidence/stoic-daily/report.md). Ручной iPhone/Telegram gate остаётся отдельным.

## Путь героя — рабочая ветка (03.10.2026)

В `hero-journey-reliability` прогресс и ответы курса изолированы по ID, сериализуются в JSON; legacy-ключ переносится до очистки scope, повреждённый JSON безопасно восстанавливается из облачной копии либо становится пустым прогрессом. Черновики текста хранятся локально по пользователю и шагу. Доступность считается по всему курсу и границе суток МСК, включая карточку продолжения; «Назад» следует подэкранам шага. Это состояние рабочей ветки, не факт production-релиза. Целевые проверки: `tests/unit/hero-journey-reliability.test.mjs`, `tests/unit/api-response-body-timeout.test.mjs` и `tests/ux/hero-journey-reliability.spec.mjs`.

## Библиотека Stoic — объединено в main через #1000

PR [#1000](https://github.com/Smira31/Mentalix/pull/1000) объединён 03.10.2026, commit `a0147e2e89bbf440e2877fc5ba5a1434e9e0665a`. Ниже сохранено evidence рабочей ветки от 03.10; новый прогон и production deployment не подтверждены.

База первой итерации: `c82fad014a8aeef19bbb1e4110b494eaa26042c2`; продолжение начато с HEAD `5ebd255b13` и сохранённых незакоммиченных правок. Главная объединяет курсы и тематические плитки; чтение через шторку и Screen. Реестр `src/data/courses/*.js` автоматически подаёт данные в общий движок карты/глав/шагов; прежние ключи прогресса и черновиков hero-journey сохранены, новые курсы изолированы по userId/courseId. Один курс — полная ширина, несколько — карусель; пустышка только в demo. Монохромные SVG и словарь тем заменили пустые слоты и подписи-теги. Вложенные экраны используют Telegram «Назад», в демо шапка не перекрывает текст. Статьи — только ARTICLES; программы/направленные записи скрыты, данные и API-контракты не удалены. `check:core`: 859 passed, 0 failed, 2 прежних skipped. Один Chromium UX-сценарий прошёл на dev и production-like build, включая прямой возврат из курса и сохранение прогресса после reload. Полный UX/WebKit — CI, iPhone/Telegram — ручной gate. Шесть снимков 430×932 на собранном приложении и подробности: [отчёт](qa-evidence/stoic-library/report.md). Это историческое evidence рабочей ветки до объединения #1000, не подтверждение production deployment.

## Ограничения подтверждения

Зелёный CI и HTTP 200 не заменяют manual iPhone/Telegram gate. Нельзя объявлять safe-area, keyboard, Telegram WebView или data-dependent сценарии пройденными без соответствующей ручной проверки.

## References

[1]: https://github.com/Smira31/Mentalix/commit/767a3b55e69d670cb3ea9b2adbd6704f0d734a70 'Historical frontend snapshot after PR #904'
[2]: https://mentalix-production.web.app 'Mentalix Firebase Production — откат: трафик не обслуживает, сборка ещё выкладывается workflow-ом'
[3]: https://github.com/Smira31/Mentalix/actions/workflows/firebase-hosting.yml 'Firebase Hosting workflow — откат: запускается только вручную (`workflow_dispatch`)'
[4]: https://mentalix.space 'Mentalix Production — Timeweb App Platform (с 30.10.2026)'
