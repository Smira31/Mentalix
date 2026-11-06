---
status: current
last_verified: 2026-10-30
---

# Фронтенд на Timeweb Cloud (перенос с Firebase)

Короткая инструкция: как собрать этот репозиторий во Timeweb App Platform,
привязать домен `mentalix.space`, что поменять в BotFather и как за минуты
вернуться на Firebase.

- Фронтенд: **https://mentalix.space** — статическая сборка `dist` из GitHub.
- API: **https://api.mentalix.space** (backend-репозиторий `mentalix-bot`,
  его настройки — `docs/TIMEWEB.md` там же).
- Firebase-деплой и прокси `/api/**` **не удаляем**: это путь отката
  минимум на неделю. `firebase.json`, `.github/workflows/firebase-hosting.yml`
  и Cloud Run `mentalix-auth-proxy` остаются как есть; workflow запускается
  только вручную (`workflow_dispatch`), после CI он больше не стартует.

## 1. Что важно знать про сборку

Приложение — обычный Vite SPA: `npm ci && npm run build` кладёт готовые файлы
в `dist`, точка входа — `dist/index.html`. Никакого серверного рендера и
Node-процесса в проде нет.

Адрес API берётся **только** из `VITE_API_BASE_URL`
(`src/lib/api.js`, `src/platform/web.adapter.js`). Все роуты backend живут под
`/api/*` (`/api/health`, `/api/telegram/webhook`), а клиент дописывает пути без
префикса (`/checkin`, `/subscription`, `/payments/yookassa/create`), поэтому
префикс `/api` в значении обязателен:

```
VITE_API_BASE_URL = https://api.mentalix.space/api
```

Без этой переменной клиент падает на фолбэк `/api` — это путь Firebase-прокси,
на Timeweb такого прокси нет.

### Переменные окружения сборки (шаг «Переменные»)

| Переменная | Значение | Зачем |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://api.mentalix.space/api` | все запросы к API |
| `VITE_TELEGRAM_BOT_USERNAME` | `Mentalix_club_bot` | виджет Telegram Login на вебе |
| `VITE_EMAIL_LOGIN_ENABLED` | `false` | пока у проекта нет своего домена в Resend |

Флаги песочницы (`VITE_LOCAL_PREVIEW`, `VITE_TG_SHELL`, `VITE_PRO_MOCK`,
`VITE_PRO_REVIEW_PLAN_ENABLED`, `VITE_PAYMENT_UI_ENABLED`) в продакшн-сборку
**не передаём** — это только Base44-превью, поведение по умолчанию безопасное.

## 2. Создание приложения в App Platform

1. Timeweb Cloud → раздел **App Platform** → «Создать».
2. Подключите GitHub и выберите репозиторий `Mentalix`, ветку `main`.
   Автодеплой («Сборка по последнему выполненному коммиту») оставьте включённым.
3. Тип приложения — **Frontend** (статический сайт). Платформа сама определит
   Node и Vite; версию Node держите 22 (в репозитории `.nvmrc` и
   `engines.node >= 22.22.1`).
4. «Показать расширенные настройки»:
   - **Команда сборки**: `npm ci && npm run build`
   - **Директория сборки**: `dist`
   - **Путь до директории проекта**: оставить пустым (репозиторий — корень проекта)
   - **Переменные**: три строки из таблицы выше
5. Регион — РФ (Москва или Санкт-Петербург), имя приложения — например `mentalix-frontend`.
6. «Заказать» → дождитесь зелёного лога деплоя. Технический домен вида
   `*.twc1.net` откроется сразу — это ещё не боевой адрес.

### SPA-fallback (обязательно)

В Timeweb вместо `rewrites` из `firebase.json`:

**Настройки → Настройки веб-сервера → SPA Fallback → включить.**

Тогда любой путь без файла (например `/auth/email`, `/themes/12/reflect`)
отдаёт `/index.html`, и приложение открывается на нужном экране. Без этой
галкой прямые ссылки получат 404.

Файл `firebase.json` для Timeweb не читается вообще — его можно не трогать,
он нужен только откату.

### /privacy, /privacy/, /privacy.html

Политика конфиденциальности (нужна BotFather) собирается физическими файлами,
поэтому работает на любом статическом хостинге без правил:

- `dist/privacy.html` → `https://mentalix.space/privacy.html`
- `dist/privacy/index.html` → `https://mentalix.space/privacy/`

Оба файла генерирует `privacyPagePlugin` в `vite.config.js` из
`src/content/privacyPolicy.js` (текст политики не дублируется).

Канонический адрес — **со слэшем**: `https://mentalix.space/privacy/`. Он же
идёт в BotFather и в текстах, и он же стоит в ссылке экрана входа
(`src/screens/WebAuthScreen.jsx`), поэтому адреса без слэша нигде не осталось.
Редирект в «Настройки веб-сервера → Редиректы» **не обязателен**: при
включённом SPA Fallback `/privacy` просто откроет приложение.

## 3. Домен mentalix.space и SSL

1. **Настройки → Домены → Добавить домен** → `mentalix.space`
   (при желании `www.mentalix.space` — тогда в «Редиректах» добавьте
   `host www.mentalix.space → mentalix.space`, код `301`).
2. DNS: панель покажет нужные записи. Если домен обслуживается в Timeweb —
   они создаются автоматически; если у другого регистратора — пропишите
   выданные `A`/`CNAME` (для apex-домена обычно `A` на выданный IP).
3. SSL (Let's Encrypt) выпускается автоматически после привязки домена;
   дождитесь статуса «активен» рядом с доменом. Отдельный сертификат
   покупать не нужно.
4. Проверка: `https://mentalix.space/` открывается без предупреждений
   браузера, `https://mentalix.space/privacy/` показывает политику,
   в консоли нет ошибок CORS на `api.mentalix.space`.

## 4. BotFather

1. `/mybots` → `Mentalix_club_bot` → **Bot Settings → Menu Button**
   (`/setmenubutton`): адрес Mini App — `https://mentalix.space/`.
2. **Bot Settings → Configure Mini App** (или `/newapp`): URL —
   `https://mentalix.space/`. Mini App у бота может быть только один,
   поэтому старое значение заменяется, а не дополняется.
3. **Bot Settings → Domain** (`/setdomain`): `mentalix.space` — без `https://`
   и без пути. Этот домен нужен виджету Telegram Login на вебе.
4. Пока идёт откатный период, старый домен Firebase можно оставить в списке
   доменов Telegram Login; адрес Mini App при этом уже новый.

## 5. Состояние API

Фронтенд ходит на `api.mentalix.space` с `credentials: 'include'` и
заголовком `Authorization` (`tma <initData>` в Telegram, `Bearer <token>` на
вебе).

CORS на backend **уже настроен** (mentalix-bot PR #205): `allow_origins` из
`CORS_ALLOW_ORIGINS=https://mentalix.space`, `allow_credentials=True`,
заголовок `Authorization` разрешён явно. Со стороны фронтенда настраивать
CORS, прокси или cookie больше ничего не нужно: `mentalix.space` и
`api.mentalix.space` — same-site, cookie сессии host-only на
`api.mentalix.space` с `SameSite=Lax` работают и при возврате с ЮKassa.

Единственная настройка окружения backend, которую держим в чек-листе
переезда, — `YOOKASSA_RETURN_URL = https://mentalix.space/?payment=return`.

**Точный путь возврата после оплаты, который ждёт фронтенд** —
`https://mentalix.space/?payment=return` (параметр `payment=return`,
`src/lib/yookassaCheckout.js`). Другой путь фронт не распознает как возврат
с ЮKassa: экран подписки просто не откроется.

## 6. Откат на Firebase

Ничего удалять не нужно, всё осталось в репозитории:

1. BotFather: верните адрес Mini App и домен Telegram Login на
   `https://mentalix-production.web.app` (Domain — `mentalix-production.web.app`).
2. DNS: верните `mentalix.space` на прежний хостинг или оставьте Timeweb
   приложение остановленным (App Platform → «Остановить»).
3. Фронтенд: запустите Actions → «Firebase Hosting» → Run workflow (только
   ручной запуск) — он собирает с `VITE_API_BASE_URL=/api`,
   `firebase.json` направляет `/api/**` в Cloud Run `mentalix-auth-proxy`.
4. Backend: верните `YOOKASSA_RETURN_URL` на
   `https://mentalix-production.web.app/?payment=return` и прежний upstream
   прокси.

Проверка отката: вход через Telegram, гостевой вход на вебе, запись чек-ина,
`/privacy`, оплата Pro и возврат с ЮKassa.

## 7. Мелочи, о которых легко забыть

- Локальный dev-сервер (`npm run dev`) проксирует `/api` на Render —
  это только для разработки, на сборку Timeweb не влияет.
- Демо-режим `?demo=1` включается только на разрешённых хостах
  (`src/lib/demoMode.js`); `mentalix.space` в этом списке нет, поэтому
  на боевом домене демо-данные не показываются.
- Гостевой вход в вебе разрешён только на боевых хостах
  (`src/lib/guestAuth.js`): `mentalix.space`, `mentalix-production.web.app`,
  `mentalix-production.firebaseapp.com`.
