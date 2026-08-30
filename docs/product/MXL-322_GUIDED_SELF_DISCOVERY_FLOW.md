# MXL-322 — Guided self-discovery flow

## Flow contract

| Step | User-facing question | Output |
| --- | --- | --- |
| Context | What situation do you want to understand? | one concrete situation |
| Evidence | What happened, what did you expect, what is unknown? | facts / interpretation / unknowns |
| Pattern | Do two examples share a condition? | tentative pattern, or `not enough evidence` |
| Experiment | What small reversible test would teach you something? | one next action and observation |
| Review | What should be kept, edited or deleted? | user-controlled note |

The flow never infers a stable personality trait from one answer, never diagnoses and never treats an AI hypothesis as fact. It uses sample-size and provenance labels, supports skip/edit/delete and returns to the existing Journal/Today route. Memory, search and a new backend endpoint remain out of scope.

## Success criteria

Users can state the question they are exploring, identify at least one unknown, leave with one reversible experiment and explain what will be saved. A failed or abandoned session is valid and must not be framed as a personal failure.
