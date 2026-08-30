# MXL-98 — Mentalix visual card library

The library stores approved card assets and their design metadata. Each record includes `card_id`, version, source asset path, semantic purpose, aspect ratio, light/dark treatment, alt text, safe-area notes, usage context and approval status.

| Rule | Requirement |
| --- | --- |
| source of truth | one approved asset path; no untracked copies in feature folders |
| versions | immutable version names and a changelog |
| accessibility | meaningful alt text or documented decorative role |
| theme | light/dark contrast checked before approval |
| generation | prompt/reference provenance and rights note recorded |
| deprecation | old card remains traceable and is not reused accidentally |

The library must not become a visual catalogue that competes with the one-action hierarchy. A card is approved only when it supports a known surface and has an owner/reviewer; placeholder or AI-generated images remain clearly marked until reviewed.
