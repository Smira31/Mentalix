---
status: working
last_verified: 2026-09-11
---
# Progress Scope C — Release Description and Changelog

## Release description

**Scope C** is a visual refinement of the feature-flagged Progress V2 layout. It reorganizes the existing Activity metrics into a clearer card composition while preserving the data contracts, calculations, API sources, period selector, calendar behavior, observations, emotion metrics, and all legacy behavior.

The V2 Activity cards for **Rituals, Askezas, Energy, and Focus** now use the existing ring visualization as the single display of the metric value. The duplicate text value and the redundant linear progress bar are removed from V2 only. The cards use the existing Mentalix card background and radius, with the V2 border removed to align the surface more closely with the Journal card pattern from History. Legacy mode remains unchanged when `VITE_PROGRESS_LAYOUT_V2` is disabled.

This change is safe to preview behind the existing feature flag. It does not introduce new modules, API behavior, data sources, or production configuration changes.

## Changelog

### Changed

- Removed the duplicate visible metric value from V2 Activity cards; the value is rendered once inside the ring.
- Removed the linear progress bar from V2 Activity cards because the ring is now the only progress indicator.
- Reduced V2 Activity-card padding from 26px to 20px to match the intended Journal-card density.
- Removed the V2 Activity-card border while retaining the existing background and 24px radius.
- Repositioned the ring value to remain visually centered after the padding change.
- Preserved the existing `min-height: 174px`, ring dimensions, ring colors, labels, notes, details disclosure, and activity data.

### Unchanged

- Legacy Progress layout and its numeric values and linear progress bars.
- `VITE_PROGRESS_LAYOUT_V2` feature-flag behavior.
- Mood trend calculations and period selection.
- Observation evidence and visibility states.
- Calendar period bounds and month navigation.
- Emotion totals, top-four emotion list, and emotion-card styling.
- Loading, empty, error, and normal states.
- API contracts, data sources, and backend behavior.
- Telegram WebView input and scroll behavior.

## Validation

| Check                      | Result                                    |
| -------------------------- | ----------------------------------------- |
| `npm run build`            | PASS                                      |
| `npm run test:unit`        | PASS — 258/258                            |
| `npm run ux:check`         | PASS — 8/8 integration tests              |
| V2 production UX check     | PASS — 320×568, 375×812, 390×844, 430×932 |
| Legacy production UX check | PASS — 320×568, 375×812, 390×844, 430×932 |
| `git diff --check`         | PASS                                      |

## Rollout and release constraints

The V2 layout remains disabled by default and must be enabled explicitly in Preview with `VITE_PROGRESS_LAYOUT_V2=true`. No merge or production deployment is included in this change. Before enabling the flag more broadly, the owner should verify the final composition in a real Telegram WebView at 390×844 or wider.

## Pull request

[PR #572 — Scope C Progress V2 card refinement](https://github.com/Smira31/Mentalix/pull/572)

Related context: [PR #569 — Scope A](https://github.com/Smira31/Mentalix/pull/569) and [PR #571 — Scope B](https://github.com/Smira31/Mentalix/pull/571).
