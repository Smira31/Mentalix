# MXL-010 automated technical gate

## Scope

This gate is frontend-only and runs against a production build served by Vite preview. All external API responses are deterministic, synthetic fixtures. No real email, OTP, Telegram token, Chat ID, AI conversation, or private user data is used.

Command:

```bash
npm run ux:mxl010
```

The command runs `playwright.mxl010.config.mjs`, which builds the app and starts `vite preview` on `127.0.0.1:4174`. CI invokes it after the existing UX smoke in `.github/workflows/ci.yml`.

## Automated coverage

| MXL-010 step | Automated check                                                                                                                         | Result | Evidence boundary                                                    |
| -----------: | --------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------- |
|            1 | Deterministic web auth request-code, dev-code display and verify; fixture user reaches onboarding; fixture journey boots Today          | PASS   | Does not prove real email delivery or Telegram initData auth         |
|            2 | Today → `Пройти чек-ин`; four state selections                                                                                          | PASS   | Fixture-backed                                                       |
|            3 | Emotion → `Дальше` → morning writer; note input and save                                                                                | PASS   | Fixture-backed                                                       |
|            4 | Representative completion contract is already covered by existing `ux:check`; new gate asserts the user can continue after morning save | PASS   | Real ritual/asceza backend data remains outside fixture gate         |
|            5 | Handoff-mounted Mentor chat accepts input and renders a long synthetic AI reply; expand/collapse is checked                             | PASS   | Does not prove production AI latency/content/persistence             |
|            6 | Today review-pending state → evening analysis; emotion, lesson and close-day save                                                       | PASS   | Fixture-backed; real backend review acknowledgement remains unproven |
|            7 | Evening completion → Следопыт handoff; `?tab=mentor` and one-shot sessionStorage contract                                               | PASS   | Frontend contract only                                               |
|            8 | Mentor Back → picker → Today; URL is normalized back to `/`                                                                             | PASS   | Fixture-backed                                                       |
|            9 | Calendar week strip renders seven local-day cells                                                                                       | PASS   | Does not prove server-side calendar rollover or timezone policy      |
|           10 | Review completion save is unique in the fixture, reload returns to closed Today state, and data is reopened                             | PASS   | Does not prove cross-session/server persistence                      |

## Additional automated checks

The gate uses a 390×844 mobile viewport, dark theme, reduced motion, service workers blocked, retained trace/video on failure, and a production build. The existing `npm run ux:check` continues to cover 320×568, 375×812, 390×844, 430×932, Mentor picker layouts, History local journal, navigation geometry, overflow, Back/early-cancel representative paths, and practice completion screens.

## Minimal frontend fix included

`src/App.jsx` now synchronizes the `tab` URL parameter when switching tabs and removes it on return to Today. This prevents a browser reload after AI handoff from reopening Mentor instead of Today. The change is frontend-only and is directly covered by the new reload assertion.

## Remaining manual or backend-dependent gates

Real OTP delivery, Telegram initData, Telegram fullscreen/WebView safe-area values, physical iPhone keyboard behavior, production AI response, live ritual/asceza data, server-side evening acknowledgement, server calendar rollover, cross-session persistence and backend idempotency still require a real environment. They must remain `BLOCKED` until tested with a non-production account/backend mode and a real Telegram/iPhone session.

## Artifacts

- `automated-gate/check-core.log`
- `automated-gate/ux-check.log`
- `automated-gate/ux-mxl010.log`
- `automated-gate/diff-check.log`
- `release-gate-report.md`
