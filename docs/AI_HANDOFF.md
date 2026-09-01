# Mentalix — AI handoff

This file is the canonical handoff for Claude Code and other AI agents working in this repository. Read it before changing code, documentation, GitHub Issues or pull requests. The file describes project decisions and operational boundaries; the repository and GitHub remain the source of truth for actual code and current PR status. For product decisions specifically, `docs/core/PRODUCT_DECISIONS.md` is the source of truth — this file summarizes and links to it, and never states a decision on its own authority.

## Product direction

Mentalix serves the working audience defined in `docs/core/PRODUCT_DECISIONS.md` → **MXL-DEC-021** (Обновление 31.08.2026): **16–35 years old**, analysed as 16–17, 18–24 and 25–35 separate cohorts. Treat that entry, not this paragraph, as authoritative if the two ever diverge. The first problem statement is narrow: a person cannot start an important task. Mentalix is a reflection-and-action product, not therapy, diagnosis, emergency response or a substitute for a qualified professional.

The primary loop is:

> `Today → one next action → completion → evening review → return tomorrow`

Today is the primary entry point. Journal, Practices and AI support this loop; do not add a sixth tab or turn the product into a catalogue of features or an endless chat. Preserve one clear primary action and keep exploration secondary.

## Product decisions this file relies on

Each item below restates a decision already recorded in `docs/core/PRODUCT_DECISIONS.md`. This list exists so an agent does not have to open that file for routine scoping; it is not an independent confirmation, and a mismatch means this file is stale, not that this file wins.

- The first core experiment is the daily loop, not payment, AI depth or visual expansion.
- Guided self-discovery first uses a prompt-only flow; no AI deepening, cloud memory or new backend contract is implied.
- WTP research compares problem-led track, descriptive pattern summary and AI deepen without checkout; responses in the current prototype are local-only.
- The light theme remains preview-only until the owner separately reviews and approves it.
- Descriptive insights must show provenance, uncertainty and user correction; they must not diagnose or claim causality.
- The 16–17 cohort requires a safety/privacy gate before testing (age-appropriate language, minimal data, Journal privacy, AI boundaries, sensitive-message handling) — see `docs/core/PRODUCT_DECISIONS.md` → MXL-DEC-021, Обновление 31.08.2026, for the current wording; that entry is where this requirement became a decision, not this file.

## Rules for parallel agents

Before starting work, run `git fetch origin --prune`, inspect open PRs and compare the files touched by active branches. Create a unique feature branch from the current `origin/main`. Never switch to, force-push, rebase or delete another agent's branch. Never mix unrelated changes from `docs/working/` or another local worktree into a PR.

Prefer one issue, one purpose and one PR. If a task touches files already changed by another open PR, either work from an explicitly updated base after checking the diff or choose a different task. Do not duplicate an active PR. A PR is a handoff artifact, not permission to merge.

## Safe execution contract

It is acceptable to inspect files, run tests, add narrowly scoped code or docs, create a branch, push it and open a PR without waiting for another product confirmation when the scope is already confirmed here. Do not merge, deploy, bypass branch protection, change secrets, payment flows, privacy/retention contracts, database schemas or production flags without an explicit owner instruction for that exact operation.

Green automation does not replace Telegram/iPhone/Android device gates. If a manual gate is not available, leave the PR open and write `manual gate pending`; do not claim the feature is fully verified. Vercel deployment rate-limit failures should be reported separately from code checks and must not be silently treated as a product failure.

## Validation commands

Use the smallest relevant checks first, then the project gate when the change affects runtime code:

```bash
npm run test:design-guard
npm run test:unit
npm run lint
npm run build
npm run docs:check
npm run docs:drift
npm run ux:check
npm run check:core
```

Docs-only changes normally require `npm run docs:check`, `npm run docs:drift` and `git diff --check`. Runtime changes require targeted tests plus `npm run check:core`; UI changes should also run `npm run ux:check` when feasible.

## Current PR map

Check live GitHub status before acting; the list below records the workstream and intended scope, not a guarantee that a PR is still open.

| PR                                                   | Workstream            | Scope                                              | Merge/deploy note                              |
| ---------------------------------------------------- | --------------------- | -------------------------------------------------- | ---------------------------------------------- |
| [#439](https://github.com/Smira31/Mentalix/pull/439) | Guided self-discovery | Prompt-only flow, local draft                      | Manual review still matters                    |
| [#441](https://github.com/Smira31/Mentalix/pull/441) | Light theme           | Preview-only warm parchment theme                  | Vercel rate-limit checks may block merge       |
| [#442](https://github.com/Smira31/Mentalix/pull/442) | Design guard          | Deterministic static design checks                 | No runtime UX change                           |
| [#444](https://github.com/Smira31/Mentalix/pull/444) | WTP concept test      | Local-only three-concept research flow             | No checkout or backend                         |
| [#445](https://github.com/Smira31/Mentalix/pull/445) | Reference library     | Source-of-truth visual references                  | Docs-only                                      |
| [#446](https://github.com/Smira31/Mentalix/pull/446) | Prompt library        | Canonical Clarify/Compass/Step/Review records      | Docs-only                                      |
| [#447](https://github.com/Smira31/Mentalix/pull/447) | Animation library     | Motion records and reduced-motion rules            | Docs-only                                      |
| [#448](https://github.com/Smira31/Mentalix/pull/448) | Character canon       | Voice, visual invariants and banned patterns       | Docs-only                                      |
| [#449](https://github.com/Smira31/Mentalix/pull/449) | Visual-card library   | Asset metadata and approval workflow               | Docs-only                                      |
| [#450](https://github.com/Smira31/Mentalix/pull/450) | Product strategy      | Audience, core loop and experiment order; wording matches `docs/core/PRODUCT_DECISIONS.md` → MXL-DEC-021 as of 31.08.2026 | Docs-only |
| [#451](https://github.com/Smira31/Mentalix/pull/451) | Insights protocol     | Provenance, sample guards and safe observations    | Docs-only; backend remains a dependency        |
| [#453](https://github.com/Smira31/Mentalix/pull/453) | Lila discover ADR     | Pre-mortem/ADR gate; no runtime, AI, persistence or navigation authorized | Docs-only                |
| [#454](https://github.com/Smira31/Mentalix/pull/454) | API request cancellation | Caller-driven `AbortSignal` support in `src/lib/api.js`; distinguishes cancel from timeout | API client only, isolated |
| [#455](https://github.com/Smira31/Mentalix/pull/455) | Font self-hosting perf | Replaces render-blocking Google Fonts `@import` with `@fontsource/onest` + `@fontsource/jetbrains-mono` | Touches `src/index.css`, `package.json` — coordinate merge order with #441 and #442 |

PR #443 belongs to another agent and must not be modified without checking its live owner and files first. The PR list is intentionally not a merge queue; review each diff independently.

## What to do next

When the owner asks for the next task, first select an unclaimed backlog item whose files do not overlap active agent work. Good candidates are docs/protocol foundations or isolated frontend improvements. Avoid backend-blocked Issues #351, #352 and #353 unless the required backend scope is explicitly approved. Avoid claiming manual device gates #358 and #359 as passed when no device test was performed.

For each task, report: selected Issue, files changed, why it is isolated, checks run, PR link, manual gates still pending and anything intentionally not done. Stop at PR handoff rather than merge/deploy unless the owner explicitly requests that exact action.

## Handoff command

A new agent can begin with:

> Read `docs/AI_HANDOFF.md`, inspect the live open PRs and `origin/main`, choose one unclaimed task, and prepare one isolated PR. Do not merge, deploy, bypass branch protection or modify another agent's branch.
