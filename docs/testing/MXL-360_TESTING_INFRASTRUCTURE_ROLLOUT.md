# MXL-360 — Testing infrastructure rollout

Этот документ превращает post-MVP техдолг в независимые проверяемые slices. Он не объявляет ручные device gates пройденными.

| Slice | Deliverable | Gate | Evidence |
| --- | --- | --- | --- |
| Design guard | `test:design-guard` и snapshot of approved tokens | deterministic exit code | report + diff summary |
| Contract harness | idempotency/upsert checks for practice logs | fixture-backed API contract | test output |
| Playwright states | states coverage and visual baseline | Chromium on CI | screenshots on failure |
| Performance | baseline/check scripts | bounded budgets, no secrets | JSON summary |
| UX/accessibility | keyboard, labels and state checks | smoke suite | HTML report |

Each slice must be independently revertible. CI failures are blocking only after the command is deterministic on a clean runner; manual iPhone/Android gates remain separate. `npm audit` is warning-only until a remediation plan exists. No Sentry, deployment, branch protection or backend contract is introduced by this document.

## Definition of done

A slice is complete when its command exists, fails with a useful message, passes on a clean runner, stores evidence on failure and has one focused regression test. The rollout order is contract harness → design guard → Playwright states → performance → accessibility, because later gates depend on stable fixtures.
