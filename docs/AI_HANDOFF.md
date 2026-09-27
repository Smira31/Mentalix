---
status: current
last_verified: 2026-09-27
---

# Mentalix — AI handoff

This file is the canonical handoff for Claude Code and other AI agents working in this repository. Read it before changing code, documentation, GitHub Issues or pull requests. The file describes project decisions and operational boundaries; the repository and GitHub remain the source of truth for actual code and current PR status. For product decisions specifically, `docs/core/PRODUCT_DECISIONS.md` is the source of truth — this file summarizes and links to it, and never states a decision on its own authority.

## Product direction

Mentalix public MVP is **18+** (owner decision dated 27.09.2026 in `docs/core/PRODUCT_DECISIONS.md`, superseding MXL-DEC-021 for this release; see also `PRODUCT.md` §2 and PR #904). The 16–17 cohort is deferred to v1.1; the historical 16–35 segmentation remains in MXL-DEC-021, not the current release eligibility. Treat the newer owner decision as authoritative. The first problem statement is narrow: a person cannot start an important task. Mentalix is a reflection-and-action product, not therapy, diagnosis, emergency response or a substitute for a qualified professional.

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
- The historical MXL-DEC-021 youth safety/privacy gate remains relevant to deferred v1.1 planning for 16–17; it does not permit 16–17 into the current 18+ public MVP.

## Rules for parallel agents

Before starting work, run `git fetch origin --prune`, inspect open PRs and compare the files touched by active branches. Create a unique feature branch from the current `origin/main`. Never switch to, force-push, rebase or delete another agent's branch. Never mix unrelated changes from `docs/working/` or another local worktree into a PR.

Prefer one issue, one purpose and one PR. If a task touches files already changed by another open PR, either work from an explicitly updated base after checking the diff or choose a different task. Do not duplicate an active PR. A PR is a handoff artifact, not permission to merge.

## Safe execution contract

It is acceptable to inspect files, run tests, add narrowly scoped code or docs, create a branch, push it and open a PR without waiting for another product confirmation when the scope is already documented here. Do not merge, deploy, bypass branch protection, change secrets, payment flows, privacy/retention contracts, database schemas or production flags without an explicit owner instruction for that exact operation.

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

## Historical PR map (September 2026 archive)

The table below is historical, **not** the current PR list or merge queue. On 27.09.2026 GitHub reported no open PRs before this documentation reconciliation; check [live PRs](https://github.com/Smira31/Mentalix/pulls) and [`docs/TASK_INDEX.md`](TASK_INDEX.md) before selecting work.

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
| [#450](https://github.com/Smira31/Mentalix/pull/450) | Product strategy      | Historical product-strategy artifact; age segmentation now follows MXL-DEC-021, Обновление 31.08.2026 | Merged; this file is not the source of truth |
| [#451](https://github.com/Smira31/Mentalix/pull/451) | Insights protocol     | Provenance, sample guards and safe observations    | Docs-only; backend remains a dependency        |
| [#452](https://github.com/Smira31/Mentalix/pull/452) | AI handoff            | Agent handoff, current PR map and links to owner decisions | Merged; references MXL-DEC-021 rather than deciding age segmentation |
| [#453](https://github.com/Smira31/Mentalix/pull/453) | Lila discover ADR     | Pre-mortem/ADR gate; no runtime, AI, persistence or navigation authorized | Merged; docs-only                |
| [#454](https://github.com/Smira31/Mentalix/pull/454) | API request cancellation | Caller-driven `AbortSignal` support in `src/lib/api.js`; distinguishes cancel from timeout | Merged; API client only, isolated |
| [#455](https://github.com/Smira31/Mentalix/pull/455) | Font self-hosting perf | Replaces render-blocking Google Fonts `@import` with `@fontsource/onest` + `@fontsource/jetbrains-mono` | Merged; touches `src/index.css`, `package.json` |

Historical ownership notes (including PR #443) do not describe current open work. This PR list is not a merge queue; use live GitHub status instead.

## What to do next

For current tasks and gates, read [`TASK_INDEX.md`](TASK_INDEX.md) and the live GitHub Issues/PRs; the older Issue numbers in the historical table above are not a current queue. Select only a scoped, unclaimed item; do not infer backend readiness or claim a manual device gate without evidence.

For each task, report: selected Issue, files changed, why it is isolated, checks run, PR link, manual gates still pending and anything intentionally not done. Stop at PR handoff rather than merge/deploy unless the owner explicitly requests that exact action.

## Handoff command

A new agent can begin with:

> Read `docs/AI_HANDOFF.md`, inspect the live open PRs and `origin/main`, choose one unclaimed task, and prepare one isolated PR. Do not merge, deploy, bypass branch protection or modify another agent's branch.
