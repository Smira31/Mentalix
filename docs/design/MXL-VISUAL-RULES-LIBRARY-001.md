# MXL Visual Rules Library

**Status:** `verified` baseline + `proposed` consolidation  
**Owner:** Mentalix product/design  
**Scope:** shared visual language for Telegram Mini App and web fallback  
**Last reviewed:** 2026-08-29

## Purpose

Этот документ собирает визуальные правила Mentalix в один handoff для разработчиков, дизайнеров и QA. Он не заменяет текущие CSS tokens и не превращает каждую встреченную в коде величину в обязательный design-system token.

Каждое правило имеет статус:

- `verified` — подтверждено текущим production source и может использоваться как действующий контракт;
- `proposed` — рекомендованная консолидация или правило для новых экранов, которое нужно подтвердить отдельным UI-gate;
- `deprecated` — больше не использовать в новом коде, но старые места могут требовать отдельной миграции.

## Source of truth

| Source                                                                                                     | Role                                                                   | Status                                      |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| [`src/index.css`](../../src/index.css)                                                                     | Global colors, typography roles, safe areas, CTA and motion primitives | `verified`                                  |
| [`src/lib/fullscreenSurface.js`](../../src/lib/fullscreenSurface.js)                                       | Fullscreen, Telegram controls and scroll contract                      | `verified`                                  |
| [`docs/product/MXL-HOME-TYPE-FOUNDATION-001_DESIGN.md`](../product/MXL-HOME-TYPE-FOUNDATION-001_DESIGN.md) | Home/type foundation decisions                                         | `verified` where reflected in CSS           |
| [`docs/testing/DESIGN_GUARD.md`](../testing/DESIGN_GUARD.md)                                               | Design regression expectations                                         | `verified`                                  |
| Screen-level `*.css` files                                                                                 | Local component exceptions                                             | `verified` only within their declared scope |

Правило при расхождении: сначала доверять живому token/source contract, затем canonical product/design decision, затем локальному экрану. Не создавать новый глобальный token только для исправления одного компонента.

## 1. Visual principles

| Rule                                                                   | Rationale                                                                          | Scope                     | Example                                                         | Status     |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------- | ---------- |
| Mentalix uses a quiet, warm-dark base with one restrained accent       | Reduces visual noise and keeps attention on one next action                        | All product surfaces      | Dark background, cream text, gold action cue                    | `verified` |
| The interface should feel like a calm instrument, not a game dashboard | The product helps reflection and action; decoration must not compete with the task | Today, practices, Journal | One primary CTA, limited motion                                 | `verified` |
| One screen should have one dominant action                             | Supports the action loop and prevents choice overload                              | Primary user journeys     | `Завершить`, `Дальше`, or `Войти`, not several equal CTAs       | `proposed` |
| Visual novelty must not change navigation semantics                    | Prevents decorative features from breaking Today → practice → Today                | All feature work          | Series & Badges can add a surface but must preserve action loop | `proposed` |

## 2. Color roles

Production stores color values as RGB triplets so Tailwind opacity utilities continue to work. New code should use semantic roles rather than raw hex values.

| Role                        | Current token                  |                     Value | Intended use                                | Avoid                                  | Status     |
| --------------------------- | ------------------------------ | ------------------------: | ------------------------------------------- | -------------------------------------- | ---------- |
| App background              | `--c-bg`                       |       `5 4 3` / `#050403` | Root background, quiet shell                | Large bright backgrounds               | `verified` |
| Primary card                | `--c-card`                     |       `9 9 9` / `#090909` | Main cards and selectable surfaces          | Using card as page background          | `verified` |
| Secondary surface           | `--c-card2`                    |    `17 17 17` / `#111111` | Nested or secondary cards                   | Multiple competing surface levels      | `verified` |
| Primary text                | `--c-text`                     | `243 243 243` / `#F3F3F3` | Headings, body copy with priority           | Low-opacity text for essential content | `verified` |
| Muted text                  | `--c-muted`                    | `133 133 133` / `#858585` | Supporting copy and metadata                | Long essential paragraphs              | `verified` |
| Faint text                  | `--c-faint`                    | `100 100 100` / `#646464` | Large or non-essential labels only          | Small body text and controls           | `verified` |
| Border                      | `--c-border`                   |    `41 41 41` / `#292929` | Quiet separators and card borders           | Heavy outlines everywhere              | `verified` |
| Illustration line           | `--c-line`                     | `230 230 230` / `#E6E6E6` | Primary illustration strokes                | Long text or UI chrome                 | `verified` |
| Secondary illustration line | `--c-line-secondary`           | `106 106 106` / `#6A6A6A` | Supporting illustration strokes             | Essential text                         | `verified` |
| Accent                      | `--c-gold`                     |  `237 189 96` / `#EDBD60` | Progress, selected cue, meaningful emphasis | Making every CTA gold                  | `verified` |
| Alternate accent            | `[data-accent='ice'] --c-gold` |  `94 178 237` / `#5EB2ED` | User-selected alternate accent              | Assuming gold is always active         | `verified` |
| CTA background              | `--btn-bg`                     |                 `#EDEDED` | Primary pill CTA                            | Secondary actions competing with it    | `verified` |
| CTA text                    | `--btn-text`                   |                 `#111111` | Text inside primary CTA                     | Low contrast text                      | `verified` |

### Color Do / Don’t

**Do:** use `rgb(var(--c-gold))`, `rgb(var(--c-muted))` and the other semantic tokens; keep accent usage sparse; preserve the alternate accent contract.

**Don’t:** hard-code a new near-black or gold; use `--c-faint` for small essential copy; encode meaning with color alone; introduce a light theme without a separate accessibility review.

## 3. Typography hierarchy

The primary user-facing family is **Onest**. **Manrope** is reserved for the existing label/eyebrow role, and **JetBrains Mono** is reserved for technical or code-like content. Typography roles are more important than individual utility classes.

| Role            | Token/class            | Size / line-height   |  Weight | Scope                  | Status     |
| --------------- | ---------------------- | -------------------- | ------: | ---------------------- | ---------- |
| Page title      | `.mx-type-page`        | 30px / 1             |     700 | Top-level pages        | `verified` |
| Greeting        | `.mx-type-greeting`    | 18px / 1.05          |     700 | Today orientation      | `verified` |
| Hero            | `.mx-type-hero`        | 28px / 1.12          |     800 | Dominant Today message | `verified` |
| Section         | `.mx-type-section`     | 18px / 1.2           |     600 | Section heading        | `verified` |
| Card title      | `.mx-type-card`        | 16px / 1.28          |     600 | Primary card title     | `verified` |
| Body            | `.mx-type-body`        | 14px / 1.45          |     400 | Supporting copy        | `verified` |
| Control         | `.mx-type-control`     | 16px / 1.2           |     600 | Buttons and controls   | `verified` |
| Segment         | `.mx-type-segment`     | 14px / 1.2           |     600 | Segmented controls     | `verified` |
| Meta            | `.mx-type-meta`        | 11px / 1.2           |     600 | Non-essential metadata | `verified` |
| Flow title      | `.mx-type-flow-title`  | 22px / 1.15          |     600 | Secondary flows        | `verified` |
| Flow body       | `.mx-type-flow-body`   | 13px / 1.45          |     400 | Secondary flows        | `verified` |
| Flow action     | `.mx-type-flow-action` | 14px / 1.2           |     600 | Flow CTA               | `verified` |
| Technical label | JetBrains Mono         | Existing local usage | 400–500 | Technical UI only      | `verified` |

### Typography rules

| Rule                                                                          | Rationale                                                            | Scope              | Example                                               | Status     |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------ | ----------------------------------------------------- | ---------- |
| Use one hierarchy, not many visual title styles                               | Makes screens scannable and consistent                               | New screens        | Use `.mx-type-section` instead of inventing 19px/1.25 | `verified` |
| Keep body text at or above the existing 14px baseline when it carries meaning | Protects readability on 320px Telegram viewports                     | Essential copy     | Explanatory paragraph uses `.mx-type-body`            | `verified` |
| Faint text is not a substitute for disabled state                             | Disabled controls need state and affordance, not merely low contrast | Controls           | Use disabled styling plus accessible name             | `verified` |
| Avoid decorative serif overrides                                              | Existing type consistency decisions keep Onest as user-facing family | All new product UI | No new display font without design decision           | `verified` |

## 4. Spacing and width

The codebase uses Tailwind spacing utilities in addition to global layout tokens. The following scale is the recommended shared vocabulary for new work.

| Level      | Value | Use                     | Example              | Status     |
| ---------- | ----: | ----------------------- | -------------------- | ---------- |
| `space-1`  |   4px | Icon/text micro gap     | icon and label       | `proposed` |
| `space-2`  |   8px | Tight stack             | label to helper      | `verified` |
| `space-3`  |  12px | Compact stack           | metadata spacing     | `verified` |
| `space-4`  |  16px | Default component gap   | card internals       | `verified` |
| `space-5`  |  20px | Section breathing room  | heading to content   | `verified` |
| `space-6`  |  24px | Major component gap     | card to card         | `verified` |
| `space-8`  |  32px | Page section separation | Today blocks         | `verified` |
| `space-10` |  40px | Hero/CTA separation     | onboarding intro     | `verified` |
| `space-12` |  48px | Large page rhythm       | sparse landing state | `proposed` |

### Width and safe-area rules

| Rule                                                               | Rationale                                                              | Scope                    | Example                                  | Status     |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------ | ---------------------------------------- | ---------- |
| Root content must not create horizontal page scroll                | Telegram Mini App must remain stable under touch                       | All screens              | `html/body/#root { overflow-x: hidden }` | `verified` |
| Use `min-width: 320px` as the minimum supported viewport           | Existing production base and Telegram device reality                   | All screens              | Test at 320px and 390px                  | `verified` |
| Use the fullscreen surface contract for modal/fullscreen flows     | Telegram controls and safe areas require one shared layout calculation | Fullscreen screens       | `useFullscreenSurface()`                 | `verified` |
| Respect `--app-safe-top` and `--app-safe-bottom`                   | Prevents content under notch/system controls                           | Telegram/iPhone          | `padding-bottom: var(--app-safe-bottom)` | `verified` |
| Prefer `w-full max-w-md` with horizontal padding for focused flows | Keeps reading measure narrow without clipping                          | Onboarding and practices | `max-w-md px-6`                          | `verified` |
| Do not fix overflow by hiding content                              | Hiding text creates inaccessible or incomplete flows                   | All screens              | Fix layout or allow local scroll         | `verified` |

## 5. Radius and surfaces

The codebase currently uses several rounded values. These are grouped by semantic purpose rather than forced into a premature token migration.

| Role               | Current pattern          | Use                         | Example                  | Status     |
| ------------------ | ------------------------ | --------------------------- | ------------------------ | ---------- |
| Pill               | `999px`                  | Primary CTA, compact status | `.cta-pill`              | `verified` |
| Small control      | `16px–18px`              | Chips and compact controls  | local component          | `proposed` |
| Card               | `22px–24px`              | Standard interactive cards  | practice option          | `verified` |
| Large card         | `28px–30px`              | Hero/feature surface        | Today or visual card     | `verified` |
| Fullscreen surface | `0` or container-defined | Screen shell                | `FULLSCREEN_SHELL_CLASS` | `verified` |

**Rule:** radius communicates hierarchy. Do not use a 30px radius on every nested element; nested surfaces should be visibly quieter than the parent.

## 6. Buttons and interaction states

Every interactive button needs a visible state, a semantic name and a real hit target. The existing `.cta-pill` is the primary CTA primitive.

| State         | Visual behavior                                                 | Accessibility requirement                             | Example          | Status     |
| ------------- | --------------------------------------------------------------- | ----------------------------------------------------- | ---------------- | ---------- |
| Default       | High-contrast primary action or quiet outlined/filled secondary | Visible name and keyboard focus                       | `Дальше`         | `verified` |
| Pressed       | Existing scale/contrast response                                | Must not be the only state signal                     | `:active` on CTA | `verified` |
| Focus-visible | Clear non-color-only focus indicator                            | Keyboard and switch navigation                        | `:focus-visible` | `proposed` |
| Disabled      | Reduced emphasis, no action                                     | `disabled`, not only opacity; explain why when needed | `Собираю...`     | `verified` |
| Loading       | Stable layout and explicit progress copy                        | Prevent duplicate submissions                         | `Сохраняю...`    | `proposed` |
| Error         | Action remains recoverable                                      | State announced and retry available                   | `Повторить`      | `proposed` |

### Button Do / Don’t

**Do:** use `type="button"` unless submitting a form; use `aria-pressed` for toggle choices; use `aria-label` when an icon has no visible text; preserve button dimensions during loading.

**Don’t:** use a clickable `div`; rely only on color; create multiple equally dominant primary buttons; disable a control without communicating the reason.

## 7. Card states

Cards are containers for a decision or a meaningful piece of information, not decorative boxes.

| State     | Required treatment                                         | Example                          | Status     |
| --------- | ---------------------------------------------------------- | -------------------------------- | ---------- |
| Default   | Quiet surface, readable title and supporting copy          | Practice card                    | `verified` |
| Selected  | Clear surface/contrast change plus semantic selected state | Focus option with `aria-pressed` | `verified` |
| Pressed   | Short physical response without layout shift               | `transform: scale(...)`          | `verified` |
| Completed | Show outcome or next step, not only a check icon           | Completed plan card              | `proposed` |
| Locked    | Explain what is unavailable and why                        | Future milestone                 | `proposed` |
| Empty     | Explain absence and offer one next action                  | No history                       | `proposed` |
| Error     | Preserve retry and avoid dead end                          | Failed load                      | `proposed` |

## 8. Focus, disabled and error states

| Rule                                                             | Rationale                                              | Scope                        | Example                                   | Status     |
| ---------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------- | ----------------------------------------- | ---------- |
| Every keyboard-focusable control needs a visible focus treatment | Accessibility must survive keyboard and external input | All controls                 | `:focus-visible` ring using border/accent | `proposed` |
| Do not represent disabled solely with `opacity: 0.3`             | Users need to distinguish unavailable from forgotten   | Buttons and options          | Disabled CTA plus explanatory copy        | `proposed` |
| Errors must preserve the user’s input when possible              | Prevents repeated emotional effort                     | Forms and practices          | Retry after API error                     | `proposed` |
| Error copy must be calm, specific and actionable                 | Mental wellness context makes blameful copy harmful    | All error surfaces           | `Не получилось сохранить. Повторить`      | `proposed` |
| Avoid diagnostic or treatment language                           | Protects trust and safety                              | Practices, paywall, insights | Descriptive state, not diagnosis          | `verified` |

## 9. Motion principles

Motion should explain state change and preserve calm. Existing production motion uses short transitions, cubic-bezier easing and a reduced-motion override.

| Rule                                                                | Rationale                            | Scope                   | Example                        | Status     |
| ------------------------------------------------------------------- | ------------------------------------ | ----------------------- | ------------------------------ | ---------- |
| Motion should confirm an action or reveal hierarchy                 | Animation must carry information     | New interactions        | Card reveals after selection   | `verified` |
| Default motion should be short and interruptible                    | Keeps controls responsive            | Buttons and cards       | 140–280ms existing patterns    | `verified` |
| Every non-essential animation must respect `prefers-reduced-motion` | Accessibility and motion sensitivity | All CSS animations      | Existing onboarding override   | `verified` |
| Avoid continuous decorative motion on task screens                  | Protects attention and battery       | Today, practices, forms | No looping background motion   | `proposed` |
| Never use motion as the only completion signal                      | Users may disable motion or miss it  | Completion states       | Pair animation with text/state | `proposed` |

## 10. Do / Don’t examples

| Do                                                         | Don’t                                         | Why                                     |
| ---------------------------------------------------------- | --------------------------------------------- | --------------------------------------- |
| Use `rgb(var(--c-muted))` for supporting copy              | Add a new gray directly in a screen CSS file  | Keeps contrast and theming coherent     |
| Keep one clear CTA per step                                | Put two bright pills side by side             | Preserves action focus                  |
| Use `aria-pressed` on selectable cards                     | Make selected state visual-only               | Makes state available to assistive tech |
| Use `useFullscreenSurface()` for Telegram fullscreen flows | Recreate safe-area math per screen            | Prevents iPhone/Telegram regressions    |
| Use a quiet dark card with a thin border                   | Stack multiple heavy shadows and outlines     | Keeps the surface calm                  |
| Label an error with recovery action                        | Show an error toast that disappears           | Keeps the user in control               |
| Mark a hypothesis `proposed`                               | Present a suggestion as a production contract | Protects implementation decisions       |

## 11. Review checklist for new UI

Before opening a PR that changes UI, the author should answer:

1. Which existing token or role is being reused?
2. Is the rule `verified`, `proposed` or `deprecated`?
3. What is the primary user action on this screen?
4. Does the 320px viewport remain usable without horizontal overflow?
5. Are Telegram safe areas and fullscreen controls preserved?
6. Does every interactive element have a semantic state and keyboard focus?
7. What happens on loading, disabled, empty and error states?
8. Does reduced motion preserve the meaning of the interaction?
9. Are any claims diagnostic, therapeutic or otherwise unsafe?
10. What manual gate is needed on a real iPhone inside Telegram?

## Unresolved design decisions

These decisions intentionally remain `proposed` until a product/design review:

- whether the spacing scale should become CSS variables rather than a documented Tailwind vocabulary;
- whether focus-visible styling should become a single global primitive;
- whether card states need shared React primitives or remain screen-local;
- whether 16px–18px should be formalized as a small-control radius token;
- whether a future light theme is in product scope;
- which visual rules should be enforced automatically by a design guard.

## References

1. [`src/index.css`](../../src/index.css) — production global tokens, typography, CTA, safe areas and motion.
2. [`src/lib/fullscreenSurface.js`](../../src/lib/fullscreenSurface.js) — fullscreen and Telegram safe-area contract.
3. [`docs/product/MXL-HOME-TYPE-FOUNDATION-001_DESIGN.md`](../product/MXL-HOME-TYPE-FOUNDATION-001_DESIGN.md) — home/type foundation.
4. [`docs/testing/DESIGN_GUARD.md`](../testing/DESIGN_GUARD.md) — design regression guard.
5. [`src/screens/Onboarding.css`](../../src/screens/Onboarding.css) — onboarding interaction, responsive and reduced-motion examples.
6. [`src/screens/Today.css`](../../src/screens/Today.css) — Today surface and layout examples.
7. [`src/screens/FinishFlow.css`](../../src/screens/FinishFlow.css) — practice feedback state examples.
