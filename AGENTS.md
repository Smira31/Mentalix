---
status: normative
last_verified: 2026-10-05
---

# AGENTS.md

Точка входа по документации: [`docs/INDEX.md`](docs/INDEX.md).

## Стандарт работы агента (выполнять всегда, даже если промпт короткий)

- Перед работой прочитай docs/MENTALIX_CONTEXT.md и docs/STATUS.md.
- Перед изменениями проверь текущую ветку, git status, последние пять коммитов, .gitignore, активные Issue и PR. Не удаляй, не прячь в stash и не включай чужие изменения в свою задачу.
- Одна задача — одна рабочая ветка и один PR. Продолжай уже назначенную ветку; новую создавай только после согласования. Для параллельных исполнителей используй отдельные worktree, а не общую редактируемую папку.
- До реализации согласуй цель, scope, разрешённые файлы, запреты, критерии приёмки и команды проверки. Для нетривиальной задачи сначала создай тест, запусти его и зафиксируй воспроизведение дефекта или отсутствие функциональности; затем реализуй минимальное исправление и повтори проверки.
- До staging и коммита покажи diff, изменённые файлы и результаты проверок и дождись разрешения владельца. Коммит — атомарный результат, а не каждый отдельный файл. Push, PR, merge и deploy требуют явно согласованного действия; разрешение на код не означает разрешения на публикацию.
- Экономия: читай только контекст и файлы текущей задачи. Базовый gate — check:core; UI/platform-sensitive изменения дополнительно требуют ux:check и профильных регрессий. Для mobile-sensitive изменений нужен ручной iPhone/Telegram gate. Исключение для конкретной среды или задачи фиксируется владельцем с перечнем проверок, переданных CI; NOT RUN не является PASS.
- Запреты: src/main.jsx и src/tgShell.js не трогать (падение build в контейнере на top-level await — окружение, арбитр — Checks в PR). В main не коммитить, не мержить. MXL-010 не ослаблять. Изоляцию пользователей (#780) не ломать. Не менять то, о чём не просили (дизайн, картинки, тексты).
- Зафиксируй baseline до реализации. При падении проверки сравни результат на базе и рабочей ветке; не объявляй падение предсуществующим без доказательства и не игнорируй регрессию. Если согласованное требование меняет старое поведение, обнови соответствующий тест, не ослабляя его ради зелёного результата.
- Даты в тестах — только относительно текущего дня.
- В конце: представь diff, команды и фактические результаты, ограничения и следующий gate. После разрешения на публикацию используй один PR в main. Для ручного QA — ссылка на demo сама по себе не доказывает работу production API. Не жди Firebase Preview: этот контур не используется. Evidence и handoff сохраняй в Issue/PR; активную очередь сверяй с docs/TASK_INDEX.md, а docs/STATUS.md не используй как backlog. Merge и production deploy — только после отдельного разрешения владельца. Краткость отчёта не должна скрывать блокеры и NOT RUN.

Guidance for AI coding agents (Codex, Claude Code, and others) working in this
repository. Claude Code loads this file automatically via the `@AGENTS.md` import in
`CLAUDE.md`; Codex and other AGENTS.md-aware tools read it directly.

## Language

Always respond to the user in Russian. The app's UI, copy, and in-app text are
Russian-only — never introduce English strings into product-facing text.

**Отвечай пользователю только по-русски** — во всех сессиях и во всех ответах,
независимо от языка тикетов/кода/коммитов.

**Весь контент в GitHub пишется на русском** — заголовки и описания PR, комментарии
в ревью-тредах, общие комментарии к PR, ответы на ревью, сообщения коммитов. Это
правило обязательно для Base44 и любых других агентов.

## Project

Mentalix — a Telegram Mini App (rituals, "ascezas"/abstentions, AI personas, analytics).
This repo is the **frontend only**: React 18 + Vite 6 + Tailwind 3. Production is
deployed from `main` to Firebase Hosting; Demo Preview uses Cloudflare Pages. The backend/bot
(FastAPI + SQLAlchemy + aiogram + PostgreSQL on Render + Neon) lives in a separate **private**
repo, `mentalix-bot`, and is not visible here — do not invent its API shape; if a task
needs backend files, say so instead of guessing. Use `mentalix-bot/main` and its `RENDER.md`
as the backend/deployment source of truth.

App is Russian-language, dark theme only, Telegram-first with a web fallback.

## Commands

```bash
npm install
npm run dev        # vite dev server, http://localhost:5173
npm run check:core # unit + lint + build + docs:check; required before every PR
npm run ux:check    # Playwright smoke for UI/platform-sensitive changes
npm run build       # vite build — included in check:core
npm run preview     # local Windows/PowerShell Telegram Preview fallback
npm run lint         # eslint .
npm run lint:fix
```

The unit suite is `npm run test:unit`; the aggregate gate is `npm run check:core`.
Playwright smoke is `npm run ux:check`. There is no typecheck script because the project
is JavaScript despite a couple of stale `.tsx` files — see Gotchas below. GitHub CI runs
`check:core`, backend health, dependency audit and Playwright smoke.

## Обязательная локальная проверка перед Ready for review

По умолчанию перед переводом draft PR в **Ready for review** агент выполняет
локально следующие проверки. Исключения ниже для конкретных задач Base44 действуют
только в своём scope и при явном разрешении владельца; пропущенная локальная проверка
указывается как NOT RUN, а её результат в CI сообщается отдельно:

```bash
npm run lint
npm run build
npm run test:unit
npm run ux:check
```

При отсутствии согласованного исключения все четыре команды должны пройти локально.
Кроме них выполняется docs:check (или общий check:core). Прежние skip отмечаются
отдельно; новые skip не добавляются ради прохождения gate. При падении обязательной
проверки агент исправляет проблему либо сообщает о блокере. При согласованном переносе
проверки в CI дождись её PASS на том же candidate SHA. Ручной gate, когда он нужен,
не заменяется CI. До прохождения обязательных проверок и gate не объявляй задачу готовой.

## MXL-010 и Playwright-помощники

Если PR меняет шаги, кнопки или переходы потока чек-ина (CheckIn.jsx, Today.jsx,
WebActionBar.jsx, Conversation.jsx, BackButton.jsx, JournalTextarea.jsx), в том же PR:

1. Обнови помощники в `tests/ux/checkin-helpers.mjs` (data-testid, шаги шкалы, текстовые шаги, эмоции, завершение, возврат).
2. Добавь `data-testid` в новые или изменённые ключевые элементы (кнопки, инпуты, карточки дня, pill эмоций, опции шкалы).
3. Не используй текст или CSS-классы для поиска элементов в тестах — только `data-testid`. Текст допустим только для проверки, что он показан (`expect(page.getByText(...))`).
4. Никаких `waitForTimeout` — только ожидание состояния (`waitFor`, `expect(...).toBeVisible()`).
5. Прогони MXL-010 локально до пуша: `npx playwright test --config=playwright.mxl010.config.mjs`.

## Documentation map

Read before making non-trivial changes, in this order: `docs/AGENT_ONBOARDING.md` (how
agents work together), `PROJECT_STATE.md` (current verified facts), `PRODUCT.md`
(why/for whom), `DESIGN_SYSTEM.md` (actual tokens/UI rules), `ARCHITECTURE.md`
(frontend structure and boundaries), `docs/TASK_INDEX.md` (active work), then
`AI_RULES.md` (mandatory agent process). Read `TASKS.md` and `CHANGES.md` only when
historical context is needed. Do not treat them as the current backlog.

Before asking the owner to repeat prior Mentalix context, inspect
`docs/AGENT_ONBOARDING.md`, `PROJECT_STATE.md`, `docs/TASK_INDEX.md`, the relevant
normative document, and the existing UI Lab/Motion Kit implementation. Use `TASKS.md`
and `CHANGES.md` only for historical context. Chat history is secondary evidence and
never overrides current code or normative docs. Ask only when the choice is genuinely
new or the sources conflict.

`docs/archive/CONTEXT.md` and `STOIC_FEATURES.md` are historical/legacy — context only,
never source of truth. On conflict, priority is, in order:

1. explicit user instruction;
2. actual code (for current state);
3. the relevant normative doc (for decisions/rules);
4. historical docs.

`AI_RULES.md` is binding process, not optional reading — it defines what an agent may
change without explicit sign-off (no unapproved product logic, visual language/tokens,
brand text, AI persona, API contracts, payments/security/age-gating, or new
dependency/architectural layer), the required verification checklist per change (check:core

- scenario + loading/error/empty + mobile viewport + Telegram/web if platform layer
  touched), and how to record active work in `docs/TASK_INDEX.md` and verified release facts
  in `PROJECT_STATE.md`.

## Architecture

```
src/
  main.jsx                 entry point
  App.jsx                  composition root: auth, Telegram chrome, tab/overlay
                            navigation state, top/bottom safe-area padding
  index.css                design tokens, safe areas, motion, Tailwind base
  lib/
    api.js                 single HTTP client — every backend contract lives here
    fullscreenSurface.js   useFullscreenSurface hook — see Fullscreen contract below
    tgFullscreen.js        Telegram fullscreen bootstrap
    store.js                small synced-state helper (useSynced)
  platform/
    index.js               detects Telegram vs web, exports the active adapter
    telegram.adapter.js    Telegram SDK-backed implementation
    web.adapter.js          browser/localStorage-backed implementation
    telegram.hooks.js
  screens/                 one file per product screen; most screens fetch their
                            own data directly via useEffect + api.js
    mentalix/               AI persona picker, conversation, journal-start UI
  components/              shared UI + illustration components
  data/                     local static content (e.g. articles)
```

There is no router package and no global state/query layer. Navigation is local
component state in `App.jsx` (`tab`, `overlay`, `sub`, `persona`); the only URL-reflected
piece is `?tab=`. Server data is fetched ad hoc per screen; there's no shared cache,
loading/error state is handled inconsistently screen-to-screen, and errors mostly go to
`console`. These are known, documented gaps (`ARCHITECTURE.md` §7) — don't "fix" them
incidentally inside an unrelated change.

### Platform layer

`src/platform/` is the **only** allowed entry point for `@twa-dev/sdk`. ESLint
(`no-restricted-imports`) enforces this outside `src/platform/**` — importing the SDK
directly elsewhere breaks the web build (no `WebApp` there) and fails lint. Consume
Telegram behavior via `import { platform } from '../platform'`, never a local wrapper
around `WebApp` (a prior incident produced eight divergent local `haptic` copies).

### Fullscreen surfaces

Any full-screen overlay (`CheckIn`, `ThemeScreen`, `Onboarding` today) must go through
`useFullscreenSurface` (`src/lib/fullscreenSurface.js`) — do not hand-roll height/offset
math. The fullscreen contract is centralized rather than reimplemented per screen. The hook
renders via `createPortal` into `document.body`, sizes off `visualViewport`, adds the 56px
Telegram-controls offset, and locks `body` scroll while open. The old fade-transform bug
was removed; do not reintroduce transform-based containing blocks around fixed surfaces.

Tabs/screens don't own vertical padding — `App.jsx` owns top/bottom offsets; horizontal
screen padding is defined by one token, `--mx-screen-x: 16px`; screen wrappers use it
instead of `px-*` classes, so all tabs share one visual scale.

### Design tokens

Colors, typography, and text-hierarchy rules live only in `src/index.css` +
`tailwind.config.js` (documented in `DESIGN_SYSTEM.md` — don't duplicate values into other
docs). Accent is the dynamic pair Gold (`--c-gold` / `#EDBD60`) ↔ Azure (`--c-azure` /
`#6FB7E0`): progress, completion, significant digits or actions. Neither color is pure
decoration. Text hierarchy is three explicit classes — `text-cream` / `text-muted` /
`text-faint` — not opacity; opacity on text is only valid as a transient animation, never a
static hierarchy state (`text-cream/35` looks fine in code but renders at 2.8:1 contrast).
Several Tailwind color names in the codebase are legacy aliases (`emerald-deep` = bg,
`cream`/`sage`/`mint` = text, `gold`/`cognac` = gold) — don't introduce new legacy-style
aliases in new components.

For every new or changed card, practice illustration, semantic SVG, or persona card,
the Card System v2 section (`DESIGN_SYSTEM.md` §5.1) is mandatory; размеры берутся из таблиц §5.1. Reuse or extend
`CardSystemGlyph`/`SemanticGlyph`; do not create a parallel visual language. Prototype
new visual directions in the existing lab or a separate Preview before changing real
screens, and keep article cards unchanged unless the owner explicitly approves them.

### Other invariants (from `AI_RULES.md` §9)

- Timers count from a `Date.now()` timestamp, not accumulated `setInterval` ticks —
  Telegram's webview throttles timers in the background. User-practice timers (breathing,
  exercises) additionally pause on `visibilitychange` hidden.
- Never call anything besides pure value computation inside a `setState(x => ...)`
  updater (no API calls, no other setters, no `clearInterval`) — StrictMode invokes
  updaters twice, which previously double-recorded focus-session stats. Side effects and
  completion writes belong in a separate effect guarded with `useRef`.
- Don't implement in-app gestures with document-level touch handlers inside the Telegram
  Mini App — they conflict with Telegram's native gesture handling; use CSS instead.

## Gotchas

- The former TypeScript copies `src/screens/Today.tsx` and
  `src/components/MorningPilotCard.tsx` were removed as unused in commit
  [`b70c6126`](https://github.com/Smira31/Mentalix/commit/b70c61264b0fde9e9a7c5c4d6023e1e9ff8ff0ce9).
  Vite resolves the extensionless imports in `App.jsx` to the `.jsx` siblings
  (`Today.jsx`, `MorningPilotCard.jsx`), which are what's actually shipped. There's no
  TypeScript build configured (no tsconfig); do not recreate or extend the removed `.tsx`
  copies expecting them to compile or ship.
- Production workflow Firebase задаёт `VITE_API_BASE_URL=/api`. Firebase Hosting направляет `/api/**` в Cloud Run `mentalix-auth-proxy` (`us-central1`); backend-репозиторий содержит same-site proxy с Render как upstream по умолчанию. Это описание настроек, не доказательство действующего Cloud Run или текущего upstream. Runtime и deployment проверяются отдельно; нельзя удалять proxy или менять auth-маршрут заодно с исправлением документации.

## Запреты

- src/main.jsx и src/tgShell.js нельзя менять без метки allow-entry-change. Ошибка сборки в контейнере агента — не причина.
  Правило принудительно проверяется в CI (job «Frontend quality», входит в «Функциональная проверка проекта»).

## UI-фундамент: <Screen> и токены отступов

- Новые вложенные экраны создаются только через `<Screen>` (`src/components/Screen.jsx`) и детали из `src/components/ui/`. Не использовать ручной `createPortal` + `FULLSCREEN_SHELL_CLASS` в новых экранах.
- Отступы в новых и изменяемых экранах — только токенами (`--mx-space-*`, `--mx-radius-*`, `--mx-btn-*-h`, `--mx-screen-top`). Локальные пиксельные значения запрещены. Токены описаны в `docs/DESIGN_TOKENS.md`.
- Пилотные экраны (MyThoughtsScreen, DailyThoughtInput, PracticeFieldFlow) уже переведены на `<Screen>` — использовать их как референс.

## Base44: локальный dev и тема недели

- `docker-compose.base44.yml` запускает исходники на 3000; polling нужен для bind mount. Проверка живого исходника: `/src/components/ThemeQuestionCarousel.jsx` содержит `data-day` и `theme-opening-label`.
- Для задачи календарной темы достаточно `check:core` и `npx playwright test --config=playwright.ux.config.mjs steps-reliability.spec.mjs theme-daily-questions.spec.mjs`; ставить только Chromium, не WebKit. iPhone/Telegram остаётся ручным gate.
- Демо `/themes/{id}/reflect` сохраняет ответ, не двигая `current_day`; календарь темы — `started_on`/`server_date`. Арифметика дат централизована в `src/lib/mskDate.js`.

### Проверка «Пути героя» в Base44

- Локальные ключи курса используют `:<userId>`, но CloudStorage Telegram не допускает двоеточия: облачный scoped-ключ заменяет их на `_`. Legacy-миграция выполняется до очистки пользовательского scope.
- Перекрытие текста на иллюстрацию задаётся шагом через `image.overlap` (доля высоты героя; глава I — 0.08, глава III — 0.22, по умолчанию 0.12) → CSS-переменная `--mx-hj-hero-overlap`; читаемость подписи и заголовка на экранах входа/завершения держат `::before`-скрим (56 px над первой строкой) и текстовые тени. Контраст подписи к фону ≥ 7:1; измерить и снять экраны можно gitignored-скриптом `artifacts/hero-layout/capture-contrast.mjs`.
- Экран завершения центрируется по свободной высоте: блок `.mx-hj-complete` получает `flex: 1`, а скролл-контейнер и обёртку растягивает класс `mx-hj-stretch` (проп `screenBodyClassName` у `Shell` → `bodyClassName` у `<Screen>`). Чтобы центрирование считалось между видимым низом героя и кнопкой, блок сам компенсирует перекрытие текста картинкой (`padding-top` = `--mx-hj-hero-overlap` × `--mx-hj-hero-h`) и нижние отступы контента/safe-area; при `max-height: 700px` обе компенсации снимаются, и блок снова прижат к картинке.
- Вступление шага — flex-колонка без скролла (`.mx-hj-step-intro`): герой `flex: 1 1 auto`, 110–260 px (`image.compact` — до 210), текст `flex: none`, нижняя группа («≈ 6 минут» и кнопка) `margin-top: auto`; шрифт абзаца строго ≥ 15 px, межстрочный 1.4. Media-запросы по высоте окна не использовать: в демо-рамке поверхность равна видимой части рамки 393×852 (`readDemoFrameBox`), на реальном телефоне — высоте экрана. У шагов без иллюстрации (сейчас 5–8) вместо героя стоит заглушка без минимальной высоты, максимум 276 px: контейнерный запрос по её собственной высоте прячет карточку, значок и подпись при высоте ≤ 111 px (на 360×640 у длинного вступления места под картинку нет). Проверенные размеры: 393×852, 375×667, 360×640 (`?frame=0`) по всем 17 вступлениям (16 шагов и финал).
- Как открыть экраны в демо: `/?demo=1&tab=library&action=hero_journey`. Пролог — пункт «О курсе» (`hero-about-open`) над прогрессом. Шаг N открывается только после прохождения N−1 (в демо без ожидания следующего дня), поэтому для шага 5 и финала проще записать прогресс в `localStorage['mx-hero-journey-progress:900001']` как `{"completed":{"uncertainty":"2026-10-01",…},"signs":{},"reflections":{},"actions":{}}` (4 или все 16 шагов) и заново открыть курс; финал — карточка `hero-step-return` под главами.
- Для этой задачи владелец разрешил только `check:core` и целевой Playwright-файл `hero-journey-reliability.spec.mjs` (Chromium); полный `ux:check` и WebKit оставлены CI. Команды выполняются в `docker compose -f docker-compose.base44.yml exec -T web`.
- В свежем web-контейнере браузера Playwright нет: перед прогоном нужен `npx playwright install --with-deps chromium` (в `node:22-slim` нет системных библиотек, иначе launch падает на `libglib-2.0.so.0`). Ставить только Chromium.

### Библиотека Stoic в Base44

- Публикуемые статьи: только `src/data/articles.js`; `libraryDataCache.js` — совместимый адаптер того же массива, не API-кеш. Старые API-снимки намеренно не читаются.
- Курс и журнал «Шагов» используют `StepsJournalBanner`. Программы остаются в `LibraryPrograms.jsx` за выключенным флагом; `GuidedJournals.jsx`, серверные методы и черновики не удалены.
- При открытии шторки/читалки каталог остаётся смонтированным и сохраняет нижний отступ App: иначе в конце списка scrollTop ограничивается меньшей scrollHeight и возврат теряет позицию.
- Локальный gate этой задачи: `check:core` и один `npx playwright test --config=pw-library-stoic.config.mjs` в web-контейнере. Только Chromium; полный UX/WebKit — CI. Скриншоты целевого теста находятся в `/tmp/mentalix-library-screens` контейнера, постоянный evidence — `qa-evidence/stoic-library/report.md`.
- Реестр `src/data/courses/*.js` подхватывает default-объекты автоматически; опубликованные курсы идут перед demoOnly. У «Пути героя» сохранены прежние scoped-ключи прогресса/черновиков, у остальных ключ включает courseId. `demo_courses=0` скрывает курс-пустышку.
- Для снимков production-like демо: `VITE_LOCAL_PREVIEW=true npm run build`, затем `npm run preview:web -- --port 4175`; целевой тест запускается с `LIBRARY_BASE_URL=http://127.0.0.1:4175`. Не передавать параметры Vite через вложенный `npm run preview`: npm поглощает `--host`, и аргумент становится неверным корнем сервера.

### Шапка Telegram в демо Base44

- `VITE_TG_SHELL=1` включает существующие демо-данные и рамку; внешних секретов для неё нет.
- Сегменты аналитики и значков в рамке выводятся `DemoTelegramHeader` порталом непосредственно в shell. Отрицательный отступ внутри `mx-app-scroll-root` обрезает сегмент и делает его невидимым; не возвращать этот приём для демо.
- `Analytics.active` скрывает вынесенную шапку при уходе с вкладки: открытые вкладки остаются смонтированными. На настоящем телефоне и в Telegram компонент возвращает исходную шапку без портала.
- Целевая проверка: `npx playwright test --config=playwright.ux.config.mjs demo-telegram-header.spec.mjs` внутри web-контейнера; размеры рамок 393/440 на viewport 793. Аппаратные Island/Home Indicator не имитируются.

### Публичная страница политики конфиденциальности (/privacy)

- `dist/privacy.html` — статичная страница для BotFather: её генерирует плагин `privacyPagePlugin` в `vite.config.js` из `src/content/privacyPolicy.js` (текст политики не дублируется). Шрифт Onest встроен в HTML, внешних запросов и скриптов нет.
- В dev-сервере те же адреса отдаёт middleware плагина (`/privacy`, `/privacy/`, `/privacy.html`), в проде — rewrites в `firebase.json` выше общего `**`. Проверка: `/privacy` возвращает `<h1>Политика конфиденциальности Mentalix</h1>` и 12 секций, `/` по-прежнему отдаёт SPA.

## Context economy

- Читай только файлы из порядка чтения (AGENTS.md → PROJECT_STATE.md → PRODUCT.md →
  DESIGN_SYSTEM.md → ARCHITECTURE.md → TASK_INDEX.md → AI_RULES.md), не сканируй
  весь репозиторий заново без причины.
- Держи PROJECT_STATE.md и docs/working/ui-lab/* актуальными в конце каждой значимой
  сессии — это экономит перечитывание/передоказательство контекста в следующей сессии.
- Не переключай модель или провайдера без запроса владельца. Режим по умолчанию — Solo. Для сложных развилок можно предложить Fusion; для независимых подзадач — оркестрацию; Swarm требует согласованной инфраструктуры связи, владельцев файлов и изолированных рабочих областей. Не выдавай одну модель за независимую панель.

## Служебные и операционные Markdown-файлы

Эти файлы относятся к настройкам репозитория, шаблонам, handoff/evidence и историческим журналам. Ссылки ниже дают им входящие текстовые ссылки; содержание каждого файла остаётся самостоятельным.

- [`.claude/agents/reviewer.md`](.claude/agents/reviewer.md)
- [`.claude/daily-canonical-brief.md`](.claude/daily-canonical-brief.md)
- [`.github/ISSUE_TEMPLATE/bug.md`](.github/ISSUE_TEMPLATE/bug.md)
- [`.github/ISSUE_TEMPLATE/documentation.md`](.github/ISSUE_TEMPLATE/documentation.md)
- [`.github/ISSUE_TEMPLATE/feature.md`](.github/ISSUE_TEMPLATE/feature.md)
- [`.github/ISSUE_TEMPLATE/idea.md`](.github/ISSUE_TEMPLATE/idea.md)
- [`.github/ISSUE_TEMPLATE/research.md`](.github/ISSUE_TEMPLATE/research.md)
- [`.github/ISSUE_TEMPLATE/ux.md`](.github/ISSUE_TEMPLATE/ux.md)
- [`.github/RELEASE_TEMPLATE.md`](.github/RELEASE_TEMPLATE.md)
- [`.github/copilot-instructions.md`](.github/copilot-instructions.md)
- [`.github/pull_request_template.md`](.github/pull_request_template.md)
- [`AI_RULES.md`](AI_RULES.md)
- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md)
- [`CHANGES.md`](CHANGES.md)
- [`CLAUDE.md`](CLAUDE.md)
- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
- [`MENTALIX_SEMANTIC_MOTION.md`](MENTALIX_SEMANTIC_MOTION.md)
- [`PRODUCT.md`](PRODUCT.md)
- [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md)
- [`PROJECT_STATE.md`](PROJECT_STATE.md)
- [`README.md`](README.md)
- [`REFERENCE_WORKFLOW.md`](REFERENCE_WORKFLOW.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`TASKS.md`](TASKS.md)
- [`progress-fix-report.md`](progress-fix-report.md)
- [`qa-evidence/mxl-010/automated-gate.md`](qa-evidence/mxl-010/automated-gate.md)
- [`qa-evidence/mxl-010/preview-access.md`](qa-evidence/mxl-010/preview-access.md)
- [`qa-evidence/mxl-010/release-gate-report.md`](qa-evidence/mxl-010/release-gate-report.md)
- [`qa-evidence/mxl-010/report.md`](qa-evidence/mxl-010/report.md)
- [`qa-evidence/mxl-010/ux-smoke-report.md`](qa-evidence/mxl-010/ux-smoke-report.md)
- [`qa-evidence/mxl-010/web-fallback.md`](qa-evidence/mxl-010/web-fallback.md)
