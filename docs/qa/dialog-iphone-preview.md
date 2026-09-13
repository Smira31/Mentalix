# Dialog visual QA contract

The Dialog screen is reviewed inside fixed iPhone CSS viewports, never by stretching the app to a desktop browser width.

| Device            | CSS viewport |
| ----------------- | -----------: |
| iPhone 16         |      393×852 |
| iPhone 16 Pro     |      402×874 |
| iPhone 16 Pro Max |      430×932 |

The desktop review entry point is `public/dialog-iphone-preview.html`. Every Dialog visual change must be checked in the iPhone 16 and iPhone 16 Pro Max frames at minimum; iPhone 16 Pro remains a required intermediate-width regression check.

Required visual gates are: no page vertical scroll, no carousel vertical scroll, five-item global navigation remains unchanged, active card and dots remain visible above the navigation, and the surface does not leave unexplained empty space between the role carousel and bottom navigation.
