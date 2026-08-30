# MXL-324 — Guided reflection safety protocol

## Bounded session

The session has four explicit stages: orient with consent, answer up to three guided prompts, summarize facts versus interpretation, and choose save/skip/delete. The default output is a user-editable summary; AI deepening is optional and never implied by completion.

| Guard | Rule |
| --- | --- |
| Consent | Explain purpose, optional AI processing and retention before the first answer. |
| Scope | No diagnosis, treatment plan, personality label or causal certainty. |
| Data control | Show whether data is local or server-backed; provide delete/export path only when implemented. |
| Small sample | Mark observations as insufficient when evidence is sparse. |
| Crisis | Stop ordinary prompts and route to professional/emergency help when immediate danger is indicated. |
| Exit | Every stage has skip, back and cancel without penalty. |

## Quality checklist

A session passes only if users can explain what is saved, correct the summary, leave without saving, and distinguish fact from interpretation. The session must not create a new tab or silently extend Journal history. This is a safety/content contract, not a production implementation approval.
