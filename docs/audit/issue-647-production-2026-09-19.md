---
title: Production status check — Issue #647
issue: 647
date: 2026-09-19
status: investigation in progress
scope: deploy verification only
---

# Production status check — Issue #647

## Executive status after the first verification pass

| Check                                     | Result                          | Evidence / limitation                                                                                                                                                                                          |
| ----------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend PR #73 merged                     | **Yes**                         | Merged 2026-09-17; merge commit `605846a5fbbeec682ba87df8bfd842f29bc44a3b`.                                                                                                                                    |
| PR #73 included in `mentalix-bot/main`    | **Yes**                         | Current remote `main`: `d873fb984a55eefcda64704601bd527f864d40ba`; GitHub compare reports `ahead_by: 8`, `behind_by: 0` from the merge commit.                                                                 |
| Frontend PR #649 merged                   | **Yes**                         | Merge commit `d364846d48f2ee3f91987c9925cb0772206854ab`.                                                                                                                                                       |
| Repository rewrite configuration          | **Yes**                         | Current `firebase.json` routes `/api/**` to Cloud Run service `mentalix-auth-proxy` in `us-central1`, before the SPA fallback.                                                                                 |
| Production `/api/health` through Firebase | **Responds**                    | `https://mentalix-production.web.app/api/health` returned HTTP 200 and `{"status":"ok"}`; headers include `server: Google Frontend`, `rndr-id`, and `x-render-origin-server: uvicorn`.                         |
| Direct Render backend health              | **Responds**                    | `https://mentalix-bot.onrender.com/api/health` returned HTTP 200 and `{"status":"ok"}`.                                                                                                                        |
| Render deploy SHA                         | **Not confirmed**               | No Render API credential, Render CLI, or deploy workflow exposing the runtime SHA is available in this session. Repository documentation explicitly records this as a known limitation.                        |
| Cloud Run service existence / revision    | **Not independently confirmed** | `gcloud` is unavailable and no Cloud Run credentials are configured. The production rewrite is strongly evidenced by the successful `/api/health` response, but service/revision metadata cannot be inspected. |
| Issue #647 closed on Production           | **No conclusion yet**           | The issue remains OPEN. A health response alone does not prove standalone Safari session restoration or timeout behavior.                                                                                      |

## Current provisional conclusion

The code and Git history show that the intended fix is merged on both sides: frontend PR #649 and backend PR #73. Production Firebase also has the repository-level rewrite configuration, and the production `/api/health` path reaches a healthy response with Render-origin indicators. This is enough to say that the proxy path is live at the HTTP health level, but **not enough to declare Issue #647 closed**: the exact Render runtime SHA, Cloud Run revision, and an authenticated standalone/PWA flow remain unverified.

The previous splash observation must not be labelled a cookie regression yet. It was made without Telegram or an authenticated web session; that case is compatible with an unauthenticated boot path and must be tested separately from a valid-session standalone launch.

## 1. Scope and non-actions

This is a deployment verification report. No application code, backend code, Firebase configuration, production secret, deployment, merge, or unrelated issue is changed by this audit.

## 2. Source references

- [Issue #647](https://github.com/Smira31/Mentalix/issues/647)
- [Frontend PR #649](https://github.com/Smira31/Mentalix/pull/649)
- [Backend PR #73](https://github.com/Smira31/mentalix-bot/pull/73)
- Production frontend: <https://mentalix-production.web.app>
- Production backend health: <https://mentalix-bot.onrender.com/api/health>
