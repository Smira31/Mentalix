---
status: current
last_verified: 2026-09-16
---

# Contributing to Mentalix

Start with [`AGENTS.md`](AGENTS.md), then follow the canonical reading order in [`docs/AGENT_ONBOARDING.md`](docs/AGENT_ONBOARDING.md). GitHub Issues plus [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md) are the active backlog; `TASKS.md`, `CHANGES.md`, `docs/handoffs/` and `docs/archive/` are historical context.

## Branches

Create a focused branch from current `origin/main`:

- `feat/<short-scope>` — product functionality;
- `fix/<short-scope>` — defect correction;
- `docs/<short-scope>` — documentation only;
- `chore/<short-scope>` — repository/process maintenance;
- `test/<short-scope>` — tests only;
- `refactor/<short-scope>` — behavior-preserving code change;
- `codex/<short-scope>` — agent-owned preparation or reference work.

Do not reuse a branch that contains unrelated work. Do not delete a remote branch until it has no open PR, its unique commits are merged or explicitly obsolete, and no active Issue depends on it.

## Before opening a pull request

Keep the diff inside one Issue or decision gate. Record what is intentionally unchanged and run:

```bash
npm ci
npm run doctor
npm run check:core
npm run docs:drift
```

For UI changes also run the relevant deterministic UX check and capture the required viewports. CI, screenshots and browser Preview do not replace the owner Telegram/iPhone gate when that gate applies.

## Pull requests and release

Use the repository PR template. Link the Issue, describe scope/non-scope, verification, residual risk and rollback. Merge by squash only after the required check passes and any manual owner gate is recorded.

The release path is:

```text
focused branch → pull request → required CI → owner gate when applicable → main
→ Firebase Hosting Production
```

Cloudflare Owner QA is the manual exact-SHA Demo Preview. Vercel and Firebase Preview Channels are not active deployment paths. Never merge, deploy, change endpoints or modify secrets without the authorization required by `AGENTS.md`.
