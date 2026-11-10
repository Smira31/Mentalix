---
status: current
last_verified: 2026-11-07
---

# VITE_-флаги: значения по умолчанию и что получает production

Аудит только по коду (grep по `VITE_` / `import.meta.env` в `src/`, `vite.config.js`,
`tests/`, `.github/workflows/`, `package.json`, `scripts/`). Секретов в документе нет:
все значения ниже — публичные имена ботов и флаги.

## Как Vite отдаёт флаги (от этого зависят все «значения по умолчанию»)

- В клиентский бандл попадают только переменные с префиксом `VITE_`. Значение всегда
  строка; **не заданная переменная = `undefined`**.
- Vite подставляет значения на этапе сборки (`vite build`) или старта dev-сервера.
  Флаг — не переключатель во время работы: поменять переменную без пересборки/перезапуска
  ничего не изменит.
- Отсюда два разных «дефолта» в коде:
  - `=== 'true'` → при не заданной переменной **false**;
  - `!== 'false'` → при не заданной переменной **true** (единственный такой флаг —
    `VITE_EMAIL_LOGIN_ENABLED`).
- Сравнение строгое и регистрозависимое: `'1'`, `'True'`, `'yes'`, `''`, строка с
  пробелом — не равны `'true'` и не равны `'false'`.

## Таблица флагов

| Флаг | Где читается (файл:строка) | Значение, если переменная НЕ задана | Что включает / скрывает |
| --- | --- | --- | --- |
| `VITE_PAYMENT_UI_ENABLED` | `src/lib/paymentConfig.js:10` (парсинг, `=== 'true'`); потребители: `src/screens/SubscriptionManager.jsx:93`, `src/screens/DonateScreen.jsx:45`, `src/screens/pro/ProShowcaseCard.jsx:55`, `src/screens/pro/ProAnalyticsCard.jsx:98`, `src/screens/pro/ProAnalyticsCard.jsx:172`, `src/App.jsx:486` | **false** (`PAYMENT_UI_ENABLED = false`) | `true`: экран «подписка.» с состояниями guest/base/pro/expired/pending/success по `/api/subscription`, экран «поддержать проект.» с плитками суммы и ЮKassa, кнопка «Оформить Pro» в витрине Pro, запрос `has_pro` для этой кнопки, перехват возврата с оплаты. `false`: прежний статичный экран подписки с неактивной кнопкой «Оплата скоро появится», прежний экран доната-заглушка, витрина Pro без кнопки оплаты, запроса `has_pro` для кнопки нет, возврат с оплаты не перехватывается |
| `VITE_PRO_REVIEW_PLAN_ENABLED` | `src/lib/proFlag.js:11` (`=== 'true'`); потребители: `src/screens/Analytics.jsx:1114`, `src/screens/pro/ProAnalyticsEntry.jsx:91`, `src/screens/pro/ProAnalyticsEntry.jsx:119` | **false** (`PRO_REVIEW_PLAN_ENABLED = false`) | `true`: во вкладке «Аналитика» появляется карточка «Разбор и план недели» (витрина для не-Pro и гостей, рабочая карточка для Pro), `ProAnalyticsEntry` запрашивает `/api/subscription` для статуса. `false`: карточки нет ни у кого, запроса статуса из неё тоже нет (`return null`, `return` до запроса) |
| `VITE_EMAIL_LOGIN_ENABLED` | `src/screens/WebAuthScreen.jsx:60` (`!== 'false'`), `src/screens/SubscriptionManager.jsx:42` (тот же парсинг); косвенно `src/lib/yookassaCheckout.js:65`, `src/lib/yookassaCheckout.js:70` | **true** (вход по email включён) | `true`: на экране входа есть форма email + код, блок «Что будет в письме», подпись «Или через Telegram». `false`: формы email и блока преимуществ нет вовсе, экран ведёт текстом «Войди через Telegram…» (`WebAuthScreen.jsx:185`), блок Telegram становится основным («Войти через Telegram», класс `is-primary`, `:275`, `:279`) и появляется ссылка «Открыть Mentalix в Telegram» (`:282`), если задан bot username. У экрана гостя подписки `emailCta = null` — email не упоминается |
| `VITE_EMAIL_LINK_ENABLED` | `src/lib/emailLink.js:12` (`=== 'true'`); потребители: `src/screens/settings/EmailLinkRow.jsx` (строка «Почта для входа» в «твои данные.») | **false** | `true`: в Профиле → «твои данные.» появляется строка «Почта для входа» (только Telegram и `Number(user.id) > 0`), вызовы `GET/POST/DELETE /auth/email-link…`. `false`: строки нет вовсе, запросов нет |
| `VITE_API_BASE_URL` | `src/lib/api.js:8` (`|| '/api'`), `src/platform/web.adapter.js:61` (`|| '/api'`) | **`'/api'`** (тот же origin) | Не булев флаг: адрес API. Должен включать `/api` (клиент дописывает пути без префикса). Пустая строка тоже даёт `/api` |
| `VITE_TELEGRAM_BOT_USERNAME` | `src/screens/WebAuthScreen.jsx:9`, `src/screens/WebAuthScreen.jsx:61` | **`undefined`** | Задано: грузится `telegram-widget.js`, вход через Telegram, ссылка `https://t.me/<username>`. Не задано: виджет не грузится, вместо него текст «Telegram Login будет доступен после настройки bot username» (`:39`–`:45`), ссылки на бота нет |
| `VITE_LOCAL_PREVIEW` | `src/lib/demoMode.js:173` (→ `:186`), `src/lib/proMock.js:78`, `src/lib/subscriptionState.js:72`, `src/screens/pro/ProAnalyticsEntry.jsx:35`, `src/platform/web.adapter.js:59` | **false** (`=== 'true'`) | `true`: preview-сборка ведёт себя как dev — работают `?demo=1`, `?payState=…`, `?proStatus=pro`, dev-мок Pro; `web.adapter` отдаёт локального пользователя вместо `GET /auth/session`. `false`: всё это только в dev-сборке (`import.meta.env.DEV`) |
| `VITE_PRO_MOCK` | `src/lib/proMock.js:91` (значение сценария), гейт `src/lib/proMock.js:74`–`:80` (`PROD` → false, нужен `DEV` или `VITE_LOCAL_PREVIEW=true`) | **`undefined`** → мок выключен | Задано (`ready`, `conflict`, `insufficient`, `crisis`, …): ответы `/api/pro/*` подменяются dev-моком; URL-параметр `?proMock=` приоритетнее. В production-сборке неактивно всегда (`import.meta.env.PROD` → false) |
| `VITE_STARTER_SET_ENABLED` | `src/screens/Today.jsx:90` (`=== 'true'`), потребитель `src/screens/Today.jsx:1622` | **false** | `true`: на пустом «Сегодня» показывается `StarterSetPicker` (набор стартовых практик). `false`: обычный пустой блок «Пока нет практик» + кнопка «Выбрать практику». Зеркало в тесте: `tests/ux/ux-check.spec.mjs:516` |
| `VITE_TG_SHELL` | `src/main.jsx:198` (`=== '1'`), `src/main.jsx:199` (`!== '0'`); комментарий `src/tgShell.js:4` | **`undefined`** → tgShell не грузится | `'1'`: динамически подключает dev-оболочку Telegram iOS также и в production-сборке. `'0'`: отключает её даже в dev. Значение `'true'` не работает — нужна именно `'1'` |
| `VITE_PROGRESS_LAYOUT_V2` | Только `scripts/mxl-progress-production-check.mjs:7` (`process.env`, `=== 'true'`), `:165`, `:166`, `:182` — Node-QA-скрипт геометрии «Прогресса», в бандл не попадает | **false** | `true`: скрипт ждёт новую раскладку (`layoutV2`, 0 периодов). `false`: ждёт старую (4 периода). На UI приложения не влияет |
| `VITE_LIBRARY_V2` | Чтения в коде нет. Единственное упоминание — комментарий `src/screens/Library.css:393` | — (не читается) | Ничего не включает: флаг мёртвый, порядок «Программы → Статьи → Направленные записи» одинаков для всех (см. `CHANGES.md:40`) |
| `VITE_PRACTICES_CATALOG_V2` | Чтения в `src/` нет. Только негативная проверка `tests/unit/maintenance-contracts.test.mjs:256` (флага быть не должно) | — (не читается) | Ничего не включает; тест запрещает возвращать этот флаг в код |
| `VITE_QA_LOGIN` | Чтения в коде нет. Упоминание только в историческом аудите `docs/audit/test-account-options-2026-09-19.md:40` | — (не читается) | Ничего не включает: предложение из аудита не реализовано |
| `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` | `docker-compose.base44.yml:35` (передаётся из окружения песочницы) | — | Встроенный механизм dev-сервера Vite (≥ 6.1) для allowlist хостов превью. Не флаг приложения; из-за префикса `__` в клиентский бандл не попадает |

Не `VITE_`-флаги, но задаются на сборке и участвуют в тех же условиях:
`import.meta.env.DEV` / `PROD` — встроенные в Vite; `import.meta.env.VERCEL_ENV`
подставляется через `define` в `vite.config.js:236` из `process.env` той же сборки
(используется в `src/main.jsx:26`, `:31`, `:52`, `:57`, `src/App.jsx:186`,
`src/lib/demoMode.js:186`). В таблицу выше не входят.

## Где флаги заданы в песочнице (для контраста с production)

`docker-compose.base44.yml`, сервис `web`: `VITE_TG_SHELL=1` (:14),
`VITE_LOCAL_PREVIEW=true` (:15), `VITE_PRO_REVIEW_PLAN_ENABLED=true` (:18),
`VITE_PAYMENT_UI_ENABLED=true` (:21), `VITE_EMAIL_LOGIN_ENABLED=false` (:26),
`VITE_EMAIL_LINK_ENABLED=true` (:31), `VITE_TELEGRAM_BOT_USERNAME=Mentalix_club_bot` (:34),
`VITE_PRO_MOCK=ready` (:38).
Это значения **только песочницы**: первая, вторая и последняя включают dev/preview-ветки,
которых в production-сборке нет.

## Production Timeweb

Принятый набор переменных production: `VITE_API_BASE_URL`, `VITE_TELEGRAM_BOT_USERNAME`,
`VITE_EMAIL_LOGIN_ENABLED=false`. Остальные `VITE_*` не заданы.

| Флаг | В production | Как парсится | Что видит пользователь |
| --- | --- | --- | --- |
| `VITE_PAYMENT_UI_ENABLED` | не задан | `undefined === 'true'` → **false** | «подписка.» — прежний статичный экран: описание Pro и **неактивная** кнопка «Оплата скоро появится». «поддержать проект.» — прежняя заглушка без выбора суммы. Никаких состояний по `/api/subscription`, никаких кнопок «Оформить Pro», возврат с ЮKassa не перехватывается |
| `VITE_PRO_REVIEW_PLAN_ENABLED` | не задан | `undefined === 'true'` → **false** | Во вкладке «Аналитика» карточки «Разбор и план недели» нет ни у кого — ни у Pro, ни у не-Pro, ни у гостя. Запроса `/api/subscription` из этой карточки тоже нет. Витрины Pro в продукте не видно |
| `VITE_EMAIL_LOGIN_ENABLED` | `'false'` | `'false' !== 'false'` → **false** (вход по email выключен) | На экране входа нет формы email и блока «Что будет в письме»; заголовок «Войти через Telegram», блок Telegram основной, есть ссылка «Открыть Mentalix в Telegram» (bot username задан, виджет Telegram Login грузится). Экран гостя на подписке ведёт в Telegram и email не упоминает |

Итог по трём флагам: пользователь production видит **старый экран подписки без оплаты**,
**без карточки Pro-разбора** и **входит только через Telegram**. То есть платёжный
интерфейс и Pro-витрина в production выключены, вход по email — тоже.

Ловушки, которые видно из кода:

- `VITE_PAYMENT_UI_ENABLED=true` и `VITE_PRO_REVIEW_PLAN_ENABLED=true` включаются только
  точным `'true'`; `'1'`/`'True'` оставят их выключенными (в отличие от `VITE_TG_SHELL`,
  которому нужна именно `'1'`).
- `VITE_EMAIL_LOGIN_ENABLED` — единственный флаг с дефолтом «включено»: если переменную
  убрать из production, вход по email **вернётся**. Опечатка (`'False'`, `'0'`,
  `'false '`) тоже оставит email включённым.
- Значения подставляются на сборке: смена переменной в панели Timeweb без пересборки
  фронтенда ничего не изменит.

## Значения в `firebase-hosting.yml` (блок `env`)

`.github/workflows/firebase-hosting.yml`, блок `env` (строки 16–26):

| Строка | Переменная | Значение |
| --- | --- | --- |
| 17 | `VITE_API_BASE_URL` | `/api` |
| 19 | `VITE_TELEGRAM_BOT_USERNAME` | `Mentalix_club_bot` |
| 21 | `VITE_EMAIL_LOGIN_ENABLED` | `'false'` |
| 23 | `VITE_PAYMENT_UI_ENABLED` | `'true'` |
| 26 | `VITE_PRO_REVIEW_PLAN_ENABLED` | `'true'` |

- Workflow запускается только вручную (`on: workflow_dispatch:`, строки 4–5);
  production — Timeweb, Firebase Hosting трафик не обслуживает. Блок `env` относится
  только к этой ручной Firebase-сборке и **расходится с Timeweb**: там платёжный UI
  и Pro-карточка были бы включены, а на Timeweb они выключены. Это расхождение путей
  сборки, а не поведения приложения.
- Блок читает `tests/unit/web-auth-email-toggle.test.mjs:27-30`, поэтому файл нельзя
  удалять/переписывать без решения владельца.
- **Закоммиченных `.env` / `.env.production` нет.** `git ls-files` не содержит ни одного
  файла с `.env`, `.gitignore:10` игнорирует `.env*`; `.env.example` в репозитории тоже
  нет. Значит единственные зафиксированные в git значения флагов — блок `env` этого
  workflow и `environment:` в `docker-compose.base44.yml`.

## Где ещё флаги видны в тестовой обвязке

Тесты не меняют поведение приложения: одни проверяют текст исходников, другие запускают
dev/build с флагом.

| Место | Что делает |
| --- | --- |
| `tests/unit/web-auth-email-toggle.test.mjs:16-17`, `:27-30` | парсинг `!== 'false'` и значения из `firebase-hosting.yml` |
| `tests/unit/pro-analytics-entry.test.mjs:160-163` | `PRO_REVIEW_PLAN_ENABLED` остаётся default false |
| `tests/unit/subscription-guest-telegram-login.test.mjs:47` | тот же парсинг `VITE_EMAIL_LOGIN_ENABLED` |
| `tests/unit/pro-mock-contract.test.mjs:18`, `:22` | гейт мока и приоритет `?proMock` |
| `tests/unit/preview-demo-host.test.mjs:18` | подставляет `VITE_LOCAL_PREVIEW: 'true'` в модуль |
| `tests/unit/web-bearer-session.test.mjs:29` | `VITE_LOCAL_PREVIEW: 'false'`, `VITE_API_BASE_URL: '/api'` |
| `tests/unit/maintenance-contracts.test.mjs:188`, `:256` | `VITE_LOCAL_PREVIEW` в демо-режиме; запрет `VITE_PRACTICES_CATALOG_V2` |
| `tests/ux/ux-check.spec.mjs:516` | зеркало `VITE_STARTER_SET_ENABLED` |
| `playwright.payment-ui.config.mjs:44`, `playwright.pro-states.config.mjs:31`, `playwright.pro-failure-states.config.mjs:35`, `playwright.donation.config.mjs:32` | запускают dev с `VITE_PAYMENT_UI_ENABLED` / `VITE_PRO_REVIEW_PLAN_ENABLED` / email-флагами |
| `playwright.mxl010.config.mjs:24`, `playwright.tap-areas.config.mjs:34`, `playwright.telegram-react-depth.config.mjs:31`, `playwright.today-drafts.config.mjs:31` | `VITE_LOCAL_PREVIEW=true` |
| `.github/workflows/informational-checks.yml:402` | `VITE_LOCAL_PREVIEW=true npm run build` для снимков |
| `.github/workflows/ci.yml:232` | только комментарий про `VITE_PAYMENT_UI_ENABLED` |

## Не проверено

- **Реальный набор переменных Timeweb.** Панель хостинга из репозитория не видна;
  набор из задачи (`VITE_API_BASE_URL`, `VITE_TELEGRAM_BOT_USERNAME`,
  `VITE_EMAIL_LOGIN_ENABLED=false`) принят как данность, а не подтверждён.
- **Как Timeweb собирает фронтенд.** Конфигурации Timeweb в репозитории нет (есть
  `vercel.json`, `firebase.json`, `docker-compose.base44.yml`); неизвестно, какая
  команда сборки и какой коммит отдаются на `mentalix.space`.
- **Живой production.** Что сайт отдаёт прямо сейчас (возраст сборки, кэш CDN) по коду
  не выводится; браузером production не открывался.
- **Бэкенд.** Включены ли на API вход по email и эндпоинты `/api/pro/*` — это другой
  репозиторий; здесь виден только фронтенд.
- **Секреты GitHub.** Блок `env` в workflow читается, значения `secrets.*` — нет.
- **Флаги без чтения в коде** (`VITE_LIBRARY_V2`, `VITE_PRACTICES_CATALOG_V2`,
  `VITE_QA_LOGIN`): вывод «не читается» основан на grep по репозиторию; внешние сборки
  и QA-скрипты вне git не проверялись.
- **`VERCEL_ENV` на Timeweb.** Задаётся ли он в сборке, неизвестно; от него зависят
  dev/preview-ветки (`UI Lab`, `?demo=1`), но это не `VITE_`-флаг.
- **Поведение при смене переменной на лету** — не проверено экспериментом; вывод
  «нужна пересборка» следует из того, что Vite подставляет значения на этапе сборки.
