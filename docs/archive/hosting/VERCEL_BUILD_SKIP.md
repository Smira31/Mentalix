# Vercel build skip policy (historical)

> Archived 16.09.2026. Vercel Git integration is disabled; this policy no longer controls Demo Preview or Production builds.

Vercel ran `node scripts/vercel-ignore-build.mjs` as the `ignoreCommand` before a deployment build. The script compared `VERCEL_GIT_PREVIOUS_SHA` with `VERCEL_GIT_COMMIT_SHA` and used the exit status expected by Vercel: **0 skipped the deployment**, while **1 continued with the build**.

A deployment was skipped only when every changed path was clearly outside the frontend bundle:

- `docs/**`;
- `.github/**`;
- `.claude/**`, `audit-artifacts/**`, and `qa-evidence/**`, which are repository process or evidence files;
- a Markdown file at the repository root, such as `README.md` or another root-level `*.md` file.

The rule was deliberately conservative. It continued the build for source, public assets, package manifests, lockfiles, configuration, and any path not explicitly listed above. `vercel.json` was always treated as build-relevant. Markdown files below source or other nested application directories were also treated as build-relevant because they could be imported into the bundle.

If either SHA was missing, the repository could not be diffed, or the diff failed, the script returned 1 so that a potentially necessary deployment was not suppressed. An empty diff also returned 1 because there was no safe changed-file classification to make.

## Dependabot branches

Dependabot branches were not skipped by branch name. A dependency update could change the installed dependency graph even when the visible diff looked small, so disabling its preview deployment would have been unsafe.

## Historical verification

The script could be tested locally by supplying two commit SHAs from the repository. A documentation-only comparison had to return 0, while a comparison containing a source, asset, manifest, lockfile, or `vercel.json` change had to return 1.
