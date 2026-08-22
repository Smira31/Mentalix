# Mentalix — Current Project State

Дата последней проверки: **22.08.2026, Europe/Moscow**.

Этот файл фиксирует только текущее состояние Mentalix. История изменений остаётся
в `CHANGES.md`, планы — в `ROADMAP.md`, рабочие детали — в `TASKS.md`.

## 1. Главная цель текущего этапа

- Выпустить качественную первую версию Mentalix.
- Не расширять scope без необходимости.
- Сначала устранять release blockers и подтверждать production фактическими
  проверками.

## 2. Production / Infrastructure

### Frontend

- Hosting: **Vercel**.
- Production URL: `https://mentalix.vercel.app`.
- Production commit: `38140019195a5004809d94aff45d615b27ca19ec`
  (`main`, merge PR #129).
- Статус: GitHub commit status `Vercel: success`; прямой запрос к URL вернул
  `HTTP 200` 21.08.2026.
- Production rewrite в актуальном `vercel.json` направляет `/api/*` на
  `https://mentalix-bot.onrender.com/api/*`.

### Backend

- Текущий production hosting: **Render Free**.
- Production URL: `https://mentalix-bot.onrender.com`.
- Health: `GET /api/health` вернул `HTTP 200` и `{"status":"ok"}` 21.08.2026.
- Текущий GitHub `main`: `23610b38de4191bbce05282df07b42d965adb380`.
- Точный commit работающего Render deployment: **НЕ ПОДТВЕРЖДЕНО**. Health
  endpoint не сообщает SHA, а GitHub не содержит deployment status Render для
  backend commit.
- Koyeb не является текущей P0 и не должен заменять работающий Render до первого
  релиза без подтверждённого blocker. Koyeb остаётся кандидатом на бесплатный
  backend hosting для отдельного последующего сравнения.
- Существование Koyeb service, его URL и deployment: **НЕ ПОДТВЕРЖДЕНО**. В
  доступной среде нет Koyeb CLI/API-сессии; в актуальном backend-коде `KOYEB_*`
  сохраняется только в совместимых именах переменных, которые по `RENDER.md`
  направлены на Render.

### Database

- Целевая БД: **Neon PostgreSQL**.
- Документированная production БД: проект `Mentalix`, ветка `production`, база
  `neondb`.
- Backend-код принимает pooled Neon `postgresql://` URL, преобразует его для
  `asyncpg` и сохраняет обязательный `ssl=require`.
- Актуальная схема создаётся при старте FastAPI через SQLAlchemy
  `Base.metadata.create_all()` и идемпотентные `ALTER TABLE` в
  `backend/main.py`; Alembic в актуальном репозитории не используется.
- В коде определено 26 таблиц, включая `mentalix_user_facts`.
- Фактическое значение Render `DATABASE_URL`, его Neon endpoint, live-схема и
  количество строк: **НЕ ПОДТВЕРЖДЕНО** — секреты и Neon dashboard в этой
  проверке недоступны.
- `RENDER.md` сообщает, что Neon создавался как fresh schema без импорта
  исторических Railway rows. Это необходимо проверить read-only по обеим БД:
  фактический состав Neon и наличие исторических данных в Railway сейчас
  **НЕ ПОДТВЕРЖДЕНЫ**.
- Нельзя утверждать потерю данных, пока read-only не проверены существующая Neon
  DB и legacy Railway PostgreSQL. Существование старого Railway volume и наличие
  данных в Neon — разные факты.

### Legacy infrastructure

- Railway — legacy-инфраструктура и не входит в текущий production request path.
- В Railway-проекте `supportive-curiosity`, environment `production`, при
  последней read-only проверке оставались:
  - FastAPI service `mentalix-bot` без активного deployment;
  - bot worker `accurate-expression` без активного deployment;
  - PostgreSQL service с volume `postgres-volume` в состоянии `READY`
    (примерно 118 МБ из 500 МБ).
- `https://mentalix-bot-production.up.railway.app/api/health` сейчас отвечает
  `404 Application not found`.
- Данные Railway PostgreSQL не исследовались; их потеря **НЕ ПОДТВЕРЖДЕНА**.
- Railway нельзя автоматически restart/redeploy, а его PostgreSQL/volume нельзя
  удалять, изменять или считать источником для новой миграции без отдельного
  решения владельца.
- Старые Railway references остаются в исторических документах и в dev-only
  proxy `vite.config.js`; production `vercel.json` на Railway не указывает.

## 3. Что сейчас работает

- Frontend production открывается на Vercel (`HTTP 200`).
- Backend health на Render отвечает (`HTTP 200`, `{"status":"ok"}`).
- Первый запуск, проверенный владельцем на реальном iPhone внутри Telegram:
  профиль бота → `/start` → единственный CTA → onboarding → прежний Today;
  повторный запуск onboarding не показывает.
- GitHub Actions frontend для production commit `cf1972ca` завершился успешно.
- Hourly workflow backend scheduled jobs завершался успешно на current backend
  `main` `23610b38` 21.08.2026. Это подтверждает вызов защищённого jobs endpoint,
  но не доставку каждого конкретного напоминания.
- В `RENDER.md` зафиксирована успешная проверка GigaChat-ответа в Mini App;
  повторная независимая проверка в рамках этого аудита не выполнялась.

## 4. Что сейчас не работает / release blockers

- **Production backend provenance неполна:** точный SHA активного Render
  deployment не подтверждён.
- **Связь Render → Neon не подтверждена напрямую:** фактический production
  `DATABASE_URL` и его соответствие ожидаемой Neon production DB не проверены.
- **Neon data gate не закрыт:** live-схема, наличие `mentalix_user_facts` и
  состав текущих пользовательских данных не проверены напрямую.
- **Исторические данные требуют сверки:** `RENDER.md` сообщает о fresh Neon
  schema без импорта Railway rows, но обе БД read-only не сопоставлялись. Потеря
  данных не подтверждена.
- **Data-dependent функции после смены API:** Today data, CheckIn, Library и
  Trends сейчас нельзя объявить сломанными — backend health восстановлен и
  frontend указывает на Render, — но их актуальный end-to-end тест на реальном
  iPhone после этой смены **НЕ ПОДТВЕРЖДЁН**.
- **Unified Mobile Layout:** изменения вошли в `main` через PR #129 и считаются
  текущей production-базой. Ручной Telegram/iPhone gate остаётся отдельной
  проверкой для новых изменений.
- Koyeb не является release blocker: существование его service не подтверждено,
  а текущий Render health работает.

## 5. Frontend / UI

- Production: Vercel, commit `38140019195a5004809d94aff45d615b27ca19ec`.
- PR #129 (`MXL-PERFORMANCE-LIBRARY-TRENDS-SWR-001`) merged 22.08.2026; CI и
  Vercel Preview имеют статус `success`.
- Предыдущая ветка `fix/unified-mobile-layout` больше не является актуальной
  рабочей веткой; новая работа ведётся в `feat/practices-catalog`.
- `src/screens/Today.jsx` в PR #129 не изменён.
- Пилоты `MXL-CHECKIN-SCREEN-RHYTHM-001` и `MXL-TODAY-SCREEN-RHYTHM-001` приняты;
  ручной Telegram/iPhone gate для обоих пройден владельцем 22.08.2026.
- `MXL-PERFORMANCE-TODAY-SWR-001` принят; versioned session snapshot и background
  revalidation работают поверх существующего Today cache. Ручной Telegram/iPhone gate
  пройден владельцем 22.08.2026. Library и Trends в этот пилот не входили.
- `MXL-PERFORMANCE-LIBRARY-TRENDS-SWR-001` принят и вошёл в production через PR #129;
  Library и Trends получили versioned session snapshot/SWR-контракт. Ручной
  Telegram/iPhone gate пройден владельцем 22.08.2026. Lazy-loading `recharts` в
  release не входит.
- Следующая активная задача: `MXL-PRACTICES-CATALOG-001` — минимальный пилот
  каталога главного экрана Practices без изменения flows, API и navigation.
- В ветке `feat/ux-automated-gate-001` (PR открыт, не смёржен) реализован
  Playwright gate `npm run ux:check`: два mobile viewport, изолированные fixtures,
  16 screenshots и `artifacts/ux-check/report.md`. Контрольный прогон проходит
  15/16 экранов и фиксирует fail Today на `320×568` из-за перекрытия видимого CTA
  нижней навигацией — заведена задача `MXL-UI-CTA-OVERLAP-001` (открыта). UI,
  production, Preview, backend и API не менялись.
- Ранее описанный как незакоммиченный release UX-diff для Issue #122 в текущем
  рабочем дереве отсутствует; его фактическое состояние и приёмка требуют
  отдельной проверки. Backend/API, порядок Today и навигация этой фиксацией не
  менялись. Production/backend сведения в этом разделе не переопределяются.

## Known Issues

- **MXL-PRACTICES-KEYBOARD-POSTRELEASE-001:** Telegram iOS WebView автоматически смещает форму создания Ritual/Asceza при переходе на 4-е и 5-е поле. Функциональность не нарушается, создание работает. Баг имеет низкий приоритет и переносится на пострелизный этап.

- Последние эксперименты keyboard position lock и fixed-layout для creation forms Ritual/Asceza откатаны; формы возвращены к принятой Preview-композиции.

## 6. Today / Core Loop

В актуальном `origin/main` существуют:

- Нить дня;
- Точка внимания и вход «Разгрузить голову»;
- Пилот · утро;
- state-driven hero Today;
- Пульс;
- CheckIn и вечерний разбор;
- блок «День»;
- Тема недели;
- Мысль дня.

Data-dependent блоки:

- hero state, CheckIn и вечерний разбор зависят от `/api/checkin`;
- Пульс зависит от `/api/analytics/pulse`;
- «День», ритуалы и аскезы зависят от соответствующих API и логов;
- Тема недели зависит от `/api/themes`;
- Мысль дня зависит от `/api/quotes/today`;
- Trends зависит от `/api/analytics`.

Канонический core loop:

`состояние → следующий шаг → действие → отметка → закономерность → следующий день`.

Логику и приоритеты Today нельзя менять в рамках восстановления
инфраструктуры или исправления Unified Mobile Layout.

## 7. AI

- В интерфейсе существуют три роли: Собеседник (`mayak`), Наставник
  (`kompas`) и Следопыт (`dnevnik`).
- Conversation histories разделены по `user_id + persona` и не должны
  смешиваться.
- Shared user memory реализована моделью `MentalixUserFact`, таблицей
  `mentalix_user_facts` и общим контекстом пользователя между персонами.
- Backend PR #10 «Исправить общую память AI-персон» **merged** 21.08.2026;
  merge commit `b817c3051c589ff32444959eb764081b579073c0`.
- Текущий backend `main` `23610b38` содержит PR #10 и последующие PR #12/#13.
- PR #10 не был развёрнут в legacy Railway. Наличие его кода в активном Render
  deployment и таблицы в live Neon документировано в `RENDER.md`, но без
  runtime SHA и прямого Neon-аудита остаётся **НЕ ПОДТВЕРЖДЕНО**.
- AI provider в current backend — GigaChat, модель `GigaChat-2`.
- Вызовы GigaChat используют `verify=False`. Операционный TLS blocker в
  `RENDER.md` не отмечен и GigaChat там указан как проверенный, но отключённая
  проверка TLS остаётся техническим и security-риском.
- Актуальная отдельная задача перехода на Groq в GitHub/документации не найдена:
  её номер, scope и приоритет — **НЕ ПОДТВЕРЖДЕНО**.

## 8. Telegram Bot

- Актуальная production-архитектура backend рассчитана на Telegram webhook:
  `/api/telegram/webhook` внутри единого Render Web Service.
- Standalone `bot/bot.py` по-прежнему поддерживает long polling через
  `delete_webhook()` и `start_polling()`, но legacy Railway worker остановлен и
  не должен запускаться параллельно.
- Точки входа пользователя: `/start`, bot menu button и Mini App URL.
- `reminder_loop`, `weekly_digest_loop` и `comeback_loop` сохранены. На Render
  они вызываются с `once=True` через защищённый `/api/internal/jobs/tick`,
  который запускает hourly GitHub Actions workflow.
- Dispatcher использует `MemoryStorage`; FSM-состояния не являются durable.
- `/start` и открытие Mini App подтверждены владельцем на реальном iPhone.
- Live `getWebhookInfo` в этом аудите не запрашивался; текущий зарегистрированный
  webhook URL — **НЕ ПОДТВЕРЖДЕНО**.
- Прежняя проблема `BOT_TOKEN` относилась к остановленному Railway deployment и
  проявлялась как `TelegramUnauthorizedError`. Работающий `/start` на текущем
  production подтверждает пригодность активного токена, но само значение
  секрета не проверялось и не должно фиксироваться в Git.

## 9. Данные / Content

- Current backend schema содержит 26 таблиц:
  `articles`, `asceza_logs`, `ascezas`, `brain_sessions`, `checkins`,
  `course_notes`, `courses`, `donations`, `email_otps`, `events`,
  `focus_sessions`, `goals`, `habit_logs`, `habits`, `link_codes`,
  `media_settings`, `mentalix_messages`, `mentalix_user_facts`, `ritual_logs`,
  `rituals`, `subscriptions`, `theme_progress`, `themes`, `user_quotes`,
  `users`, `web_users`.
- Library articles: API и таблица существуют; в коде есть одна seed-статья.
  Фактические строки Neon — **НЕ ПОДТВЕРЖДЕНО**.
- Themes: API и таблицы существуют; в коде есть две seed-темы.
  Фактические строки Neon — **НЕ ПОДТВЕРЖДЕНО**.
- Quotes: пользовательские мысли хранятся в `user_quotes`; фактические строки
  Neon — **НЕ ПОДТВЕРЖДЕНО**.
- CheckIns: модель, история и сохранение существуют; фактические строки Neon —
  **НЕ ПОДТВЕРЖДЕНО**.
- Rituals и ascezas: модели, логи и API существуют; фактические строки Neon —
  **НЕ ПОДТВЕРЖДЕНО**.
- Analytics вычисляется из пользовательских данных и событий; корректность на
  live Neon после миграции **НЕ ПОДТВЕРЖДЕНА**.
- Нельзя утверждать, что данные потеряны. Известно только, что исторические
  Railway rows намеренно не импортировались в свежую Neon-схему.

## 10. Что уже сделано

- Production frontend работает на Vercel и направляет API на Render.
- Render Free + fresh Neon migration реализована в backend PR #12; health
  endpoint отвечает.
- Issue #120 завершён: storefront `/start`, один CTA и короткий onboarding
  прошли реальный iPhone/Telegram gate; Today не перерабатывался.
- Shared AI memory PR #10 merged в backend `main`.
- Railway application services выведены из production request path.
- Локальный Telegram Preview workflow зафиксирован: `npm run preview` публикует текущее рабочее дерево в отдельный
  Vercel project `mentalix-preview`, отправляет ссылку через основной бот и удаляет deployment через один час; `npm run preview:stop`
  удаляет активный deployment досрочно и останавливает связанный cleanup-процесс.
- Финальный локальный smoke Preview → Telegram → stop пройден 22.08.2026; новых багов workflow не выявлено. Реальный iPhone gate
  остаётся ручным подтверждением владельца.

## 11. Что НЕ сделано

- Миграция backend с фактически работающего Render на целевой Koyeb не
  подтверждена и, по найденным фактам, не завершена.
- Не подтверждены live Koyeb service, runtime Render commit, runtime
  `DATABASE_URL`, live Neon schema и данные.
- Не выполнен свежий end-to-end gate data-dependent экранов после перехода API
  на Render.
- Новые изменения Practices ещё не прошли ручной Telegram/iPhone gate.
- Не принято подтверждённое решение по Groq и по безопасному включению TLS
  verification для GigaChat.

## 12. Текущая P0-задача

**P0 — реализовать и проверить `MXL-PRACTICES-CATALOG-001`:**

- заменить плотную grid-стену Practices на спокойный каталог/список;
- сохранить существующие flows, API, navigation и внутренние practice screens;
- пройти lint, build, diff-check, Preview и ручной Telegram/iPhone gate;
- не менять production backend, Render и Neon.

Production-цепочка `Vercel → Render → Neon` и её provenance остаются отдельным
инфраструктурным риском и не изменяются этим frontend-релизом.

## 13. Следующие задачи

- **P0:** завершить `MXL-PRACTICES-CATALOG-001` и пройти ручной Telegram/iPhone gate.
- **P1:** подтвердить и стабилизировать текущую production-цепочку
  `Vercel → Render → Neon`, затем пройти data-dependent gate на реальном iPhone.
- **P1:** после Practices отдельно подтвердить data-dependent frontend-сценарии
  на реальном iPhone внутри Telegram.
- **Later:** Koyeb остаётся кандидатом на бесплатный backend hosting. Решение о
  миграции принимать после стабилизации текущего production, отдельно сравнив
  Render и Koyeb. Здесь же отдельно решить вопросы GigaChat TLS verification и
  Groq.

## 14. Зафиксированные архитектурные решения

- Railway не считать целевой инфраструктурой без нового явного решения.
- Текущую production-цепочку считать `Vercel → Render → Neon`, пока фактическая
  проверка не покажет иное.
- Не менять production hosting перед первым релизом, если текущий Render
  работает и нет подтверждённого blocker, требующего миграции.
- Koyeb остаётся кандидатом на бесплатный backend hosting. Решение о миграции
  принимать после стабилизации текущего production, отдельно сравнив Render и
  Koyeb.
- Не deploy текущий backend вслепую.
- Не создавать новую БД вместо существующей без явного подтверждения.
- Сообщение `RENDER.md` о fresh Neon schema без импорта Railway rows проверять
  read-only по обеим БД; до этого не утверждать потерю данных.
- Не хранить секреты во frontend или Git.
- Не смешивать AI conversation histories разных персон.
- Не добавлять новые функции до закрытия release blockers.
- Не делать полный UI redesign перед первым релизом.
- Preview-тестирование проводить через отдельный Vercel project; commit/push выполнять только после iPhone/Telegram gate.

## 15. Неподтверждённые факты

- Существует ли настроенный Koyeb app/service, его URL, status и deployment SHA.
- Подключён ли Koyeb к существующей Neon production branch.
- Точный commit активного Render deployment.
- Фактическое значение runtime `DATABASE_URL` и его Neon endpoint.
- Live-схема Neon, наличие всех 26 таблиц и `mentalix_user_facts`.
- Состав и сохранность текущих пользовательских данных в Neon.
- Текущий Telegram webhook URL по `getWebhookInfo`.
- Актуальная end-to-end работа Today data, CheckIn, Library и Trends на реальном
  iPhone после смены API на Render.
- Точный список и сценарии регрессий Unified Mobile Layout.
- Номер, scope и приоритет задачи Groq.
- Содержимое legacy Railway PostgreSQL volume; подтверждён только сам volume,
  но не его строки.

## 16. Testing Infrastructure (Post-MVP, Planned)

Текущее состояние (22.08.2026):

- **UX Gate v1:** локальная команда `npm run ux:check` на Playwright реализована в ветке `feat/ux-automated-gate-001` (PR открыт).
  - Два viewport: 390×844, 320×568.
  - Маршрут: Today → Check-in → Practices → Rituals → Ascezas → First Step → Library → Trends.
  - Детерминированные fixtures, 16 скриншотов, базовые layout-проверки.
  - Контрольный прогон: 15/16 pass (Today 320×568 fail из-за navbar overlap — `MXL-UI-CTA-OVERLAP-001`, открыта).
  - Ручной iPhone gate документирован в отчёте как обязательный.

- **Документация:** создана в `docs/testing/`:
  - `PLAYWRIGHT_ROADMAP.md` — архитектура 5-этапного развития;
  - `UX_GATE.md` — расширение на states (loading, empty, filled, error);
  - `VISUAL_REGRESSION.md` — baseline management;
  - `PERFORMANCE.md` — TTI, FCP, bundle size, Core Web Vitals;
  - `DESIGN_GUARD.md` — автоматические дизайн-проверки;
  - `RELEASE_GATE.md` — полная pre-release последовательность;
  - `TELEGRAM_GATE.md` — ручной iPhone checklist.

**Roadmap (Post-MVP, Infrastructure):**

1. **Этап 1: UX Gate v2 — States Coverage** (1–2 спринта)
   - Расширить npm run ux:check на 40–50 новых тестов (states для всех экранов).
   - Результат: полное покрытие Today–Trends, <2 мин на run.

2. **Этап 3: Edge Cases Scenarios** (параллельно)
   - Библиотека 50+ сценариев для manual gate и CI-тригеров.

3. **Этап 2: Visual Regression** (после Этапа 1)
   - Baseline management, pixel-diff, GitHub workflow.
   - Требуется: утверждённый baseline.

4. **Этап 4: Performance Gate** (после Этапа 2)
   - Мониторинг TTI, FCP, bundle, network, CLS.
   - Требуется: baseline после first release.

5. **Этап 5: Contract Tests** (параллельно)
   - JSON Schema validation всех endpoints.

**Блокеры:** нет.

**Зависимости:** после первого production release рекомендуется установить baseline для visual и performance.
