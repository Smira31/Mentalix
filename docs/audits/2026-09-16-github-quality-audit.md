---
status: current
last_verified: 2026-09-16
scope: github-quality
---

# GitHub quality audit — 2026-09-16

## Scope and evidence

This audit is a read-only snapshot taken after cleanup PR [#628](https://github.com/Smira31/Mentalix/pull/628). It covers GitHub Issues, pull requests, remote branches, Actions, repository settings, active documentation and the local development gates. Historical files under `docs/archive/` were intentionally excluded from drift findings and were not changed.

Verified baseline:

- repository: `Smira31/Mentalix`;
- default branch: `main`;
- current `main`: `048d4736ad49c9ca40b46b866a7f903eec411c04`;
- open pull requests: **0**;
- open Issues: **9**;
- remote branches: **6** including `main`;
- latest Firebase Production run for current `main`: [35119350799](https://github.com/Smira31/Mentalix/actions/runs/35119350799), `success`;
- latest required CI run for current `main`: [35119350894](https://github.com/Smira31/Mentalix/actions/runs/35119350894), `success`.

GitHub API calls were retried when GitHub returned transient `EOF`; no state was inferred from a failed request.

## What is already in good shape

- `main` is protected by an active ruleset: deletion and force-push are blocked, linear history and pull requests are required, and the required check is strict.
- Squash merge is the only enabled merge method. `delete_branch_on_merge` is enabled. Auto-merge is disabled.
- The required aggregate check `Базовая проверка проекта` covers quality, UX and backend-health jobs.
- CI and deploy workflows use read-only repository permissions, Node.js `22.22.1`, `npm ci` and the npm cache.
- CI and Firebase workflows cancel superseded runs through concurrency groups. Cloudflare Owner QA deliberately does not cancel an exact-SHA deployment already in progress.
- Cloudflare Owner QA accepts a full 40-character commit SHA, checks out that SHA, writes immutable provenance and verifies both stable and immutable URLs.
- Firebase Production is triggered by `main` or an explicit manual dispatch. No active workflow deploys to Vercel.
- The PR template already records scope, non-scope, automated checks, manual owner gate, risk and rollback.
- `docs/TASK_INDEX.md` contains exactly the nine open Issues and does not list merged PRs as active work.
- Active canonical docs describe Cloudflare Demo → owner gate → Firebase Production, with Render as backend. Vercel is described as disabled legacy infrastructure.
- Secret scanning and push protection are enabled. Secret values were not requested or exposed.

## Findings by priority

There are **no P0 findings**. Current production and Demo workflows completed successfully at the audited SHA, and no secret exposure, force-push path or active Vercel deployment path was found.

| Priority | Exact target                                                       | Problem and impact                                                                                                                                                                                                                                                                          | Proposed resolution                                                                                                                                                                                           | Change risk                                                                                                                   | Automatic?               |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| P1       | `.github/workflows/firebase-hosting.yml`                           | Production currently runs only `npm run build`. It relies on the separate required CI having passed and has no job timeout or post-deploy HTTP smoke check. A manual dispatch therefore has less self-contained evidence than the production workflow should provide.                       | Run `npm run check:core` in the deploy job, add a bounded timeout, and verify the canonical Firebase URL after deploy.                                                                                        | Low: can stop a release when tests, lint, docs or the public endpoint fail; does not change hosting configuration or secrets. | Yes                      |
| P1       | Repository Actions policy                                          | `allowed_actions=all` and SHA pinning is not required. Third-party actions are tag-pinned rather than commit-pinned.                                                                                                                                                                        | Decide whether to restrict allowed actions and pin third-party actions to reviewed SHAs. Roll out separately because Dependabot and maintenance burden change.                                                | Medium                                                                                                                        | Owner decision           |
| P1       | `main` ruleset / branch protection                                 | Reviews are required structurally, but minimum approvals is `0`; conversation resolution and CODEOWNER review are not required. This is permissive for a production repository, although appropriate for a solo owner.                                                                      | Add a non-blocking CODEOWNERS file now. Decide separately whether one approval and conversation resolution should become required.                                                                            | Medium if enforcement is enabled; low for the file alone.                                                                     | File yes; enforcement no |
| P1       | CI job `backend-health` in `.github/workflows/ci.yml`              | An external Render availability check is part of the required aggregate status. A Render outage can block an unrelated frontend or docs PR.                                                                                                                                                 | Decide whether backend health remains required or becomes advisory/path-aware while keeping release health evidence elsewhere.                                                                                | Medium: weakening the gate may hide a real outage.                                                                            | Owner decision           |
| P1       | GitHub environments                                                | Environments named `Preview`, `Preview – mentalix`, `Preview – mentalix-preview`, `Production – mentalix` and `Production – mentalix-preview` remain from the Vercel era; none has protection rules.                                                                                        | Confirm dependencies, then remove or rename stale environments in a dedicated settings change. Do not touch `cloudflare-owner-qa` or the current Firebase production path without an explicit migration plan. | Medium                                                                                                                        | Owner decision           |
| P2       | Repository homepage                                                | The repository homepage is still `https://mentalix.vercel.app`, although Vercel is disabled.                                                                                                                                                                                                | Change repository metadata to the canonical Firebase Production URL.                                                                                                                                          | Low, but it is an external repository-setting mutation.                                                                       | Owner decision           |
| P2       | `PROJECT_STATE.md`                                                 | The production table still cites pre-cleanup SHA `eafe1342…` and Firebase run `35114685506`.                                                                                                                                                                                                | Update it to current `main` and successful run `35119350799`.                                                                                                                                                 | Low                                                                                                                           | Yes                      |
| P2       | `.github/ISSUE_TEMPLATE/bug.md` and `.github/ISSUE_TEMPLATE/ux.md` | These templates lack explicit scope/non-scope, Definition of Done, checks and rollback fields. Other templates have only a compact task passport.                                                                                                                                           | Add a short common task passport and Definition of Done checklist without changing existing issue content.                                                                                                    | Low                                                                                                                           | Yes                      |
| P2       | Repository root                                                    | `CONTRIBUTING.md` and `CODEOWNERS` are absent. New agents must reconstruct branch naming and required gates from several documents.                                                                                                                                                         | Add a concise contributor entry point and non-blocking `* @Smira31` ownership declaration.                                                                                                                    | Low                                                                                                                           | Yes                      |
| P2       | Labels on open Issues                                              | Two parallel taxonomies coexist (emoji labels and machine labels), while deterministic triage over-applies `automation`, `security` and `backend-dependent`. For example, several product/visual Issues carry automation or security labels only because those words occur in their bodies. | Define one canonical taxonomy (`type:*`, `area:*`, `priority:*`, `status:*`) and migrate labels only after owner review.                                                                                      | Medium: label changes affect saved filters and automation.                                                                    | Owner decision           |
| P2       | Issues #623, #618, #600 and #582                                   | Their bodies contain Vercel-era delivery or infrastructure wording. #618/#582 may also describe work partially superseded by merged PRs.                                                                                                                                                    | Review each Issue, update its current gate/host, and explicitly mark superseded scope. Do not auto-close.                                                                                                     | Low to medium                                                                                                                 | Owner decision           |
| P2       | Issues #620 and #516                                               | The goals are valid, but their Definition of Done is less testable than the more detailed #615/#600/#480 contracts.                                                                                                                                                                         | Add explicit acceptance checklists when work begins.                                                                                                                                                          | Low                                                                                                                           | Owner decision           |
| P2       | Disabled workflow files (historical finding)                       | At the time of this 2026-09-16 audit, `release.yml`, `pr-handoff.yml`, `issue-triage.yml` and `telegram-owner-qa-webapp.yml` remained in the tree but were `disabled_manually`.                                                                                                             | Owner subsequently confirmed they are unused; a dedicated cleanup removes the four workflow files while preserving the active Cloudflare Owner QA workflow.                                                   | Medium: re-enabling/removing may affect established operations.                                                               | Resolved by cleanup PR   |
| P2       | Dependabot                                                         | GitHub-managed Dependabot Updates and security updates are enabled, but no `.github/dependabot.yml` exists, so version-update cadence/grouping is not repository-defined.                                                                                                                   | Add a small grouped npm update policy after deciding cadence and review capacity.                                                                                                                             | Medium: may create noisy PRs.                                                                                                 | Owner decision           |
| P2       | Security policy                                                    | `SECURITY.md` is absent.                                                                                                                                                                                                                                                                    | Add it only after the owner chooses a private reporting channel and response expectations.                                                                                                                    | Low                                                                                                                           | Owner decision           |
| P3       | Branch naming                                                      | Existing remote names use `bugfix/`, `codex/`, `docs/` and `fix/`; there is no single documented policy.                                                                                                                                                                                    | Document `feat/`, `fix/`, `docs/`, `chore/`, `test/`, `refactor/` and the reserved `codex/` agent prefix.                                                                                                     | Low                                                                                                                           | Yes                      |
| P3       | Community profile                                                  | GitHub reports a partial community profile: no license, code of conduct or contributing/security files.                                                                                                                                                                                     | Add only documents whose legal/contact content the owner approves.                                                                                                                                            | Low to medium                                                                                                                 | Partly                   |

## Open Issues

All nine Issues are labelled and remain open intentionally. No clear exact duplicate was found.

| Issue                                                                                    | Classification                           | Audit result                                                                                |
| ---------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| [#623](https://github.com/Smira31/Mentalix/issues/623) Today Hero                        | Active visual task                       | Keep open; replace Vercel-era publication wording before implementation.                    |
| [#620](https://github.com/Smira31/Mentalix/issues/620) Check-In and Practices references | Active reference/implementation contract | Keep open; tighten acceptance checklist when scope is selected.                             |
| [#618](https://github.com/Smira31/Mentalix/issues/618) Demo Preview screens              | Needs owner triage                       | Keep open; reconcile merged work and replace the obsolete Vercel Preview gate.              |
| [#615](https://github.com/Smira31/Mentalix/issues/615) Guest onboarding                  | Deferred product/security work           | Keep open; it has detailed Ready/Done, isolation and rollback criteria.                     |
| [#612](https://github.com/Smira31/Mentalix/issues/612) Progress monitoring               | Active post-release evidence             | Keep open until real-device monitoring is complete.                                         |
| [#600](https://github.com/Smira31/Mentalix/issues/600) Evaluator–optimizer               | Deferred P1 technical/product program    | Keep open; update the old “frontend Vercel” context before execution.                       |
| [#582](https://github.com/Smira31/Mentalix/issues/582) Library programs UI Lab           | Needs owner triage                       | Keep open; determine remaining scope after merged Library work and replace the Vercel gate. |
| [#516](https://github.com/Smira31/Mentalix/issues/516) Illustration system               | Deferred design system work              | Keep open; add measurable acceptance criteria when activated.                               |
| [#480](https://github.com/Smira31/Mentalix/issues/480) AI handoff context                | Deferred backend-dependent work          | Keep open; detailed evidence and security gates remain relevant.                            |

Priority labels are not consistently applied: only #600 has `priority:P1`. Until a taxonomy decision is made, the ordering in `docs/TASK_INDEX.md` remains the practical priority source.

## Pull requests and branches

Open PR count is zero. Closed-without-merge PRs were reviewed as history, not reopened or deleted. They remain useful evidence for why work was rejected, superseded or split.

Current remote branch divergence is `main-only / branch-only` commits:

| Branch                                          | Divergence | PR   | Decision                                                                                                |
| ----------------------------------------------- | ---------: | ---- | ------------------------------------------------------------------------------------------------------- |
| `main`                                          |          — | —    | Protected; never delete.                                                                                |
| `bugfix/owner-iphone-telegram-qa`               |    `4 / 2` | none | Preserve: unique keyboard/CTA fixes; needs explicit task/PR decision.                                   |
| `codex/stoic-flow-reference-pack-2026-09-16-v1` |    `4 / 1` | none | Preserve: unique reference pack connected to active #620.                                               |
| `codex/ux-reference-pack-2026-09-15-v1`         |    `4 / 2` | none | Preserve: unique reference evidence connected to active #618/#623.                                      |
| `docs/sync-design-system-tokens`                |   `31 / 3` | none | Preserve pending owner decision: heavily diverged documentation rewrite, not proven merged or obsolete. |
| `fix/mxl-525-visual-batch`                      |   `58 / 1` | none | Preserve: unique Practices code/test commit; reconcile with current `main` before any PR.               |

No current non-main branch satisfies all deletion conditions. In particular, “no open PR” is not enough: every remaining branch has unique, unmerged commits. No branch was deleted by this audit.

## Actions and repository settings snapshot

Active project workflows:

- `Mentalix CI baseline` — PR/push/manual; concurrency cancellation, npm cache, timeouts, required aggregate check;
- `Cloudflare Owner QA` — manual exact-SHA Demo deploy, immutable provenance verification;
- `Firebase Hosting` — push to `main` and manual production deploy;
- GitHub-managed `Dependabot Updates` — active outside the repository workflow files.

At the time of this audit, manually disabled workflows were `Create release`, `PR handoff report`, `Issue triage` and `Telegram Owner QA Web App`. Historical runs may still appear in `gh run list`; they did not mean the workflow was enabled. The owner later confirmed these workflows were unused and approved their removal.

Settings verified through GitHub API:

- default branch `main`;
- delete branch on merge enabled;
- squash merge enabled; merge commits and rebase merge disabled;
- auto-merge disabled;
- active ruleset has no bypass actor;
- strict required status context `Базовая проверка проекта`;
- admins are enforced; deletion/force-push are blocked; linear history is required;
- Actions default token permission is read-only and cannot approve PR reviews;
- secret scanning and push protection enabled;
- wiki disabled; Issues and Projects enabled;
- repository description and topics are relevant; homepage is stale Vercel metadata.

## Documentation and Vercel review

The canonical hosting instructions in `README.md`, `PROJECT_STATE.md`, `docs/AGENT_ONBOARDING.md` and `docs/DOCUMENTATION_GUIDE.md` consistently say that Vercel is disabled/legacy. No active Vercel URL is presented there as a current deploy target.

Remaining Vercel URLs outside `docs/archive/` fall into three groups:

1. explicitly historical evidence in `docs/working/ui-lab/DECISION_LOG.md` — preserve;
2. old dated QA/research records under `docs/qa/` and `docs/research/` — preserve as historical evidence, but do not use operationally;
3. old operational wording in `docs/qa/MXL-LOOP-001_CURRENT_PREVIEW.md` — not authoritative according to the documentation hierarchy and should be archived or rewritten only with the owner of that task.

The environment-specific `VERCEL_ENV` reference in the design guard and source remains technical debt outside this GitHub-process scope; it is not an active deployment integration.

## Safe changes to implement in this PR

1. Update `PROJECT_STATE.md` to current `main` and successful Firebase Production evidence.
2. Add `CONTRIBUTING.md` with one branch policy and the existing canonical gates.
3. Add non-blocking `.github/CODEOWNERS` for visibility only.
4. Add scope, Definition of Done and rollback prompts to Issue templates.
5. Make Firebase Production self-verifying with `npm run check:core`, a timeout and a canonical-URL smoke check.

## Owner decisions required

- Whether to require one review, CODEOWNER approval and resolved conversations on `main`.
- Whether external Render health should block every frontend/docs PR.
- Whether to restrict Actions and pin third-party actions by commit SHA.
- Whether to remove stale Vercel-named GitHub environments and update the repository homepage.
- Which single label taxonomy and priority model to adopt.
- Whether disabled workflow files should be archived/removed.
- Dependabot cadence/grouping, security reporting contact, license and code of conduct.
- Final disposition of #618/#582 and each remaining unique remote branch.

## Intentionally unchanged

- No Issue was edited or closed.
- No remote branch was deleted.
- No repository setting, environment, endpoint, secret or deployment target was changed.
- No workflow was enabled or disabled.
- No Vercel integration or Preview environment was created.
- No product/UI code or historical document was changed.
- Firebase, Cloudflare, Render and Resend configuration values were not modified.

## Post-change verification plan

Run on the audit branch:

```text
npm run test:unit
npm run docs:check
npm run build
git diff --check
```

After pushing, require the branch CI to pass and keep the PR open for owner review. Do not merge or deploy from this audit automatically.

## Implemented and verified on the audit branch

Implemented after the audit was saved as its own first commit:

- production quality gate, 20-minute timeout and Firebase HTTP smoke check;
- non-blocking CODEOWNERS declaration;
- concise contributor/branch/release guide;
- explicit Definition of Done prompts in all Issue templates;
- current `main`, PR/Issue/branch inventory and Firebase evidence in `PROJECT_STATE.md`.

Verification:

- `npm run test:unit`: **PASS** — 274 tests, 272 passed, 2 skipped, 0 failed;
- `npm run docs:check`: **PASS** — 232 Markdown files, 0 errors;
- `npm run docs:drift`: **PASS**;
- `npm run doctor`: **PASS** after recording the exact `main` SHA in the format consumed by the doctor;
- `npm run build`: **PASS**;
- `git diff --check`: **PASS**.

The first sandboxed test attempt produced `spawn EPERM` before executing test bodies; the same command was rerun outside the process-restricted sandbox and passed. This was an execution-environment limitation, not a repository failure.
