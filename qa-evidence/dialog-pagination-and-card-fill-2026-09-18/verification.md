# Dialog pagination and card fill verification

Viewport: **390×844**, dark theme, reduced motion.

## Result

![Dialog after pagination removal and card fill adjustment](dialog-390x844.png)

The role pagination dots are absent. The active card remains selectable by tapping the card itself, and horizontal swipe selection remains unchanged.

## Pager behavior before removal

The dots were not decorative only. Each dot was a button with `onClick={() => selectRole(index)}`; `selectRole` centered the corresponding carousel card and updated the active state. They were intentionally removed because the requested UI no longer displays pagination, while equivalent card-tap and swipe interactions remain available.

## Card fill measurements

| Measurement              |      Value |
| ------------------------ | ---------: |
| Pager elements           |        `0` |
| Card height              |    `304px` |
| Card bottom padding      |     `42px` |
| Button bottom            | `731.84px` |
| Card bottom              | `762.25px` |
| Filled area below button |  `30.41px` |
| Carousel height          |    `324px` |

The card height increased from `280px` to `304px` at the 390px production viewport. Only the bottom padding and matching card/track height were extended; text, button geometry, carousel mechanics, radius, shadow, and fill tokens were preserved.
