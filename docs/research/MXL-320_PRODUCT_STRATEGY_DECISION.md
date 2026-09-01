# MXL-320 — Mentalix product strategy decision artifact

This artifact summarizes the product direction recorded by the owner. The source of truth for age segmentation is `docs/core/PRODUCT_DECISIONS.md` → **MXL-DEC-021**, `Обновление 31.08.2026`; this document does not independently confirm that decision. It prevents parallel agents from reopening the same decisions and keeps implementation work aligned with one measurable loop.

## Direction aligned with the current owner decision

Mentalix serves a broad working audience of **16–35 years old**, while analysis separates 16–17, 18–24 and 25–35 cohorts. This wording follows the current owner sign-off in MXL-DEC-021. The first problem statement is narrow: **a person cannot start an important task**. Mentalix is a reflection-and-action product, not a therapy, diagnostic or emergency-response service.

The primary loop is:

> `Today → one next action → completion → evening review → return tomorrow`

Today remains the primary entry point. Journal, Practices and AI are supporting surfaces inside this loop, not independent destinations or a sixth tab. The product should answer “what can I do now?” before offering additional exploration.

## Experiment order

| Order | Experiment                 | Current decision                                                            | Completion signal                                               |
| ----: | -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------- |
|     1 | Starter Set                | Keep the scope narrow and preserve one primary Today action                 | User can choose and begin one small practice                    |
|     2 | Guided self-discovery      | Prompt-only first stage, no AI deepening or cloud memory                    | User names facts/unknowns and chooses one reversible experiment |
|     3 | Functional AI roles        | Delay until consent, retention, provenance and safety contract are explicit | AI preserves fact/interpretation/unknown distinction            |
|     4 | Guided reflection sessions | Research only until separate safety review and owner decision               | No implementation implied by this artifact                      |

## Measurement contract

The first six-week learning cycle measures first check-in completion, next-action selection and completion, evening review completion, next-day return, D7 return, full-loop completion, voluntary edits/cancellations, API errors and safety incidents. Time spent in AI chat is not a primary success metric.

For paid-outcome research, the free daily loop remains available. The first concept test compares problem-led track, descriptive pattern summary and AI deepen; it captures intent and trust objections locally without checkout or payment provider.

## Safety gates

The 16–17 cohort requires the safety/privacy gate defined in MXL-DEC-021 before user testing: age-appropriate language, minimal data collection, Journal privacy, AI boundaries and sensitive-message handling. The gate must be completed before testing begins. No age cohort receives diagnosis, therapy claims, coercive streak pressure or hidden memory.

No feature in this artifact authorizes a production change, new AI persona, backend contract, payment flow, data retention policy or navigation change. Such changes require a separate owner decision and a narrowly scoped PR.

## Current implementation handoff

The following work is intentionally separated into independent PRs: design guard foundation, local-only WTP concept test, reference library, prompt library, animation library, character canon and visual-card library. Each PR can be reviewed, stopped or merged independently. Manual Telegram/iPhone gates remain evidence gates; green automation does not replace them.

## Rollback and ownership

This artifact is documentation-only. If a later experiment conflicts with the primary loop, close the experiment PR or disable its feature entry without changing the core Today route. The product owner is the final approver for any scope expansion.
