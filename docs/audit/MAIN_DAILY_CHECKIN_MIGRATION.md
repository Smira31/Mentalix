# Main Daily Check-In migration

## Scope

This change makes the existing expanded morning Check-In visual flow the default non-evening entry point. The legacy `CheckInCore` implementation is intentionally retained: it remains the evening review implementation and provides a rollback path without deleting the previous code.

The source audit is [STOIC_SETTINGS_AUDIT.md](https://github.com/Smira31/Mentalix/blob/main/docs/audit/STOIC_SETTINGS_AUDIT.md) from PR [#727](https://github.com/Smira31/Mentalix/pull/727). That audit confirms that the relevant work is in the Check-In/demo routes and that the preview flow was previously entered through `?demo=1` or `?source=pwa`.

## What is now default

`src/screens/CheckIn.jsx` routes every non-evening `CheckIn` render to `MorningCheckInFlow`. The flow keeps the expanded visual interaction: sequential mood and energy scales, the guided journal editor with formatting/add-action controls, save feedback, and the streak completion screen. Evening review continues to use `CheckInCore`.

The flow does not use a separate production fixture. On an ordinary authenticated runtime, `api.checkin.save(user.id, ...)` sends the selected mood, energy, anxiety/focus defaults, emotion, and journal note to `POST /checkin`; after a successful save it reads the real history from `GET /checkin/history` to calculate the streak. The local draft is cleared only after the backend save resolves successfully.

## Demo-only behavior that remains isolated

Preview behavior is still selected by `isPreviewDemoMode()` and is not part of the Check-In component selection anymore. When the URL contains `demo=1` or `source=pwa` on an allowed preview/demo host, the API request wrapper delegates to `demoRequest` in `src/lib/demoMode.js`. That layer supplies the seeded user, seeded Today/history data, localStorage-backed fake responses, and deterministic placeholder responses. It is deliberately outside the normal flow and is not used when those preview conditions are absent.

The default path therefore shares the visual component but does not share demo identity or seeded persistence. The real path uses the authenticated `user.id` and the configured backend request wrapper.

## AI/Premium upsell decision required

The current `main` branch contains no rendered AI/Premium upsell screen in the expanded Check-In component, despite related legacy CSS selectors such as `mx-demo-checkin__scene--upsell`. No monetization behavior was added, removed, or converted in this migration.

**Owner decision needed:** should the AI/Premium upsell be restored as a real subscription/paywall flow in the new primary Check-In, remain an explicitly demo-only concept, or be omitted from this flow? This PR leaves monetization unchanged until the owner confirms the intended product behavior and subscription contract.

## Verification contract

The regression test `tests/unit/main-daily-checkin-contract.test.mjs` checks the default route, retention of the legacy core, real check-in API calls, and isolation of seeded demo interception. Manual/UX evidence should cover the default route without query parameters and the preview route with `?demo=1`; screenshots should be attached to the PR before merge.
