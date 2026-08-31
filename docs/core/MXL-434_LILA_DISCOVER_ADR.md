# MXL-434 — DISCOVER-вход: ADR and pre-mortem

**Status:** proposed; no implementation authorized

## Decision context

Issue #434 proposes adapting the “Лила” idea into a DISCOVER entry for people who cannot formulate a problem: card or dilemma → one to three questions → a bounded hypothesis → user response (`да` / `частично` / `нет`) → translation into the existing loop of goal → experiment → Today → evening reflection.

The proposal may help users reach clarity, but it can also turn a reflective product into a suggestive personality-reading experience. This document is the required decision gate before any code, AI endpoint or content pack is added.

## Pre-mortem: assume the experiment failed

| Failure mode                                      | Early warning                                                                        | Prevention / kill rule                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| User treats a hypothesis as a diagnosis           | Users repeat AI wording as an identity claim or ask “is this what is wrong with me?” | Use hypothesis language, show uncertainty and require user confirmation; stop if correction/dismiss rate is low while certainty language rises |
| The game replaces the core loop                   | Users spend time drawing cards but do not choose a Today action                      | Keep one bridge CTA to a reversible next step; stop if card completion does not improve next-action selection                                  |
| AI invents personal history                       | Output mentions facts absent from the current session                                | Hard provenance boundary: only current answers may be used; block output when evidence is missing                                              |
| The 16–17 cohort receives unsafe framing          | Minor users receive adult assumptions, pressure or sensitive follow-up questions     | Youth safety review before testing; no sensitive probing; stop the cohort if the language or escalation path is unclear                        |
| Themes become hidden profiling                    | Users see a persistent “profile” they cannot inspect, correct or delete              | Start with session-local themes; no retention or Explore influence without consent, provenance and delete/export contract                      |
| Cultural or spiritual framing feels authoritative | Users interpret cards as prediction, fate or moral judgement                         | Position as reflective prompts only; prohibit prediction, fate claims, scoring and authority language                                          |
| The entry adds navigation and choice overload     | Today or Journal gains several equally loud entry points                             | Keep the entry secondary and reversible; do not add a tab; stop if the primary Today action becomes less discoverable                          |
| Backend/AI cost grows before value is known       | More prompts and model calls are added to compensate for weak completion             | Start with a static content pack and one bounded generation step; stop on unclear value rather than increasing complexity                      |

## Proposed decision

**Do not implement the feature yet.** Approve only a research artifact and, if the owner later confirms, a small content-only prototype with no persistent profile, no payment, no analytics expansion and no new navigation. AI generation remains a separate gate because the current product direction favours prompt-only, bounded reflection.

If an experiment is authorized, its first scope is:

1. Three static dilemmas with explicit reflective framing.
2. One to three user answers held only for the current session.
3. One hypothesis written as a possibility, with `да / частично / нет` correction.
4. One bridge to the existing next-action flow.
5. A visible exit and a “this does not fit” path.

## Acceptance gates before implementation

| Gate        | Required evidence                                                                    | Owner decision   |
| ----------- | ------------------------------------------------------------------------------------ | ---------------- |
| Product fit | The user problem is distinct from existing guided self-discovery                     | approve / reject |
| Safety      | Review for 16–17, sensitive disclosures, non-diagnostic language and help boundaries | approve / reject |
| Privacy     | Session retention, export/delete and consent are specified                           | approve / reject |
| Core loop   | The bridge to one Today action is measurable                                         | approve / reject |
| Content     | Cards are non-predictive, culturally respectful and owned/licensed                   | approve / reject |
| AI          | Model, prompt, provenance, refusal and correction behavior are specified             | approve / reject |

## Non-goals

This ADR does not approve a production feature, AI endpoint, user profile, persistent theme memory, gamification, fate prediction, diagnosis, therapy claim, new navigation tab or backend contract. It also does not close the issue; it makes the required pre-mortem explicit so the owner can decide with the risks visible.
