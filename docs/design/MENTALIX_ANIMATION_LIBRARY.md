# Mentalix animation library

This is the source of truth for approved motion patterns in Mentalix. Motion explains a state change or gives feedback; it must not create pressure, obscure focus or increase time-in-app for its own sake.

## Global motion rules

Every motion record names its purpose, trigger, duration, easing, affected property, reduced-motion behavior, performance risk and example screen. Motion must be optional in meaning: important information is also communicated by text, shape, icon or state. No record approves looping decorative motion, parallax, surprise movement or a shake as the default error response.

## Canonical motion records

| Motion ID                | Purpose                                      | Trigger                           | Duration / easing                    | Affected property         | Reduced-motion behavior  | Performance risk | Example screen     | Status    |
| ------------------------ | -------------------------------------------- | --------------------------------- | ------------------------------------ | ------------------------- | ------------------------ | ---------------- | ------------------ | --------- |
| `MX-MOTION-ENTER-001`    | Establish a calm transition into a new state | Screen or state enters            | 180–240ms, ease-out                  | opacity, small translateY | opacity-only or instant  | low              | Today, Journal     | canonical |
| `MX-MOTION-COMPLETE-001` | Confirm that one action was accepted         | Practice or next action completes | ≤180ms, ease-out                     | scale, opacity            | static success state     | low              | Today, Practices   | canonical |
| `MX-MOTION-LOADING-001`  | Show that content is being prepared          | Async content begins              | restrained opacity pulse or skeleton | opacity                   | static placeholder       | low–medium       | Journal, Analytics | canonical |
| `MX-MOTION-ERROR-001`    | Keep an error visible without blame or alarm | Recoverable request fails         | no motion by default                 | none                      | static error copy        | low              | Today, Settings    | canonical |
| `MX-MOTION-FOCUS-001`    | Make keyboard focus discoverable             | Element receives focus            | instant outline or ≤120ms opacity    | outline, border color     | same visible focus state | low              | Journal inputs     | canonical |
| `MX-MOTION-DRAFT-001`    | Confirm a local draft was retained           | Draft save completes              | ≤160ms, ease-out                     | opacity, icon state       | static saved label       | low              | JournalFlow        | proposed  |

## Implementation contract

Use transform and opacity for frequent transitions when possible. Never animate layout dimensions, scroll position or keyboard position as a decorative effect. An animation must not delay the next user action or require the user to wait before cancelling or continuing.

For every new motion addition, the implementation PR must state the matching `motion_id`, include the reduced-motion alternative and pass a mobile and desktop smoke check. If a new motion cannot meet these conditions, document the exception and create a design-debt issue rather than silently adding it.

## Accessibility and safety checklist

- [ ] The state is understandable without motion.
- [ ] `prefers-reduced-motion: reduce` receives a static or opacity-only alternative.
- [ ] Motion does not hide or move keyboard focus unexpectedly.
- [ ] The animation does not block cancellation or the next action.
- [ ] No loop, parallax, surprise movement or default error shake is introduced.
- [ ] The affected surface remains within Telegram safe-area and responsive constraints.
- [ ] The PR names the motion record and reports its performance risk.
