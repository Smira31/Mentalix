# Mentalix visual card library

This index is the source of truth for approved visual-card assets and their metadata. It does not invent final artwork: a record may describe an owned implementation pattern or remain `placeholder` until a real asset, provenance and accessibility review exist.

## Card record contract

Every record names `card_id`, immutable version, source asset path or implementation surface, semantic purpose, aspect ratio, theme treatment, alt text or decorative role, safe-area note, usage context, provenance/rights note and approval status. A card is not approved merely because it looks attractive; it must support a known Mentalix surface without competing with the primary action.

| Card ID                         | Version | Source / surface                         | Purpose                                                          | Ratio / theme                      | Accessibility                                                             | Safe-area note                                         | Rights / provenance                                                  | Status                          |
| ------------------------------- | ------- | ---------------------------------------- | ---------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------- |
| `MX-CARD-TODAY-HERO-001`        | `1.0.0` | `src/screens/Today.jsx` hero surface     | Give Today one calm visual anchor around the next action         | responsive portrait; dark atelier  | Decorative background; all meaning remains in text and CTA                | Keep CTA and text inside content safe area             | Owned implementation; no external asset                              | approved implementation pattern |
| `MX-CARD-PRACTICE-001`          | `1.0.0` | `src/components/practices` scene surface | Support one practice without adding a second goal                | responsive portrait; dark/ink      | Decorative illustration unless an explicit alt description is added       | Do not place key visual meaning under fixed navigation | Owned implementation pattern; provenance required for future artwork | approved implementation pattern |
| `MX-CARD-JOURNAL-QUIET-001`     | `1.0.0` | Journal intro and empty states           | Create enough quiet space for writing and reflection             | responsive portrait; dark atelier  | Decorative; prompt and controls carry meaning                             | Preserve keyboard focus and bottom safe area           | Owned layout pattern; no external asset                              | approved implementation pattern |
| `MX-CARD-PARCHMENT-PREVIEW-001` | `1.0.0` | `?light-preview=1` surfaces in PR #441   | Test warm parchment hierarchy without changing production        | responsive portrait; light preview | Decorative surface; contrast must be checked for every foreground element | Same safe-area contract as dark theme                  | Owned CSS preview; no redistributed asset                            | preview-only                    |
| `MX-CARD-EMPTY-STATE-001`       | `1.0.0` | Empty Today/Practices states             | Make the first available action visible when there is no content | responsive; theme-aware            | Any illustration is secondary to a text label and actionable control      | Never put the only CTA behind a cropped image          | Asset pending; use neutral owned placeholder until reviewed          | placeholder                     |
| `MX-CARD-WEEKLY-REFLECTION-001` | `0.1.0` | Journal / review concept                 | Offer a gentle weekly reflection entry point                     | responsive portrait; theme-aware   | Requires meaningful alt text after artwork exists                         | Must not overlap fixed nav or keyboard                 | No asset yet; concept only                                           | proposed                        |

## Approved style rules

Mentalix cards use generous negative space, a restrained palette, clear hierarchy and a single semantic accent. Dark surfaces may anchor a hero; light preview surfaces use warm parchment and ink contrast. Gold is reserved for meaningful emphasis, not repeated decoration. No card may imply diagnosis, surveillance, guaranteed transformation or a real person's identity.

The one-action hierarchy wins over visual density. If a card competes with the Today hero or makes a user choose between several equally loud actions, it is not ready for approval. Cards must remain understandable without animation and must work at narrow mobile widths and with enlarged text.

## Asset approval workflow

1. Add a record with a unique ID and immutable version.
2. Attach the owned asset path or explicitly mark the record `placeholder`/`proposed`.
3. Record prompt/reference provenance, model if generated, rights note and capture date.
4. Add alt text or mark the asset decorative with a reason.
5. Check dark/light contrast, safe areas, responsive crop and reduced-motion behavior.
6. Name the intended surface and rejected uses.
7. Obtain review before moving a record to `approved`.

Deprecated assets remain traceable with a reason and must not be silently reused. External references belong in the reference library; they do not become Mentalix assets through a screenshot or copied prompt.
