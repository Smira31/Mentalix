# MXL-297 — Descriptive insight guards

## Guard contract

An observation may be shown only when its provenance is known, the sample is large enough for the rule, and the wording remains descriptive. If a guard fails, show no insight rather than a weaker-looking guess.

| Guard | Rule |
| --- | --- |
| Sample size | minimum 7 eligible observations for a simple descriptive count; no subgroup claim below 14 observations |
| Provenance | source fields, date range and timezone are available |
| Recency | stale data is labelled with its date range |
| Language | use “ты заметил/а” or “в этих записях чаще встречается”, never “ты такой” |
| Causality | never infer why a pattern exists |
| Control | provide not useful, hide and delete controls |

Prototype types: repeated context, completion-time distribution and self-reported energy association. Each is shown with a sample count and source range. The guard is not a diagnosis and does not override Journal history/backend contracts.
