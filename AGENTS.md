# AGENTS.md

Guidance for AI coding agents (Codex, Claude Code, and others) working in this
repository. Claude Code loads this file automatically via the `@AGENTS.md` import in
`CLAUDE.md`; Codex and other AGENTS.md-aware tools read it directly.

## Language

Always respond to the user in Russian. The app's UI, copy, and in-app text are
Russian-only — never introduce English strings into product-facing text.

## Project

Mentalix — a Telegram Mini App (rituals, "ascezas"/abstentions, AI personas, analytics).
This repo is the **frontend only**: React 18 + Vite 5 + Tailwind 3, deployed to Vercel
(auto-build on push to `main`, prod at https://mentalix.vercel.app). The backend/bot
(FastAPI + SQLAlchemy + aiogram + PostgreSQL on Railway) lives in a separate **private**
repo, `mentalix-bot`, and is not visible here — do not invent its API shape; if a task
needs backend files, say so instead of guessing.

App is Russian-language, dark theme only, Telegram-first with a web fallback.

## Commands

```bash
npm install
npm run dev        # vite dev server, http://localhost:5173
npm run build       # vite build — run before every push, catches errors Vercel would hit
npm run preview     # preview a production build
npm run lint         # eslint .
npm run lint:fix
```

There is no test suite, no typecheck script (project is JS despite a couple of stray
`.tsx` files — see Gotchas below), and no CI config in this repo.

## Documentation map

Read before making non-trivial changes, in this order: `PRODUCT.md` (why/for whom),
`DESIGN_SYSTEM.md` (actual tokens/UI rules — code + this doc are the source of truth),
`ARCHITECTURE.md` (frontend structure and technical boundaries), `ROADMAP.md`, `TASKS.md`
(current work), `AI_RULES.md` (mandatory process for AI agents working in this repo).

Перед началом любой работы прочитай секцию "Передача между агентами" в конце
`TASKS.md` — там рабочая папка, ветка, статус незакоммиченных изменений и что
нельзя менять без согласования.

`docs/archive/CONTEXT.md` and `STOIC_FEATURES.md` are historical/legacy — context only,
never source of truth. On conflict, priority is, in order:

1. explicit user instruction;
2. actual code (for current state);
3. the relevant normative doc (for decisions/rules);
4. historical docs.

`AI_RULES.md` is binding process, not optional reading — it defines what an agent may
change without explicit sign-off (no unapproved product logic, visual language/tokens,
brand text, AI persona, API contracts, payments/security/age-gating, or new
dependency/architectural layer), the required verification checklist per change (build +
scenario + loading/error/empty + mobile viewport + Telegram/web if platform layer
touched), and the required after-work updates to `CHANGES.md`/`TASKS.md`/`ROADMAP.md`.

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
math. Reason: `App.jsx`'s content container carries a `fill-mode: both` fade-in animation,
so it ends with a permanent non-zero `transform`, which creates a CSS containing block —
any `position: fixed` descendant anchors to that container instead of the viewport. The
hook renders via `createPortal` into `document.body`, sizes off `visualViewport`, adds the
56px Telegram-controls offset, and locks `body` scroll while open.

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

- There's no TypeScript build configured (no tsconfig) despite a couple of stray
  `.tsx` files having existed here in the past. `src/screens/Today.tsx` and
  `src/components/MorningPilotCard.tsx` were dead duplicates left over from an
  abandoned TypeScript migration attempt — Vite resolved the extensionless imports
  in `App.jsx` to their `.jsx` siblings, so the `.tsx` files were never shipped, only
  silently ignored. They were removed 08.08.2026 (commit `b70c612`). Don't reintroduce
  a `.tsx`/`.jsx` duplicate pair for the same component name — Vite's extensionless
  resolution will silently pick one and ignore the other.
- `vercel.json` rewrites `/api/*` to the Railway backend; `src/lib/api.js` always calls
  the relative `/api` prefix — there is no `.env`-based API base URL to configure locally
  beyond running against that same rewrite (or a local backend serving the same paths).
