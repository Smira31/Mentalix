# MXL-010 Preview access evidence

- Repository: `Smira31/Mentalix`
- Preview under test: PR #312 `feat: clarify direct web auth fallback`
- Preview URL: `https://mentalix-git-feat-web-auth-fa-48eb49-smiraandre2-8311s-projects.vercel.app`
- Browser result: redirect to `https://vercel.com/login?...` rather than the Mentalix app.
- Classification: **BLOCKED / environment-access**, not a frontend behavior PASS or FAIL. The Preview deployment is reported by GitHub/Vercel metadata, but this sandbox browser is not authenticated to Vercel and the app cannot be exercised from this session.
- No credentials, private data, or login attempts were entered.
- Screenshot captured by browser session: `/home/ubuntu/screenshots/vercel_2026-08-29_11-30-30_8669.webp`.

This does not prove that the deployment itself is broken; it proves only that runtime verification was unavailable from the current browser session.
