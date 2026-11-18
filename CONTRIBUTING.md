---
status: current
last_verified: 2026-11-18
---

# Contributing to Mentalix

Start with [`AGENTS.md`](AGENTS.md), then follow the canonical reading order in [`docs/AGENT_ONBOARDING.md`](docs/AGENT_ONBOARDING.md). The owner keeps the active queue on the Mentalix OS board, outside GitHub: a card ID from the owner's prompt (for example `SRC-01`) is a valid task reference and a GitHub Issue is not required. The open Issues in [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md) are historical; `TASKS.md`, `CHANGES.md`, `docs/handoffs/` and `docs/archive/` are historical context.

## Branches

Create a focused branch from current `origin/main`:

- `feat/<short-scope>` — product functionality;
- `fix/<short-scope>` — defect correction;
- `docs/<short-scope>` — documentation only;
- `chore/<short-scope>` — repository/process maintenance;
- `test/<short-scope>` — tests only;
- `refactor/<short-scope>` — behavior-preserving code change;
- `codex/<short-scope>` — agent-owned preparation or reference work.

When the task comes from a Mentalix OS board card, include its ID in the branch name: `<type>/<id>-<short-scope>` (for example `docs/src-01-task-index`).

Do not reuse a branch that contains unrelated work. Do not delete a remote branch until it has no open PR, its unique commits are merged or explicitly obsolete, and no active Issue or Mentalix OS board card depends on it.

## Before opening a pull request

Keep the diff inside one Issue, one Mentalix OS board card or one decision gate. Record what is intentionally unchanged and run:

```bash
npm ci
npm run doctor
npm run check:core
npm run docs:drift
```

For UI changes also run the relevant deterministic UX check and capture the required viewports. CI, screenshots and browser Preview do not replace the owner Telegram/iPhone gate when that gate applies.

## Pull requests and release

Use the repository PR template. Put the Mentalix OS card ID at the start of the PR title (`[ID] …`) and in the branch name, or link the Issue; describe acceptance criteria, scope/non-scope, verification (`PASS` / `FAIL` / `NOT RUN`), residual risk and rollback. Merge by squash only after the required check passes and any manual owner gate is recorded.

The release path is:

```text
focused branch → pull request → required CI → owner gate when applicable → main
→ Firebase Hosting Production
```

Cloudflare Owner QA is the manual exact-SHA Demo Preview. Vercel and Firebase Preview Channels are not active deployment paths. Never merge, deploy, change endpoints or modify secrets without the authorization required by `AGENTS.md`.
