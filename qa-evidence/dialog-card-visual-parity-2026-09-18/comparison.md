# Today / Dialog card visual comparison

Viewport: **390×844**, dark theme, reduced motion.

## Before → after

| Today reference                                                                                         | Dialog before                              | Dialog after                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| [Today](/home/ubuntu/Mentalix/qa-evidence/dialog-card-visual-parity-2026-09-18/after/today-390x844.png) | [Dialog before](before/dialog-390x844.png) | [Dialog after](after/dialog-390x844.png) |

The Today screenshot is captured in the same evidence run as the Dialog screenshots; it is unchanged by this PR and serves as the reference surface.

## Concrete differences found and corrected

1. **Corner radius:** Today’s primary card uses `32px` (`--mx-radius-hero`); Dialog used `24px` (`--mx-radius-card`). Dialog now uses `--mx-radius-hero`.
2. **Surface opacity:** Today uses opaque `rgb(var(--c-card2))`; Dialog used `rgb(var(--c-card2) / 0.84)`. Dialog now uses the opaque Today surface.
3. **Border treatment:** Today uses the quiet line treatment `rgb(var(--c-line) / 0.08)`; Dialog inherited a stronger `rgb(var(--c-border) / 0.72)`. Dialog now uses the Today line treatment.
4. **Shadow:** Today’s hero surface uses the deeper editorial shadow (`inset 0 1px 0 ...` plus `0 18px 44px ...`); Dialog had only a barely visible inset highlight. Dialog now uses the same shadow tokens/values.

## Differences intentionally retained

1. **Card dimensions:** Dialog remains `204px` wide and has viewport-specific heights. This is intentional for the role carousel: adjacent role cards must remain visible at the sides, and the existing layout/overlap safeguards from PR #664/#666 must not change.
2. **Internal padding:** Dialog remains `18px` (`--mx-dialog-card-padding`) rather than Today’s `36px 24px 42px`. The Today card is a large single hero surface; applying its generous padding would truncate Dialog’s role content and CTA. The Dialog padding is therefore a deliberate compact-card adaptation, not a surface-style mismatch.
3. **Typography:** Dialog keeps its compact persona title/body sizes (`18px` / `13px`) instead of Today’s hero title scale. Three role cards and their CTA must fit in the carousel; changing this would alter information density and risk the existing mobile layout.
4. **Carousel spacing and side peeking:** unchanged as requested.
5. **Dialog surface/header geometry and BottomNavigation reserve:** unchanged; this PR only changes card-level visual tokens.

## Computed-style evidence

| Property       |                                                             Today |             Dialog before |                       Dialog after |
| -------------- | ----------------------------------------------------------------: | ------------------------: | ---------------------------------: |
| Border radius  |                                                            `32px` |                    `24px` |                             `32px` |
| Border         |                                `1px solid rgba(230,230,230,0.08)` | `1px solid rgb(41,41,41)` | `1px solid rgba(230,230,230,0.08)` |
| Background     |                                                   `rgb(17,17,17)` |     `rgba(17,17,17,0.84)` |                    `rgb(17,17,17)` |
| Box shadow     | same reference hero shadow (suppressed by reduced-motion capture) |                inset-only |         same reference hero shadow |
| Dialog padding |                                                                 — |                    `18px` |                             `18px` |

The Dialog card rectangle, carousel geometry, card heights, bottom reserve and navigation mechanics were not changed.
