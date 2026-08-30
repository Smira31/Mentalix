# MXL-246 — Responsive Journal contract

| Viewport | Layout contract | Action contract |
| --- | --- | --- |
| 320×568–430×932 | single column, readable prompt measure | keyboard-safe action group |
| 768×1024 | constrained single or two-column day/review | CTA visible without editor overlap |
| 1024×768 | two-column candidate with bounded editor | mouse, touch and Tab reachable |
| 1440×900 | centered content shell; no full-width prose | action group aligned to content measure |

The prompt/editor uses a bounded max-width rather than stretching to the viewport. Intro, day, review and completion share spacing and typography tokens. Existing weekly-theme semantics, four local fallback phases, Mentor handoff, persistence and 16px inputs remain unchanged.

Acceptance evidence must include screenshots for intro, active editor, review and completion at tablet and desktop widths plus keyboard focus assertions. The mobile matrix must remain green before any merge.
