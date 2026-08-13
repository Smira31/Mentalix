# AGENTS.md

Guidance for AI coding agents (Codex, Claude Code, and others) working in this
repository. Claude Code loads this file automatically via the `@AGENTS.md` import in
`CLAUDE.md`; Codex and other AGENTS.md-aware tools read it directly.

## Language

Always respond to the user in Russian. The app's UI, copy, and in-app text are
Russian-only — never introduce English strings into product-facing text.

## Project

Mentalix — a Telegram Mini App (rituals, "ascezas"/abstentions, AI personas, analytics).
This repo is the **frontend only**, deployed to Vercel (auto-build on push to `main`,
prod at https://mentalix.vercel.app). The backend/bot lives in a separate **private**
repo, `mentalix-bot`, not visible here — do not invent its API shape; if a task needs
backend files, say so instead of guessing. Stack and structure: see `ARCHITECTURE.md`.

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
`ARCHITECTURE.md` (frontend structure and technical boundaries), `ROADMAP.md`
(stabilization plan, plus a prioritized list of competitor-derived feature ideas —
check it before proposing new features), `TASKS.md` (current work), `AI_RULES.md`
(mandatory process for AI agents working in this repo).

Перед началом любой работы прочитай секцию "Передача между агентами" в конце
`TASKS.md` — там рабочая папка, ветка, статус незакоммиченных изменений и что
нельзя менять без согласования.

`docs/archive/CONTEXT.md` and `STOIC_FEATURES.md` are historical/legacy — context only,
never source of truth. On conflict, priority is, in order:

1. explicit user instruction;
2. actual code (for current state);
3. the relevant normative doc (for decisions/rules);
4. historical docs.

`AI_RULES.md` is binding process, not optional reading — scope boundaries, required
verification, and task-closure steps (`CHANGES.md`/`TASKS.md`/`ROADMAP.md`) all live
there; don't rely on a paraphrase.

## Pre-mortem before big changes

Перед стартом крупной задачи (новая фича, продуктовое решение, архитектурное
изменение) — провести pre-mortem: заранее предвидеть возможные ошибки, а не чинить
их постфактум. Не применять к мелким правкам, багфиксам и задачам с уже принятым
решением.

## Gotchas

- There's no TypeScript build configured (no tsconfig), just a couple of legacy `.tsx`
  files historically. Don't introduce a `.tsx`/`.jsx` pair for the same component name —
  Vite's extensionless import resolution silently picks one and ignores the other, so a
  stray duplicate ships as dead code with no error. (History of a past instance of this:
  `CHANGES.md`.)
- `vercel.json` rewrites `/api/*` to the Railway backend; `src/lib/api.js` always calls
  the relative `/api` prefix — there is no `.env`-based API base URL to configure locally
  beyond running against that same rewrite (or a local backend serving the same paths).
