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

## 3. Что именно делает PR #73

PR #73 не изменяет FastAPI/Render application code. Merge commit добавляет четыре файла только в `proxy/`:

- `proxy/Dockerfile`;
- `proxy/server.mjs`;
- `proxy/server.test.mjs`;
- `proxy/README.md`.

Следовательно, формулировка «задеплоен ли PR #73 на Render» смешивает два deployment target. Сам PR описывает отдельный **Cloud Run** service `mentalix-auth-proxy`, который проксирует `/api/**` к Render backend и переводит backend cookie `mentalix_session` в host cookie `__session`. Render должен обслуживать upstream backend, но не обязан содержать код из `proxy/`.

Для текущей production-проверки это означает:

- PR #73 — **merged into backend `main`**;
- факт отдельной Cloud Run revision по SHA — **не подтверждён через Cloud Run API**, потому что в сессии нет `gcloud` и GCP credentials;
- факт отдельного Render deploy SHA для самого proxy — **не применим** к содержимому PR #73;
- прямой Render backend отвечает health 200, но это подтверждает только upstream availability.

## 4. Production rewrite и proxy fingerprint

Текущий `firebase.json` на frontend `main` содержит правило до SPA fallback:

```json
{
  "source": "/api/**",
  "run": {
    "serviceId": "mentalix-auth-proxy",
    "region": "us-central1"
  }
}
```

Live behavior подтверждает, что это правило не осталось только в репозитории:

| Request                                 |                Firebase Production |            Direct Render | Interpretation                                                                                              |
| --------------------------------------- | ---------------------------------: | -----------------------: | ----------------------------------------------------------------------------------------------------------- |
| `GET /api/health`                       |           `200`, `{"status":"ok"}` | `200`, `{"status":"ok"}` | Upstream health is available through both paths.                                                            |
| `GET /api/auth/session` without cookies |   `200`, `{"authenticated":false}` |       same auth contract | No authenticated session is expected in this test.                                                          |
| `OPTIONS /api/auth/session`             | **204**, `cache-control: no-store` |    **405**, `allow: GET` | This is a proxy-specific fingerprint: Firebase Production is not directly serving the Render FastAPI route. |

The Firebase response also carries `server: Google Frontend`, while the direct upstream carries Render/Cloudflare headers. Together with the `OPTIONS` difference, this is sufficient evidence that the live `/api/**` path is going through a proxy layer. It does not expose the Cloud Run revision ID.

The frontend Firebase deploy workflow for frontend merge commit `d364846d48f2ee3f91987c9925cb0772206854ab` has a successful run: [Firebase Hosting run #35199353763](https://github.com/Smira31/Mentalix/actions/runs/35199353763). Current live HTML references `index-UAMHWDnt.js` / `index-I_fC3Wmy.css`; `Last-Modified` was `2026-09-19 09:43:45 GMT`.

## 5. No-session behavior versus cookie regression

A no-cookie request to the live production session endpoint returned:

```json
{ "authenticated": false }
```

This is an expected anonymous response, not evidence that a valid cookie was lost. The current frontend code has the following relevant behavior:

- `src/platform/web.adapter.js` calls `/api/auth/session` with `credentials: 'include'`;
- the request has a 7-second `AbortController` timeout;
- both error and normal completion reach `setAuthChecked(true)` in `App.jsx`;
- if there is no user after the check, `App.jsx` renders `WebAuthScreen` instead of leaving the user on `Splash`.

A fresh browser navigation on 2026-09-19 produced the expected anonymous WebAuthScreen on both:

- [Firebase Production — unauthenticated WebAuthScreen](../../audit-artifacts/issue-647-production-2026-09-19/live/firebase-unauth-web-auth.webp)
- [Vercel — unauthenticated WebAuthScreen](../../audit-artifacts/issue-647-production-2026-09-19/live/vercel-unauth-web-auth.webp)

Therefore the splash previously observed during the first browser capture cannot be classified as Issue #647 reproduced without auth. It was a transient/incomplete observation before the app transitioned to the anonymous auth screen. The current unauthenticated production path does **not** remain on the splash after the auth request completes.

## 6. Authenticated standalone verification

No test Telegram account, saved authenticated cookie, email test mailbox, or approved dev-login credentials are available in this session. A session must not be fabricated by manually injecting a cookie: that would not verify the real login/set-cookie path and would cross the requested evidence boundary.

As a result, the following acceptance criterion remains unverified:

> A valid session in iOS standalone opens Today and the host cookie reaches the backend through the same-site proxy.

The production checks prove the anonymous path and the live proxy routing, but not a valid-session round trip or cookie renewal after email/Telegram login.

## 7. Final status

**Issue #647 cannot be declared fully closed on Production from the available evidence.** The deployment chain is substantially confirmed:

1. PR #649 is merged;
2. PR #73 is merged into `mentalix-bot/main`;
3. Firebase Production is deployed with the `/api/**` rewrite;
4. the live rewrite reaches a proxy, as shown by the `OPTIONS 204` fingerprint;
5. Render upstream health is available;
6. anonymous users leave splash and reach WebAuthScreen.

What remains open is not a demonstrated current anonymous splash failure. It is the absence of an authenticated standalone/PWA test and the inability to inspect the Cloud Run revision / runtime SHA with configured credentials. Keep Issue #647 **open pending owner-provided authenticated iOS Safari/Home Screen verification** or equivalent deployment evidence for the valid-session path.
