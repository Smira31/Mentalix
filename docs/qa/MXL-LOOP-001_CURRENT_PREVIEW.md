# MXL-LOOP-001 Current Preview Verification

This document exists to produce a fresh Vercel Preview from the current `main` revision after the completion-navigation fix.

## Manual gate

For each problem-led practice, verify:

`Today → Practices → open practice → complete → Today`

Also verify:

- Back during a practice returns to Practices.
- Early cancellation does not invoke completion and does not return to Today.
- Completion invokes the Today handoff exactly once.

The preview must be opened through the Mentalix Telegram Mini App button for Telegram-authenticated testing.

## Source of truth

The preview branch is based on the latest `main` and contains no product-code changes beyond the already merged completion-navigation fix.

## Owner action

After the Vercel deployment is Ready, perform the manual Telegram/iPhone gate and record the result in the associated pull request.

<!-- preview-marker: 2026-08-28 -->

> This is a temporary QA marker and may be removed after the manual gate is accepted.
