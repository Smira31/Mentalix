# MXL-LOOP-002 — Action Loop Regression Matrix

## Purpose

Verify that all problem-led practices preserve the intended action loop after the navigation fix:

`Today → Practices → Practice → completion → Today`

The matrix also protects the separate recovery contract:

`Practice → Back / early cancellation → Practices`

## Scope and ownership

This is a QA-only artifact. It does not change product code, navigation, backend contracts, payment, Telegram workflow, or the task index. Product-code ownership remains with the action-loop and practices PRs.

## Test matrix

| ID      | Scenario                                          | Preconditions                                      | Steps                                                                  | Expected result                                                                           | Evidence                       |
| ------- | ------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------ |
| LOOP-01 | First Step successful completion                  | Authenticated Telegram Mini App; Today visible     | Open Practices; open First Step; complete every stage; press Завершить | User lands on Today; practice is saved; no duplicate navigation                           | Screenshot/video and timestamp |
| LOOP-02 | No Blame successful completion                    | Authenticated Telegram Mini App; Today visible     | Open Practices; open Без вины; complete every stage; press Завершить   | User lands on Today; practice is saved                                                    | Screenshot/video and timestamp |
| LOOP-03 | Narrow Focus / Одно из всех successful completion | Authenticated Telegram Mini App; Today visible     | Open Practices; complete all six stages; press Завершить               | User lands on Today; practice is saved                                                    | Screenshot/video and timestamp |
| LOOP-04 | One Finish successful completion                  | Authenticated Telegram Mini App; Today visible     | Open Practices; complete every stage; press Завершить                  | User lands on Today; practice is saved                                                    | Screenshot/video and timestamp |
| LOOP-05 | Back from first stage                             | Any practice open at first stage                   | Press Back                                                             | User returns to Practices; no completion event; no Today handoff                          | Screenshot                     |
| LOOP-06 | Back from middle stage                            | Any practice open beyond first stage               | Press Back                                                             | User returns to Practices; partial text is not treated as completion                      | Screenshot                     |
| LOOP-07 | Early cancellation                                | Any practice started but not completed             | Use cancel/exit affordance or Back before final completion             | User returns to Practices; completion callback is not invoked                             | Screenshot and event evidence  |
| LOOP-08 | Reopen after cancellation                         | Practice was exited early                          | Reopen the same practice                                               | Flow starts in the expected initial state; no false completion banner                     | Screenshot                     |
| LOOP-09 | Completion exactly once                           | Any practice with valid input                      | Complete once and observe navigation                                   | One save and one Today handoff; no duplicate screen transition                            | Network/event log if available |
| LOOP-10 | Telegram launch context                           | Mini App opened from Mentalix bot button           | Launch from Telegram; complete any practice                            | No web email-auth screen; Telegram user context preserved                                 | Screenshot of Telegram webview |
| LOOP-11 | Direct web fallback                               | Open production URL in ordinary browser            | Navigate to production URL without Telegram context                    | Web-auth fallback is intentional and copy is correct; no claim that this is Mini App mode | Screenshot                     |
| LOOP-12 | Reload recovery                                   | Practice opened; reload at safe intermediate point | Reload the page and observe                                            | No crash; user receives expected recovery state; no false completion                      | Screenshot/video               |

## Acceptance criteria

The action loop passes only if LOOP-01 through LOOP-04 all land on Today after successful completion, and LOOP-05 through LOOP-08 all preserve the Practices recovery path. LOOP-09 must show no duplicate completion transition. LOOP-10 is required for the Telegram production gate; LOOP-11 documents the separate web behavior.

## Known constraints

A direct Vercel URL opened in a normal browser does not carry Telegram `initData` and may show web email authentication. This is a different runtime path from the Telegram Mini App and must not be used to judge Telegram-authenticated behavior.

Manual Telegram/iPhone evidence requires the owner's authenticated device. Automated CI can validate build, lint, health and smoke behavior but cannot replace this device gate.

## Reporting template

| ID      | Result | Evidence link | Notes / defect |
| ------- | ------ | ------------- | -------------- |
| LOOP-01 | TODO   | TODO          | TODO           |
| LOOP-02 | TODO   | TODO          | TODO           |
| LOOP-03 | TODO   | TODO          | TODO           |
| LOOP-04 | TODO   | TODO          | TODO           |
| LOOP-05 | TODO   | TODO          | TODO           |
| LOOP-06 | TODO   | TODO          | TODO           |
| LOOP-07 | TODO   | TODO          | TODO           |
| LOOP-08 | TODO   | TODO          | TODO           |
| LOOP-09 | TODO   | TODO          | TODO           |
| LOOP-10 | TODO   | TODO          | TODO           |
| LOOP-11 | TODO   | TODO          | TODO           |
| LOOP-12 | TODO   | TODO          | TODO           |
