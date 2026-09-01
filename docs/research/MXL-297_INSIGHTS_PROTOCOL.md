# MXL-297 — descriptive insights research protocol

This protocol defines how Mentalix may test the value of descriptive pattern observations after journal history and provenance are available. It does not authorize a production insights engine or conclusions from sparse data.

## Product question

Would a person return for a careful description of repeated patterns if the description helps them choose a next action without diagnosing, judging or claiming causality?

The free daily loop remains primary. An insight is useful only if it improves clarity or supports a next action; time spent reading an insight is not a success metric by itself.

## Minimum data and sample guards

| Guard            | Requirement                                                               | If not met                        |
| ---------------- | ------------------------------------------------------------------------- | --------------------------------- |
| History depth    | At least 7 dated entries across at least 5 distinct days                  | Show no pattern observation       |
| Repetition       | A candidate pattern appears in at least 3 separate entries                | Show “not enough repeated signal” |
| Context coverage | At least 2 contexts or states are represented                             | Do not compare contexts           |
| Missingness      | Missing or skipped fields are reported, not imputed as negative evidence  | Keep the observation narrower     |
| Cohort size      | Aggregate research comparisons require at least 5 participants per cohort | Report directional learning only  |
| Provenance       | Every observation links to source entry IDs and dates                     | Do not render it                  |

These guards are product-research defaults, not statistical proof. A later experiment plan must define its analysis method before collecting confirmatory data.

## Approved observation shapes

| Observation type      | Safe example                                                        | Must not claim                                                     |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Frequency             | “В твоих записях чаще встречается слово «начать» по понедельникам.” | That Monday causes difficulty or that the user is a procrastinator |
| Co-occurrence         | “В трёх записях упоминались поздний вечер и трудный старт.”         | That one factor caused the other                                   |
| Self-reported support | “Ты трижды отметил, что короткий шаг помог продолжить.”             | That the step will always work                                     |

Every rendered observation must use uncertainty language, show a source window or count, and offer “это не похоже на меня” / dismiss / hide controls. User correction takes priority over the generated description.

## Provenance contract

An observation record must contain `observation_id`, `generated_at`, `source_entry_ids`, `source_dates`, `observation_type`, `text`, `uncertainty_note`, `sample_count`, `missingness_note`, `model_or_rule_version` and `user_visibility_state`. The system must be able to explain which entries contributed to the text without exposing another user's data.

## Usefulness experiment

The first test compares three conditions: no observation, one descriptive observation with provenance, and one observation plus a suggested reversible next action. The primary measures are perceived usefulness, trust, correction/dismiss rate and return intent. Track whether the user can explain what the observation is based on; do not optimize for chat length or emotional intensity.

Before a production experiment, the owner must approve retention, export/delete behavior, cohort definitions, age handling for 16–17, and the exact rule or model that generates the observation. AI-generated text must remain subordinate to source provenance and must not add silent memory.

## Non-goals

This protocol does not authorize diagnosis, personality typing, risk prediction, causal inference, treatment recommendations, hidden scoring, ranking users or automatic intervention. It also does not remove the dependency on Journal persistence, journal history, timezone correctness and a privacy review.
