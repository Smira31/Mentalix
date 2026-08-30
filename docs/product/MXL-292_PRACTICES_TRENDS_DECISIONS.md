# MXL-292 — Practices and Trends decision record

## Owner decision recorded for this iteration

**Practices остаются плоским списком строка-за-строкой.** Это сохраняет спокойную и функциональную иерархию Mentalix, сокращает декоративный шум и позволяет выбирать практику по problem framing, а не по обложке. Карточки/tiles не вводятся в текущем scope.

**Trends остаётся плотным числовым dashboard с оговорками.** Числа показываются только при достаточном evidence и сопровождаются period/sample context. Эмоциональный слой не должен превращать descriptive data в оценку личности или прогресс-скоринг.

| Area | Decision | Affected surfaces | Out of scope |
| --- | --- | --- | --- |
| Practices | keep row list; strengthen purpose/next-action copy | Practices list, practice row | tiles, cover art, new catalogue |
| Trends | keep numeric dashboard with provenance and caveats | Trends cards/chart labels | new metrics, streaks, motivational score |

## Implementation boundary

This is a decision record, not a layout rewrite. Any implementation issue must be separate and must preserve mobile flow, accessibility, safety language and descriptive—not causal—insights. A later audit may reverse either decision only with new evidence.
