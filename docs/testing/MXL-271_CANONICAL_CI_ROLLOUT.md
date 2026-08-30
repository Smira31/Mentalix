# MXL-271 — Canonical CI rollout

## Frontend workflow contract

The canonical frontend workflow has one `quality` job for `npm ci`, `npm run check:core`, one UX job that installs Chromium and uploads failure artifacts, an informative backend health job, and a non-blocking dependency audit job. The `quality` job is the only required gate until stability is observed.

| Check | Failure policy | Secret/data rule |
| --- | --- | --- |
| quality | blocking | no secrets in logs |
| UX smoke | blocking after deterministic runner setup | upload screenshots only |
| backend health | informative initially | log status, not payload |
| npm audit | warning-only | separate remediation issue |

This rollout does not change branch protection, deployment limits, backend API or secrets. The backend repository needs its own owner-reviewed workflow; this document does not claim that private backend checks are implemented.
