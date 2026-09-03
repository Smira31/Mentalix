# AGENTS.md

Guidance for AI coding agents (Codex, Claude Code, and others) working in this
repository. Claude Code loads this file automatically via the `@AGENTS.md` import in
`CLAUDE.md`; Codex and other AGENTS.md-aware tools read it directly.

## Language

Always respond to the user in Russian. The app's UI, copy, and in-app text are
Russian-only — never introduce English strings into product-facing text.

**Отвечай пользователю только по-русски** — во всех сессиях и во всех ответах,
независимо от языка тикетов/кода/коммитов.

## Project

Mentalix — a Telegram Mini App (rituals, "ascezas"/abstentions, AI personas, analytics).
This repo is the **frontend only**: React 18 + Vite 5 + Tailwind 3, deployed to Vercel
(auto-build on push to `main`, prod at https://mentalix.vercel.app). The backend/bot
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

Tabs/screens don't own vertical padding — `App.jsx` owns top/bottom offsets; screens use
`w-full max-w-md px-5` and nothing else, so all tabs share one visual scale.

### Design tokens

Colors, typography, and text-hierarchy rules live only in `src/index.css` +
`tailwind.config.js` (documented in `DESIGN_SYSTEM.md` — don't duplicate values into other
docs). Gold (`--c-gold` / `#EDBD60`) is the single color accent, used for progress/
completion/significant actions only. Text hierarchy is three explicit classes —
`text-cream` / `text-muted` / `text-faint` — not opacity; opacity on text is only valid as
a transient animation, never a static hierarchy state (`text-cream/35` looks fine in code
but renders at 2.8:1 contrast). Several Tailwind color names in the codebase are legacy
aliases (`emerald-deep` = bg, `cream`/`sage`/`mint` = text, `gold`/`cognac` = the accent)
— don't introduce new legacy-style aliases in new components.

For every new or changed card, practice illustration, semantic SVG, or persona card,
the `Mentalix Card System` section in `DESIGN_SYSTEM.md` is mandatory. Reuse or extend
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

- `src/screens/Today.tsx` and `src/components/MorningPilotCard.tsx` are stale/unused —
  Vite resolves the extensionless imports in `App.jsx` to the `.jsx` siblings
  (`Today.jsx`, `MorningPilotCard.jsx`), which are what's actually shipped. There's no
  TypeScript build configured (no tsconfig); don't assume the `.tsx` files are live or
  extend them expecting them to compile/ship.
- `vercel.json` rewrites `/api/*` to the Render backend; `src/lib/api.js` always calls the relative `/api` prefix — there is no `.env`-based API base URL to configure locally
  beyond running against that same rewrite (or a local backend serving the same paths).

## Context economy

- Читай только файлы из порядка чтения (AGENTS.md → PROJECT_STATE.md → PRODUCT.md →
  DESIGN_SYSTEM.md → ARCHITECTURE.md → TASK_INDEX.md → AI_RULES.md), не сканируй
  весь репозиторий заново без причины.
- Держи PROJECT_STATE.md и docs/working/ui-lab/* актуальными в конце каждой значимой
  сессии — это экономит перечитывание/передоказательство контекста в следующей сессии.
- Sonnet — модель по умолчанию для этого репозитория; эскалация до Opus только
  на явную архитектурную неоднозначность, отмечай это в коммите/PR-описании.
