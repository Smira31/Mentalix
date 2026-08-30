# MXL-STARTER-SET-001 — starter-set decision artifact

## Status

**Research / owner decision required / prototype not approved.** This artifact makes the proposed starter set testable without adding a new tab, changing AI personas, introducing backend sync, or making any practice mandatory.

## Hypothesis

A new user may begin the first daily cycle faster when shown a small, contextual set of choices instead of an empty or full catalog. The success criterion is a meaningful first action, not time spent in the app, number of selections, or streak length.

## Candidate contexts for the first test

The owner should select **3–5** contexts before a prototype is built. The following set is a bounded candidate, not an approved product decision:

| Context | Example practice framing | Light version | User control |
|---|---|---|---|
| Focus | Choose one next action before noon | Write one next action | Accept, skip, replace, edit |
| Calm | Create a short pause before the next task | Two minutes of quiet breathing | Accept, skip, replace, edit |
| Energy | Make the next physical action smaller | One glass of water or two minutes of movement | Accept, skip, replace, edit |
| Order | Reduce one visible source of friction | Clear one small surface or list one item | Accept, skip, replace, edit |
| Self-understanding | Notice one fact without solving it | Write one observation | Accept, skip, replace, edit |

These examples are prompts for testing comprehension, not medical or psychological prescriptions. “Askesis” must be presented as an optional experiment, never as a moral obligation or a test of discipline.

## First-cycle rules

1. Show no more than 3–5 suggestions after the user selects a context.
2. Explain each suggestion with purpose, concrete duration, and a light version.
3. Offer one practice and at most one optional askesis for the first cycle.
4. Allow accept, skip, replace, and edit for every item.
5. Use “light / usual / deeper” or concrete time instead of “minimum / average / maximum”.
6. Today shows one primary next step, not a competing list of obligations.
7. Evening review asks whether to keep, simplify, change, or remove the item.
8. A skipped or unfinished item does not reduce a streak, create a warning, or trigger shame.

## Concept-test script

| Step | Prompt | Observable result |
|---|---|---|
| Context choice | “Что сейчас важнее: фокус, спокойствие, энергия, порядок или самопонимание?” | User understands that the choice is optional and contextual |
| Suggestion card | “Зачем это / сколько займёт / лёгкая версия” | User can explain the purpose and duration |
| Control | “Принять, пропустить, заменить или изменить?” | User finds all controls without coaching |
| Primary step | “Один главный шаг на сегодня” | User can name one reversible action |
| Evening review | “Оставить, упростить, изменить или убрать?” | User can revise without penalty |

## Measures

Record time to first understandable choice, comprehension of voluntariness, perceived pressure, edit/skip rate, first-step completion, evening-review return, and reasons for opting out. Report denominators for each stage. Do not use session length, message count, streak continuation, or forced completion as a success metric.

## Safety and agency checks

No suggestion may imply diagnosis, treatment, moral worth, or guaranteed improvement. No mandatory askesis, streak punishment, guilt copy, or irreversible action is allowed. The user must be able to leave without losing unrelated data. The product must clearly state that suggestions are optional and not medical or psychological instructions.

Any AI-generated suggestion needs the same bounded role and safety review as existing AI work. Do not introduce hidden memory, sensitive persistence, or notification content in this experiment.

## Decision gate

Before implementation, the owner must decide whether a separate starter set is wanted on top of the existing Journal/Practices flow and which 3–5 contexts are approved. Then complete a lightweight concept test and manual mobile/Telegram gate. This document does not authorize new navigation, backend synchronization, payment, or production persona changes.

## Rollback

This is a research-only artifact. Remove this file and its `CHANGES.md` entry to roll back; no product behavior is changed by the document.
