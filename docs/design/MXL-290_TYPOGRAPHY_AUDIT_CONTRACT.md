# MXL-290 — Typography audit contract

## Approved mapping

| Token/use | Font | Rule |
| --- | --- | --- |
| body and headings | Onest | preserve current readable hierarchy and weights |
| `font-label`, eyebrow, compact labels | Manrope | use only for explicit label/eyebrow contexts |
| inputs | Onest | keep at least 16px to avoid mobile zoom |

The audit must compare the current branch with `origin/main`, list every changed selector and confirm that `font-label` does not leak into body, headings, editor copy or buttons. No color token, text copy, product structure or backend contract changes are allowed.

## Verification matrix

Run `npm run check:core`, then the existing UI smoke for Journal, Today, Practices and Trends at mobile and desktop widths. Capture computed font-family and font-size for heading, body, label and input fixtures. A failed or unavailable UI smoke is recorded as a gate failure; it is not silently waived. The actual typography code remains in the existing feature branch until git-sync is resolved.
