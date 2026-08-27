# Mentalix — Current Project State

Дата последней проверки: **26.08.2026, Europe/Moscow**.

Этот файл фиксирует только текущее состояние Mentalix. История изменений остаётся
в `CHANGES.md`, планы — в `ROADMAP.md`, рабочие детали — в `TASKS.md`.

## 0. MXL-007 — текущий продуктовый scope

- Владелец утвердил 26.08.2026 Stoic-inspired модель Today: **mood check-in → утренняя подготовка → действие дня → вечерний анализ → новый шаг**.
- Реализация завершена через PR #197; commit `afdc266` находится в `main`, remote-ветка удалена. Scope ограничился labels и поясняющими текстами существующего Today/«Цикла дня».
- Backend, API, существующие переходы и визуальный язык Mentalix не менялись. GitHub CI и Vercel Preview прошли успешно; владелец подтвердил работу сценария на телефоне в Telegram.

## 0.1 Краткая сводка на 26.08.2026

- **Репозиторий:** `main` чистый и синхронизирован с `origin/main`; текущий HEAD — `ec65618`.
- **Последние завершённые изменения:** единая лента History (`PR #194`), именованные уровни серии (`PR #196`), Stoic-inspired цикл Today (`PR #197`), Stoic-like Journey (`PR #200`) и синхронизация статусов задач (`PR #202`).
- **Проверки:** `npm run ux:check` прошёл на viewport 390×844 и 320×568; последний GitHub Actions run для `main` успешен; `docs:check` подтверждает 94 Markdown-файла, 19 canonical task ID и 0 ошибок.
- **Production:** 26.08.2026 Vercel `/api/health` вернул `200 OK` в 3/3 попытках (0.30–0.41 с), Render `/api/health` вернул `200 OK` в 3/3 попытках (1.95–2.13 с). Точный commit Vercel Production отдельно не подтверждён.
- **Backlog:** `MXL-007`, `MXL-008`, `MXL-021`, `MXL-011` и `MXL-005` завершены; `MXL-006` находится в реализации и ожидает iPhone/Telegram gate. Остальные активные записи остаются в backlog.
- **Открытые PR:** #152 и четыре draft PR остаются без merge; они не входят в текущий release scope из-за устаревшей базы, владельческого решения или backend/manual gate.

## 1. Документационный operating layer

- **MXL-DOCS-OPERATING-SYSTEM-001** реализуется в ветке
  `docs/documentation-operating-system-001`: добавлен
  [`docs/DOCUMENTATION_GUIDE.md`](docs/DOCUMENTATION_GUIDE.md), README получил
  единый маршрут чтения и исправлено устаревшее описание текущего backend hosting.
- Этот слой не меняет продукт, API, backend, данные, дизайн или release status.
- После merge нужно обновить дату этого файла и отдельным read-only проходом
  подтвердить GitHub `main` SHA и фактический production deployment SHA, не
  смешивая эти два факта.

## 2. Главная цель текущего этапа

- Выпустить качественную первую версию Mentalix.
- Не расширять scope без необходимости.
- Сначала устранять release blockers и подтверждать production фактическими
  проверками.

## 3. Production / Infrastructure

### Frontend

- Hosting: **Vercel**.
- Production URL: `https://mentalix.vercel.app`.
- Последний точно подтверждённый здесь production commit:
  `b8549357c85794443be0b0419fc243a1da54c284`
  (`main`, squash-merge PR #172, `MXL-THEME-ACCENT-001`). Между этим
  коммитом и предыдущей зафиксированной здесь точкой (`4443b947`, PR #167)
  в `main` вошли ещё PR #168–#171 (empty-state задачи Today/Ascezas/
  History/QuotesManager, обновление ROADMAP по Stoic-идеям) — они не были
  отдельно отражены в этом файле в момент своего мержа; полное
  постатейное описание — `CHANGES.md`/`TASKS.md`.
- Актуальный GitHub `origin/main` на 25.08.2026 — `7a64423f` (PR #179,
  честное подтверждение удаления Preview); перед ним через PR #178 выпущен
  первый rollout Writing Canvas (`0af5b4cc`). Соответствие живого Vercel
  Production этим двум более новым commit отдельно не проверялось, поэтому
  они не подменяют последнюю точно подтверждённую production-точку выше.
- Статус: GitHub Actions («Автоматическая проверка Mentalix») для `main`
  на `b8549357` — `success` (25.08.2026). Прямой HTTP-запрос к
  `https://mentalix.vercel.app` после этого деплоя — `200`; точное
  соответствие живого Vercel-деплоя именно этому commit SHA отдельно не
  проверялось (нет прямого запроса к Vercel API/Dashboard в рамках этой
  правки).
- Production rewrite в актуальном `vercel.json` направляет `/api/*` на
  `https://mentalix-bot.onrender.com/api/*`.

### Backend

- Текущий production hosting: **Render Free**.
- Production URL: `https://mentalix-bot.onrender.com`.
- Health: `GET /api/health` вернул `HTTP 200` и `{"status":"ok"}` 21.08.2026.
- Текущий GitHub `main`: `23610b38de4191bbce05282df07b42d965adb380`.
- Точный commit работающего Render deployment: **ПОДТВЕРЖДЕНО 23.08.2026**.
  Render Dashboard (`mentalix-bot`, `srv-da468ek9v7es739a3250`, проект
  `Mentalix`, `Smira31/mentalix-bot`, ветка `main`) — событие «Deploy live
  for `23610b3`: Merge pull request #13 from
  Smira31/feature/issue-120-telegram-storefront», 21.08.2026 20:11. SHA
  совпадает с GitHub `main` HEAD посимвольно. GitHub Deployments API для
  этого репозитория не отражает Render (там только устаревшие записи
  Railway `supportive-curiosity`) — provenance подтверждён напрямую через
  Render Dashboard, а не через GitHub.
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
- **ПОДТВЕРЖДЕНО 23.08.2026** (Render Dashboard + Neon Console, read-only):
  - Render `mentalix-bot` содержит env var `DATABASE_URL` (значение не
    раскрывалось — секрет остался в Render, не скопирован и не выведен в
    чат/файлы).
  - Neon-проект `Mentalix` (`spring-hill-58592745`), регион AWS Europe
    Central 1 (Frankfurt) — тот же регион, что у Render-сервиса. Единственная
    ветка — `production` (Default), Compute «Primary» в состоянии `Active` на
    момент проверки, `compute last active` — 18 минут назад в момент захода
    в консоль, то есть недавний живой трафик от backend.
  - SQL Editor Neon Console (ветка `production`, база `neondb` — совпадает с
    документированным именем) подтвердил через
    `information_schema.tables`: ровно 26 таблиц в схеме `public`,
    посимвольно совпадают с задокументированным списком; `mentalix_user_facts`
    присутствует.
  - Живые данные (read-only `count(*)`): `users` = 2, `checkins` = 1,
    `ritual_logs` = 8, `mentalix_messages` = 14, `mentalix_user_facts` = 0.
- `RENDER.md` сообщает, что Neon создавался как fresh schema без импорта
  исторических Railway rows. Малое количество строк (2 пользователя, 1
  checkin) согласуется с этим утверждением, но не является прямым
  доказательством: содержимое legacy Railway PostgreSQL volume отдельно не
  читалось, сопоставление строк между базами не выполнялось. Наличие
  исторических данных в Railway остаётся **НЕ ПОДТВЕРЖДЕНО**.
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
  профиль бота → `/start` → единственный CTA → пятишаговый Onboarding
  (приветствие → фокус → возраст → напоминания → «план готов») → Today;
  повторный запуск Onboarding не показывает. Пятишаговый сценарий восстановлен
  в PR #161, commit `ded6f9d2`, и подтверждён владельцем как актуальное
  продуктовое решение.
- GitHub Actions frontend для production commit `711f440b` завершился успешно.
- Hourly workflow backend scheduled jobs завершался успешно на current backend
  `main` `23610b38` 21.08.2026. Это подтверждает вызов защищённого jobs endpoint,
  но не доставку каждого конкретного напоминания.
- В `RENDER.md` зафиксирована успешная проверка GigaChat-ответа в Mini App;
  повторная независимая проверка в рамках этого аудита не выполнялась.

## 4. Что сейчас не работает / release blockers

- ~~Production backend provenance неполна~~ — **закрыто 23.08.2026**, SHA
  Render deployment подтверждён и совпадает с GitHub `main` HEAD (§2).
- ~~Связь Render → Neon не подтверждена напрямую~~ — **закрыто 23.08.2026**,
  `DATABASE_URL` задан в Render, Neon-проект `Mentalix`/ветка `production`
  показывает недавний живой compute-трафик (§2).
- ~~Neon data gate не закрыт~~ — **закрыто 23.08.2026**, live-схема (26
  таблиц, включая `mentalix_user_facts`) подтверждена напрямую через Neon SQL
  Editor (§2).
- **Исторические данные требуют сверки:** `RENDER.md` сообщает о fresh Neon
  schema без импорта Railway rows. Малое число живых строк в Neon (§2)
  согласуется с этим, но содержимое legacy Railway PostgreSQL volume
  отдельно не читалось — прямое сопоставление обеих БД не выполнено. Потеря
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

- `MXL-PRACTICES-EXPERIENCE-PILOT-001` закрыта 25.08.2026 — PR #180
  squash-смёржен в `main` (`b049e8d7`), CI и Vercel — `success`, ветка
  `codex/writing-canvas-rollout-remaining` удалена (remote + local). Пилот на
  практике «Без вины»: отдельное вступление, шестишаговый прогресс,
  центрированные сцены выбора и объяснения, статическая метафора «узел →
  путь» и честный completion-экран с оценкой «Нет / Немного / Да»; анимации
  намеренно не добавлялись. Тем же PR довложен единый верхний якорь заголовка
  (`StageHeading`) для всех шести шагов с идентичной координатой на шаге 1 и
  2, и отдельный keyboard-layout для Writing Canvas шага 1 (якорь не
  двигается, зона текста и кнопка «Дальше» подстраиваются под клавиатуру через
  существующий `useVisualViewportHeight`). Существующие `outcome`/`reflection`,
  двухминутный таймер и локальный лог сохранены; fullscreen-психологические
  практики действительно скрывают нижнюю навигацию. Unit 7/7, lint, build, UX
  smoke на `390×844`/`320×568` и diff-check зелёные; живой Telegram/iPhone
  gate пройден и подтверждён владельцем на реальном устройстве.
- `MXL-JOURNAL-MARKDOWN-001` закрыта 25.08.2026 через PR #176 (squash-merge
  `61b51452`) и выпущена в Vercel Production: после обратной связи владельца
  одиночные записи
  CheckIn и «Темы недели» переделаны в согласованный Writing Canvas без рамочной
  карточки, видимых Markdown-маркеров и полноширинной CTA: нижний dock
  `Aa / Пойти глубже / ✓` закреплён над клавиатурой. «Пойти глубже» сохраняет
  запись и передаёт контекст существующему «Наставнику». History и недельный
  разбор безопасно отображают сохранённую разметку. Backend/API/формат данных не
  менялись; unit/lint/build, UX smoke 20/20, GitHub CI и Vercel — зелёные.
  Владелец принял визуал и работу редактора на реальном iPhone внутри Telegram;
  публичный production `/api/health` вернул HTTP 200. Целевой Preview удалён
  вручную и подтверждён HTTP 404. Единый паттерн зафиксирован в
  `DESIGN_SYSTEM.md`; перенос остальных подходящих сценариев вынесен в
  `MXL-WRITING-CANVAS-ROLLOUT-001`.
- В `npm run preview:stop` подтверждён false-positive: команда сообщила об
  остановке, пока deployment оставался `Ready`/HTTP 200. До исправления
  `MXL-PREVIEW-STOP-VERIFY-001` cleanup считается завершённым только после
  проверки Vercel и HTTP 404.
- `MXL-THEME-ACCENT-001` закрыта 25.08.2026 через PR #172 (squash-merge,
  `b8549357`): идея 13 конкурентного анализа Stoic («смена фона/темы»),
  объём сужен владельцем до выбора акцентного цвета — `--c-bg` не
  менялся, `MXL-DEC-010` не пересматривалось. Новая секция Settings
  «Внешний вид», два варианта — золотой `#EDBD60` (дефолт) и лазурный
  `#5EB2ED`, хранение через `useSynced` (`src/lib/accentColor.js`),
  переключение — CSS-override `[data-accent='ice']` в `src/index.css`
  поверх единственного источника акцента `--c-gold`. В процессе найдены
  и исправлены два бага до live gate: (1) состояние `accent` изначально
  жило в двух независимых `useSynced`-инстансах (`App.jsx`/`Settings.jsx`)
  без канала синхронизации между ними — переключатель не перекрашивал
  интерфейс сразу по клику, только после перезагрузки; исправлено
  подъёмом состояния в `App.jsx` с прокидыванием пропом в `Settings`;
  (2) детальная карточка ритуала (`SemanticGlyph kind="ritual"`)
  оставалась золотой — легаси-класс `.bg-artbed` фиксировал `--c-gold`
  локально (защита от удалённой светлой темы, MXL-032), убрана одна
  строка. Живой gate на iPhone в Telegram подтверждён владельцем —
  акцент переключается корректно везде, включая карточку ритуала.
  `npm run lint`/`npm run build` — чисто. Подробности — `TASKS.md`/
  `CHANGES.md` 25.08.2026.
- `MXL-TODAY-CARD-TOGGLES-001` закрыта 25.08.2026 через PR #167
  (squash-merge, `4443b947`): в Settings добавлена секция «Карточки
  „Сегодня“» с пятью тумблерами (`focus`, `pulse`, `dayProgress`, `theme`,
  `quote`), Today скрывает соответствующие блоки по общему флагу
  `mx-today-cards-hidden`. Герой-карточка, `MorningPilotCard` и блок «Чек-ин
  выполнен» не входили в scope. `npm run lint`/`npm run build` пройдены
  локально; CI (`Проверка кода и сборки`, Vercel) — `success`. Backend,
  данные и остальные экраны не менялись.
- `MXL-ONBOARDING-POLISH-001` закрыта 24.08.2026 через PR #162
  (`b3253e93`): первый экран сведён к `Mentalix.`,
  дублирующая навигация шапки заменена системным Telegram BackButton с
  web-fallback, финальные motif-рисунки заменены простыми золотыми галочками.
  Код, build, два мобильных viewport и post-change gate на реальном iPhone
  внутри Telegram проверены; изменение находится в production.
- `MXL-XS-MAINTENANCE-001` принят владельцем 24.08.2026 в ветке
  `codex/xs-maintenance-batch`: подтверждённый onboarding dead code удалён,
  два живых CSS-якоря переименованы без изменения поведения, navbar
  отцентрирован симметричными боковыми резервами. Локальный UX gate и общий
  Preview/iPhone gate пройдены; PR #163 смёржен в `main` (`711f440b`), CI и
  Vercel Production — `success`.
- `MXL-AUTONOMOUS-SM-001` закрыта 24.08.2026, PR #164 (ветка
  `codex/autonomous-sm-maintenance`) смёржен в `main` (merge commit
  `dc5f2e9b`): P03 получил единую allowlist без изменения доступности,
  ручные query-string заменены чистым helper, добавлены три unit-контракта.
  Unit/lint/build/UX gate зелёные; изменения в production.
- PR #129 (`MXL-PERFORMANCE-LIBRARY-TRENDS-SWR-001`) merged 22.08.2026; CI и
  Vercel Preview имеют статус `success`.
- Предыдущая ветка `fix/unified-mobile-layout` больше не является актуальной
  рабочей веткой. `feat/practices-catalog` не содержала коммитов (0 diff) —
  см. `MXL-PRACTICES-CATALOG-001` ниже.
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
- `MXL-PRACTICES-CATALOG-001` закрыт 23.08.2026 без нового diff: при старте
  задачи выяснилось, что grid (`PracticeCard`) в `Practices.jsx` уже заменён
  на список (`PracticeRow`/`PracticeCategory`) коммитом `819b200b`
  (22.08.2026, вошёл в production через merge PR #130 `38140019`) —
  побочный, но осознанно сохранённый эффект отката keyboard-эксперимента
  (`MXL-PRACTICES-KEYBOARD-ROLLBACK-001`), не задокументированный тогда под
  этим ID. Владелец подтвердил вид экрана вживую и решил закрыть задачу
  документально. Подробности — `TASKS.md`/`CHANGES.md` 23.08.2026.
- `npm run ux:check` (Playwright gate, изначально ветка `feat/ux-automated-gate-001`,
  сейчас на `main`) реализован; собирает два mobile viewport в одном тесте
  (`390×844`, `320×568`). Контрольный прогон на текущем `main` 23.08.2026 —
  зелёный (1/1, ни одного упавшего экрана).
- `MXL-UI-CTA-OVERLAP-001` закрыта — вошло в `main` через PR #138
  (`fix/mxl-cta-lint-practices-cache`) 23.08.2026: декоративный SVG-глиф в
  hero-карточке Today сужен на `max-height: 650px` (`src/screens/Today.css`),
  чек-ин CTA больше не перекрыт нижней навигацией на `320×568`. Ручная
  проверка в Telegram владельцем пройдена.
- `MXL-LINT-CLEANUP-001` закрыта — все 30 ESLint warnings устранены тем же
  PR #138 23.08.2026; `npm run lint` — 0 errors, 0 warnings. UI, production,
  Preview, backend и API этими двумя задачами не менялись.
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
- `/start`, открытие Mini App и `/admin` подтверждены владельцем на реальном
  iPhone. Причина прежнего молчания `/admin` — отсутствовавший `ADMIN_IDS` в
  env текущего Render-сервиса; владелец добавил переменную и подтвердил работу
  после deploy. Значение Telegram ID не раскрывалось и в Git не фиксировалось.
- Live `getWebhookInfo` проверен 24.08.2026: webhook зарегистрирован на
  `https://mentalix-bot.onrender.com/api/telegram/webhook`, очередь пуста,
  последней ошибки нет; разрешены `message` и `callback_query`.
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
- CheckIns: модель, история и сохранение существуют; **подтверждено
  23.08.2026** — `checkins` = 1 строка в live Neon (read-only `count(*)`,
  подробности §2).
- Rituals и ascezas: модели, логи и API существуют; **подтверждено
  23.08.2026** для ritual_logs — `ritual_logs` = 8 строк; `ascezas`/
  `asceza_logs` отдельно не проверялись.
- Пользователи: **подтверждено 23.08.2026** — `users` = 2 строки,
  `mentalix_messages` = 14 строк, `mentalix_user_facts` = 0 строк (shared AI
  memory ещё не накопила ни одного факта на момент проверки).
- Analytics вычисляется из пользовательских данных и событий; корректность на
  live Neon после миграции **НЕ ПОДТВЕРЖДЕНА**.
- Нельзя утверждать, что данные потеряны. Известно только, что исторические
  Railway rows намеренно не импортировались в свежую Neon-схему.

## 10. Что уже сделано

- Production frontend работает на Vercel и направляет API на Render.
- Render Free + fresh Neon migration реализована в backend PR #12; health
  endpoint отвечает.
- Issue #120 остаётся завершённым историческим этапом: storefront `/start`, один
  CTA и короткий Onboarding прошли реальный iPhone/Telegram gate; Today не
  перерабатывался. Позднее решение о коротком frontend-Onboarding было отменено
  владельцем: PR #161 (`ded6f9d2`) восстановил актуальный пятишаговый сценарий
  «приветствие → фокус → возраст → напоминания → план готов». История Issue #120
  сохраняется и не переписывается задним числом.
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
- Не подтверждён live Koyeb service (runtime Render commit, `DATABASE_URL` и
  live Neon schema подтверждены 23.08.2026 — §2, §4).
- Не выполнен свежий end-to-end gate data-dependent экранов после перехода API
  на Render.
- Новый P03-рефакторинг Practices не меняет UI или доступность и проверен
  unit-контрактом плюс UX smoke на двух mobile viewport; отдельный iPhone gate
  для нулевого визуального diff не требуется.
- Не принято подтверждённое решение по Groq и по безопасному включению TLS
  verification для GigaChat.

## 12. Текущая P0-задача

**`MXL-PRACTICES-CATALOG-001` закрыт 23.08.2026** — grid уже был заменён на
спокойный список коммитом `819b200b` (в production через PR #130), новый diff
не потребовался. Подробности — §5 выше, `TASKS.md`/`CHANGES.md` 23.08.2026.

**`MXL-UI-LAB-SHOWCASE-001` закрыт 23.08.2026** — этот раздел не был обновлён
при закрытии задачи, хотя `TASKS.md` и `CHANGES.md` уже фиксируют её как
закрытую, а `git log` подтверждает merge PR #149 (`46e2232d`) в `main`.
Расхождение зафиксировано этой правкой. Живая витрина реальных
прод-компонентов на `?ui_lab=showcase` принята владельцем через Preview/
Telegram gate; 25 экспериментов на `?ui_lab=1` не тронуты; переключатель
между ними — `UiLabSwitch.jsx`. Подробности — `TASKS.md`/`CHANGES.md`
23.08.2026.

**`MXL-UI-CTA-OVERLAP-001` выбрана владельцем как P0 24.08.2026, повторно
закрыта в тот же день без нового кода.** Перед стартом работы —
обязательная сверка по коду (правило CLAUDE.md: «сначала сверь фактическое
состояние»). Проверка показала: баг («CTA чек-ина перекрыт нижней
навигацией на Today, 320×568») не воспроизводится.

- Фикс `Today.css:26` (`@media (max-height: 650px)`, сужение
  `.mx-today-hero-art-glyph` до `70px` внутри `.mx-today-hero-art`)
  — на месте, не изменялся с момента исходного закрытия (PR #138,
  23.08.2026).
- Класс-якорь `mx-card-system-today-art` (`Today.jsx:767`) был сознательно
  сохранён при удалении соседних мёртвых `mx-card-system-*` классов
  (`MXL-CARDSYSTEM-DEADCODE-002`, PR #158, 24.08.2026), а в локальном
  `MXL-XS-MAINTENANCE-001` переименован в `mx-today-hero-art` без изменения
  правила короткого viewport.
- Обёртка глифа рендерится в проде всегда (`motionExperimentEnabled`
  истинно вне `today_compare`-эксперимента), одинаково для всех hero-
  состояний, включая `checkinAsHero` — сценарий из описания бага.
- `git log -- src/screens/Today.jsx src/screens/Today.css` — с момента
  исходного фикса файлы трогал только `MXL-CARDSYSTEM-DEADCODE-002`,
  который не задевал сам фикс.
- `npm run ux:check` прогнан заново 24.08.2026 — **passed** на обоих
  viewport (390×844, 320×568), включая явную проверку
  `overlap(ctaBox, navBox)` для `checkinAsHero`-сценария (пустые
  ritual/asceza, `checkin: null` — тот же кейс, что в исходном баге).

**Вывод: закрытие `MXL-UI-CTA-OVERLAP-001` (23.08.2026) в силе, нового
фикса не потребовалось.** Подробности проверки — `TASKS.md` →
`MXL-UI-CTA-OVERLAP-001`, `CHANGES.md` 24.08.2026.

**`MXL-AUTONOMOUS-SM-001` закрыта 24.08.2026** — PR #164 смёржен в `main`
(`dc5f2e9b`), production обновлён. Подробности — §5 выше.

**`MXL-TODAY-CARD-TOGGLES-001` закрыта 25.08.2026** — PR #167 squash-смёржен
в `main` (`4443b947`), CI и Vercel — `success`, ветка `feat/today-card-toggles`
удалена (remote + local). Подробности — §5 выше.

**`MXL-THEME-ACCENT-001` закрыта 25.08.2026** — PR #172 squash-смёржен в
`main` (`b8549357`), CI — `success`, ветка `feat/theme-accent-001` удалена
(remote + local). Живой gate на iPhone в Telegram подтверждён владельцем.
Подробности — §5 выше.

**`MXL-WRITING-CANVAS-ROLLOUT-001` закрыта 25.08.2026** — squash-смёржена в
`main` тем же PR #180 (`b049e8d7`), что и пилот «Без вины» ниже. Все три
focused rollout-батча реализованы: первый принят владельцем в Telegram
Preview и выпущен через PR #178; второй и третий подготовлены в
`codex/writing-canvas-rollout-remaining`, опубликованы в Telegram Preview и
довложены в draft-PR #180. Десять plain-сцен в `TodayFocusFlow`,
`FirstStepFlow`, `NarrowFocusFlow`, `FinishFlow` и `ProcrastinationFlow`
переиспользуют общий Writing Canvas без изменения данных, state machine и
backend. Для каждого батча unit/lint/build, UX smoke на `390×844`/`320×568` и
diff-check зелёные; живая проверка клавиатуры на реальном iPhone подтверждена
владельцем. Вторичные формы Path и Ascezas остаются за отдельным продуктовым и
визуальным решением.

**`MXL-PRACTICES-EXPERIENCE-PILOT-001` закрыта 25.08.2026** — тем же PR #180
(`b049e8d7`); ветка `codex/writing-canvas-rollout-remaining` удалена
(remote + local). Владелец утвердил визуальную раскадровку, реализацию без
анимаций и подтвердил живой Telegram/iPhone gate — единый якорь заголовка
(`StageHeading`) и keyboard-layout Writing Canvas работают корректно на всех
6 шагах. Подробности — §5 выше, `TASKS.md`. **Новая текущая P0-задача пока не
выбрана владельцем** — до явного решения не подставлять следующую задачу из
очереди самостоятельно (см. п. 12 правила `AGENTS.md` о единственной текущей
P0-задаче).

**`MXL-PREVIEW-STOP-VERIFY-001` закрыта** — PR #179 (`7a64423f`) squash-смёржен
в `main`. `preview-stop.ps1` сохраняет state и не уведомляет Telegram, пока
удаление не подтверждено HTTP 404/410 или отсутствием deployment через
`vercel inspect`. **Наблюдение 25.08.2026:** при живом закрытии Preview для gate
`MXL-PRACTICES-EXPERIENCE-PILOT-001` штатный `npm run preview:stop` дважды не
смог подтвердить удаление за 5 попыток (HTTP всё ещё 200, `vercel inspect`
всё ещё находил deployment), хотя сам `vercel remove` отрабатывал успешно;
ручной прямой `vercel remove` + отдельная HTTP/inspect-проверка сразу
подтвердили удаление. Это race между CLI-выводом об удалении и edge propagation:
защитный механизм сработал верно, но retry-window может потребовать ручного
повторного запуска. Автоматическое увеличение окна retry — отдельное улучшение,
не release blocker.

**`MXL-PREVIEW-STOP-RETRY-WINDOW-001` реализуется в ветке
`improve/preview-stop-retry-window-001`**: retry-window настраивается через
переменные окружения, добавлен `-DryRun` без сетевых и state-операций, а
регрессионный контракт проверяет расположение dry-run guard и retry-цикла.
Production, backend и Telegram-бот не затрагиваются.

**`MXL-PREVIEW-STOP-DRY-RUN-001` реализуется в ветке
`chore/preview-stop-dry-run-001`**: добавлен явный npm-алиас
`npm run preview:stop:dry-run`, связывающий безопасный режим с
`preview-stop.ps1 -DryRun`; maintenance-контракт проверяет, что dry-run не
выполняет сетевые, state, process или Telegram операции.

## 13. Следующие задачи

- ~~**P1:** подтвердить и стабилизировать текущую production-цепочку
  `Vercel → Render → Neon`~~ — **закрыто 23.08.2026**: Render deploy SHA,
  связь с Neon и live-схема подтверждены напрямую (§2, §4). Data-dependent
  gate на реальном iPhone остаётся отдельным следующим шагом (пункт ниже).
- **P1:** пройти data-dependent gate (Today, CheckIn, Library, Trends) на
  реальном iPhone внутри Telegram — не выполнялся после перехода API на
  Render и после Practices/UI-lab изменений.
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
- ~~Текущий Telegram webhook URL~~ — подтверждён 24.08.2026, см. §8.
- Актуальная end-to-end работа Today data, CheckIn, Library и Trends на реальном
  iPhone после смены API на Render.
- Точный список и сценарии регрессий Unified Mobile Layout.
- Номер, scope и приоритет задачи Groq.
- Содержимое legacy Railway PostgreSQL volume; подтверждён только сам volume,
  но не его строки.

## 16. Testing Infrastructure (Post-MVP, Planned)

Текущее состояние (23.08.2026):

- **UX Gate v1:** локальная команда `npm run ux:check` на Playwright — на `main` (изначально реализована в ветке `feat/ux-automated-gate-001`).
  - Два viewport: 390×844, 320×568.
  - Маршрут: Today → Check-in → Practices → Rituals → Ascezas → First Step → Library → Trends.
  - Детерминированные fixtures, 16 проверяемых экранов, базовые layout-проверки.
  - Контрольный прогон 23.08.2026 на текущем `main`: зелёный, ни одного упавшего экрана —
    navbar overlap на Today `320×568` устранён (`MXL-UI-CTA-OVERLAP-001` закрыта PR #138).
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

## 26.08.2026 — Stoic-inspired product baseline

В `PRODUCT.md`, `docs/TASK_INDEX.md` и `TASKS.md` зафиксирован рабочий продуктовый baseline `MXL-PRODUCT-DECISION-STOIC-001`: Mentalix следует собственному циклу **Идея → Действие → Анализ → Новый шаг**, используя Stoic только как концептуальный референс короткого ежедневного ритуала. MXL-001, MXL-009, MXL-014, MXL-015, MXL-016 и MXL-019 получили однозначные рекомендации для планирования; MXL-020 отложена до подтверждения ценности. Возраст, backend/API, юридический режим контента и payment provider остаются отдельными gates.

## 26.08.2026 — MXL-001 verified

`main` синхронизирован с merge commit `3cd9514` после PR #211. MXL-001 закрыта: Stoic-inspired AI-flow indicator опубликован, GitHub CI/Vercel Preview зелёные, 18/18 unit-тестов, lint, build, docs:check и UX smoke прошли, ручной Telegram/iPhone gate подтверждён владельцем. Рабочее дерево перед documentation handoff содержит только ожидающие изменения статуса/истории.

## 26.08.2026 — MXL-015 verified

`main` синхронизирован с merge commit `a1e0974` после PR #213. MXL-015 закрыта: curated weekly theme catalog опубликован в frontend repository, 19/19 unit-тестов, docs:check, lint, build и diff-check прошли; ручной Telegram/телефонный gate подтверждён владельцем. Backend publication остаётся отдельной задачей, зависящей от приватного `/themes` контракта.

## 26.08.2026 — MXL-016 verified

`main` синхронизирован с merge commit `2f63692` после PR #215. MXL-016 закрыта: curated daily-thought fallback и reflective metadata опубликованы, 20/20 unit-тестов, docs:check, lint, build, UX smoke и Vercel Preview прошли; ручной Telegram/iPhone gate подтверждён владельцем. Backend `/quotes` контракт не менялся.

## 26.08.2026 — MXL-014 verified

`main` синхронизирован с merge commit `182a93a` после PR #217. MXL-014 закрыта: MeditationFlow доступен из Practices и работает в четырёх сценах без backend/API изменений. 21/21 unit-тестов, docs:check, lint, build, UX smoke и Vercel Preview прошли; ручной Telegram/iPhone gate подтверждён владельцем.

## 26.08.2026 — MXL-019 verified

`main` синхронизирован с merge commit `c573a41` после PR #219. MXL-019 закрыта: Path использует JourneyLineArt вместо WireframeMountain, goal progress отображается заполненной частью одной линии, backend/API и active-days metric не менялись. 22/22 unit-теста, docs:check, lint, build, UX smoke и Vercel Preview прошли; ручной Telegram/iPhone gate подтверждён владельцем.

## 26.08.2026 — MXL-009 verified

`main` синхронизирован с merge commit `9f9e8fe` после PR #221. MXL-009 frontend safety slice закрыт: descriptive insights boundary применяется в Analytics и через тот же deriveConclusions в insightDigest. 23/23 unit-теста, docs:check, lint, build, UX smoke и Vercel Preview прошли; ручной Telegram/iPhone gate подтверждён владельцем. Backend insight contract и production small-sample validation не заявлены выполненными.

## 14. Русский Stoic-аудит и крупный journal backlog — 27.08.2026

В documentation-ветке добавлены [`docs/product/STOIC_REFERENCE_NOTES.md`](docs/product/STOIC_REFERENCE_NOTES.md) и [`docs/product/STOIC_TO_MENTALIX_AUDIT.md`](docs/product/STOIC_TO_MENTALIX_AUDIT.md). Они содержат русскую карту функций, сценариев, design principles, privacy/storage требований и сравнение с Mentalix по официальным материалам Stoic.

Аудит не создаёт дубликаты уже закрытых `MXL-001`, `MXL-005`, `MXL-009`, `MXL-014`, `MXL-015`, `MXL-016` и `MXL-019`. Эти задачи считаются реализованными зависимостями. Новые крупные journal-эпики выделены отдельно: production persistence, unified history, privacy/AI consent, cadence personalization, guided journals, organization, memories и reminders.

Текущий Journal Home prototype остаётся отдельным PR #224 и не считается production persistence. До backend/storage contract нельзя обещать cloud sync, export/delete, conflict resolution или privacy-модель, которой нет в коде. До ручного gate PR #224 не переводить в verified.

## 6. Автоматический журнал изменений

Workflow `Журнал состояния Mentalix` добавляет запись после каждого push в `main`, кроме собственных изменений `PROJECT_STATE.md`. Это предотвращает цикл повторных запусков. Автоматически фиксируются дата, commit, автор и изменённые файлы; продуктовый статус, Preview и ручной gate остаются предметом ревью в PR.

### Шаблон записи

| Дата | Commit | Автор | Изменённые области                                  | CI / backend                      | Preview / ручной gate     |
| ---- | ------ | ----- | --------------------------------------------------- | --------------------------------- | ------------------------- |
| —    | —      | —     | Заполняется workflow после следующего push в `main` | Ссылки на checks добавляются в PR | Подтверждается владельцем |
