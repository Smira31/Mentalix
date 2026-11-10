---
status: current
last_verified: 2026-11-10
---

# PROJECT_STATE — подтверждённое состояние Mentalix

Только проверенные факты о репозиториях, окружениях и release provenance. Активный backlog — [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md); история решений — [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md), `docs/archive/`.

**Сверка 10.11.2026.** Frontend `main` — `0a1dba55` после PR [#1182](https://github.com/Smira31/Mentalix/pull/1182). Ниже перечислено только то, что видно в `git log main` и в закрытых Issue/PR, каждое утверждение со ссылкой. Production runtime, backend runtime, CI на итоговом SHA и ручные iPhone/Telegram-проверки в этой сверке не запускались — это **НЕ ПРОВЕРЕНО**.

## Что подтверждено на 10.11.2026

- **«Задание на сегодня» в v1.0 не возвращается** — решение владельца 10.11.2026; компонент `DailyTaskPrompt` удалён ([#1179](https://github.com/Smira31/Mentalix/issues/1179), [#1181](https://github.com/Smira31/Mentalix/pull/1181)). В `src` имён `DailyTaskPrompt` и типов `daily_task_*` больше нет (проверено `grep` 10.11.2026).
- **События вовлечённости отправляются только через `logEngagementEvent`** ([#1172](https://github.com/Smira31/Mentalix/pull/1172), [#1181](https://github.com/Smira31/Mentalix/pull/1181)). Фильтр в `src/lib/engagementEvents.js` не отправляет ничего для демо, предпросмотра и гостя без сессии. Контракт `POST /api/events`: `event_type` строго из закрытого перечня, `entity_id` всегда `null`, контекст — строкой в `entity_type` по шаблону `группа[:значение]`. Сейчас в закрытом перечне 11 типов вовлечённости и 13 точек вызова: #1172 довёл перечень до 14 типов, #1181 убрал три `daily_task_*`. Расширение контракта на бэкенде — `Smira31/mentalix-bot` PR #244 по описанию #1172; фактическая отправка в боевой API и бэкенд-часть — **НЕ ПРОВЕРЕНО** (backend-репозиторий приватный).
- **Согласие ИИ: утверждённые тексты** ([#1170](https://github.com/Smira31/Mentalix/pull/1170), [#1173](https://github.com/Smira31/Mentalix/pull/1173), Issue [#1169](https://github.com/Smira31/Mentalix/issues/1169)). Одна поверхность согласия: карточка «Показать собеседникам твои записи?» в «Диалоге» и переключатель «Доступ ИИ к записям» в Профиль → «твои данные.» → «Приватность»; все строки берутся из констант `src/lib/aiContextConsent.js`, латиницы «AI» в видимых текстах нет. Поток прежний: `GET/PUT /api/mentalix/consent`. После кризисной реплики карточка не показывается (тест-режим `?dialogTest=crisis`, #1173). Серверная отправка `crisis: true` и передача записей в GigaChat — **НЕ ПРОВЕРЕНО** (#1173).
- **Нижний бар одинаково на всех пяти вкладках** ([#1171](https://github.com/Smira31/Mentalix/pull/1171)): опущен на 12 px (`--bottom-nav-offset: -4px`, но не ближе 6 px к краю), сжимается в круглую кнопку на каждой вкладке — прежнее исключение для «Шагов» убрано по решению владельца 09.11; сжатие анимируется только `transform`/`opacity`.
- **`src/screens/History.jsx` и `src/screens/JourneySearch.jsx` в приложении не смонтированы** — их используют только тесты и фикстуры (`tests/fixtures/journal-history-isolation.jsx`, `tests/unit/*`, `tests/ux/*`); живые экраны «Истории» — другие компоненты ([#1182](https://github.com/Smira31/Mentalix/pull/1182), правило JOURNAL-001 из [#1042](https://github.com/Smira31/Mentalix/pull/1042)). Проверено `grep` по `src` 10.11.2026: импортов этих экранов нет.
- **Web/PWA**: «Выйти из аккаунта» ([#1164](https://github.com/Smira31/Mentalix/pull/1164)), при выходе личные данные стираются с устройства ([#1168](https://github.com/Smira31/Mentalix/pull/1168)), токен сессии сохраняется после входа через Telegram ([#1160](https://github.com/Smira31/Mentalix/pull/1160)), знакомый человек не проходит знакомство повторно ([#1157](https://github.com/Smira31/Mentalix/pull/1157)), шапка PWA стоит под строкой статуса iPhone ([#1153](https://github.com/Smira31/Mentalix/pull/1153), [#1158](https://github.com/Smira31/Mentalix/pull/1158)).
- **Тексты**: аудит тона — [`docs/audits/UI_COPY_AUDIT_2026-11.md`](docs/audits/UI_COPY_AUDIT_2026-11.md) ([#1149](https://github.com/Smira31/Mentalix/pull/1149)); спокойные формулировки P1 на «Сегодня», в поиске, восстановлении серии и онбординге ([#1182](https://github.com/Smira31/Mentalix/pull/1182)).
- **CI**: self-hosted Mac-раннер, `TZ=UTC`, health-проверка без `node` и `jq` ([#1176](https://github.com/Smira31/Mentalix/pull/1176)); кэш браузеров Playwright и параллельный smoke ([#1147](https://github.com/Smira31/Mentalix/pull/1147)); в PR, где изменены только документы, Playwright smoke пропускается ([#1144](https://github.com/Smira31/Mentalix/pull/1144)). Итог CI конкретного PR здесь не перепроверялся — смотреть Checks этого PR.
- **Флаги production** ([#1146](https://github.com/Smira31/Mentalix/pull/1146), [`docs/engineering/notes/vite-flags.md`](docs/engineering/notes/vite-flags.md)): на Timeweb заданы только `VITE_API_BASE_URL`, `VITE_TELEGRAM_BOT_USERNAME` и `VITE_EMAIL_LOGIN_ENABLED=false`. При незаданных флагах выключены интерфейс оплаты (`VITE_PAYMENT_UI_ENABLED`) и карточка «Разбор и план недели» (`VITE_PRO_REVIEW_PLAN_ENABLED`). Набор переменных Timeweb принят по описанию #1146: панель хостинга из репозитория не видна — **НЕ ПРОВЕРЕНО**.

Ручные проверки на iPhone/Telegram по перечисленным PR — **НЕ ПРОВЕРЕНО**: в их отчётах manual gate указан как NOT RUN и остаётся за владельцем.

## Production (сверка 06.11.2026, на 10.11 не перепроверялась)

- Фронтенд — Timeweb App Platform, `https://mentalix.space` (статическая сборка `dist`); API — `https://api.mentalix.space/api` на Timeweb, база PostgreSQL 16; сборка задаёт `VITE_API_BASE_URL=https://api.mentalix.space/api`. Порядок переноса и переменные — [`docs/TIMEWEB_FRONTEND.md`](docs/TIMEWEB_FRONTEND.md).
- **Откат:** Firebase Hosting трафик не обслуживает, но `firebase.json` и workflow `firebase-hosting.yml` сохранены и запускаются только вручную (`workflow_dispatch`) — не удалять без отдельного решения владельца ([#1142](https://github.com/Smira31/Mentalix/pull/1142)). Cloud Run `mentalix-auth-proxy`, Render и Neon остановлены с 30.10.2026 — не деплоить и не использовать.
- Deploy SHA фронтенда на Timeweb и runtime-состояние API/базы — **НЕ ПРОВЕРЕНО**.

## Каноническое состояние

| Область             | Факт                                                                                                          | Доказательство                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Card System v2      | Нормативная спецификация в `DESIGN_SYSTEM.md` §5.1, решение владельца 22.09.2026                               | [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) §5.1                                |
| Card System v1      | [`docs/archive/CARD_SYSTEM_V1_2026-09-22.md`](docs/archive/CARD_SYSTEM_V1_2026-09-22.md), статус `archived`    | Архив; не источник истины                                                  |
| Frontend            | `Smira31/Mentalix`, default branch `main`                                                                      | [GitHub](https://github.com/Smira31/Mentalix)                              |
| Frontend `main`     | `0a1dba55` после PR [#1182](https://github.com/Smira31/Mentalix/pull/1182), сверка 10.11.2026; не deployed SHA | [commit](https://github.com/Smira31/Mentalix/commit/0a1dba55)              |
| Production frontend | Timeweb App Platform, `https://mentalix.space`, сборка из `main`; сверка 06.11.2026, deployed SHA не проверен  | [`docs/TIMEWEB_FRONTEND.md`](docs/TIMEWEB_FRONTEND.md)                     |
| Backend             | `Smira31/mentalix-bot`, `main`, приватный репозиторий                                                          | [GitHub](https://github.com/Smira31/mentalix-bot)                          |
| Backend runtime     | API `https://api.mentalix.space/api` (Timeweb, PostgreSQL 16); runtime не проверялся                           | Приватный `mentalix-bot`, его `docs/TIMEWEB.md`                            |
| Vercel              | Git integration отключена у проектов `mentalix` и `mentalix-preview`                                           | Vercel git context: linked projects отсутствуют                            |

## Словарь окружений

- **Production (с 30.10.2026):** Timeweb App Platform, `https://mentalix.space`, API `https://api.mentalix.space/api` (PostgreSQL 16); deploy из `main`.
- **Откат:** Firebase Hosting трафик не обслуживает; workflow только вручную (`workflow_dispatch`); Cloud Run, Render и Neon остановлены с 30.10.2026.
- **Local Preview:** `vite preview` после production build.
- **UI Lab:** экспериментальные маршруты внутри репозитория; не Production.
- **Vercel:** старый fallback, для новых deploy/checks не используется.

## Hosting policy

1. После QA изменения проходят обычный PR и обязательный GitHub check `Функциональная проверка проекта`.
2. Timeweb собирает фронтенд из `main`; ждёт ли он успешного CI — **НЕ ПРОВЕРЕНО**. Правил защиты `main` нет — мерж только после зелёного CI и ревью.
3. `Firebase Preview Channels`, `Vercel Preview` и Vercel watchdog не используются. Решение об удалении Firebase-файлов отката принимает владелец.
4. Backend с 30.10.2026 живёт на Timeweb (`https://api.mentalix.space`); Render остановлен.

Полная policy: [`docs/handoffs/2026-09-16-hosting-policy.md`](docs/handoffs/2026-09-16-hosting-policy.md).

## Решения владельца от 27.09.2026 (цель, не утверждение о готовности)

- v1.0 — **только Telegram Mini App**; Web/PWA gate переносится на период после v1.0.
- Целевая серия **мягкая**: любая завершённая активность за день; один пропуск в календарную неделю серию не рвёт; «Верни серию» доступно за вчера. «Canonical streak v1» **заменено** этим решением.
- 18+ сохраняется; карточки «Сегодня» — 260 всегда (решение T12).
- Telegram v1.0 gate: визуал по референсам, мягкая серия, опубликованная Privacy Policy v1.0, отсутствие P0/P1, финальный QA владельца на iPhone. До публичного запуска — проверка с юристом (152-ФЗ, особая категория данных, согласие, уведомление РКН). См. [`docs/testing/RELEASE_GATE.md`](docs/testing/RELEASE_GATE.md).
- Мягкая серия реализуется на backend (`feat/soft-streak`); её готовность на 10.11.2026 — **НЕ ПРОВЕРЕНО**.

## Ограничения подтверждения

- Зелёный CI и HTTP 200 не заменяют ручной iPhone/Telegram gate: safe-area, клавиатура, Telegram WebView и data-dependent сценарии считаются непроверенными без отдельного прогона.
- Открытая Issue не означает начатую работу; приоритеты — [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md).
- Исторические материалы (`docs/archive/`, `docs/audit/archive/`, `TASKS.md`, `CHANGES.md`) — только контекст, не текущий контракт.
