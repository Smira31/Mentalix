# MXL-AI-TELEGRAM-LOOP-001 — daily cycle specification

## Status

**Research / owner decision required / manual gate pending.** This document turns the existing product hypothesis into a bounded evaluation contract. It does not authorize a scheduler, a new backend API, changes to production AI personas, or automatic notifications.

## Product boundary

The daily loop is successful when a user completes one small, reversible action and can return to the Mini App for reflection. Telegram is the short-entry and handoff surface; substantive dialogue, Journal, history, and sensitive data remain in the Mini App. The system must not optimize for chat time, message count, or dependency.

## Role and cadence contract

| Role | Trigger | Cadence | Entry question / buttons | Allowed result | Handoff | Completion |
|---|---|---|---|---|---|---|
| **Ясность** | User opts in in the morning or asks for help when disoriented | At most one morning contact; on-demand only when requested | “Что сейчас заметнее всего?” / `Состояние`, `Главная задача`, `Пока не знаю` | One observation separated from interpretation and one focus | `action=checkin` to Today → Check-in | User chooses one focus or skips |
| **Компас** | User explicitly asks for help choosing | No automatic daily message | “Между какими 2–3 вариантами ты выбираешь?” | A comparison against the user’s stated values, not a personality verdict | `action=checkin` or a future explicitly approved choice handoff | User selects a direction or defers |
| **Шаг** | User opts in in the evening or asks for a next step after choosing | At most one evening contact | “Что получилось проверить?” / `Получилось`, `Частично`, `Не получилось`, `Не пробовал` | Fact → learning → one next reversible experiment | `action=evening` to Today → Check-in; Journal remains available | Evening review saved or explicitly skipped |

Every contact must offer close, skip, mute, and opt-out. Empty states must be explicit: no answer, no selected focus, no completed action, and no evening review are valid states, not failures.

## Notification and consent rules

Notifications are **opt-in**, have user-configurable quiet hours, and are capped at one morning and one evening contact per local day. A user can mute all reminders or one role without losing saved data. A skipped contact must not be retried in the same cadence window. Consent, quiet hours, mute state, and opt-out must be persisted by an approved backend contract before scheduling is implemented.

No hidden memory, inferred diagnosis, sensitive journal text, or Telegram user data may be placed in a notification. Crisis signals require a separate safety flow and local live-help guidance; the daily loop must not attempt crisis intervention through ordinary role copy.

## Evaluation plan

| Event | Definition | Primary question |
|---|---|---|
| `daily_loop_contact_opted_in` | User explicitly enables a role contact | Is consent clear and reversible? |
| `checkin_completed` | Today check-in is saved successfully | Does the handoff produce a useful first action? |
| `handoff_today_opened` | Contextual link opens the intended Today state | Does Telegram reduce entry friction without losing context? |
| `next_action_completed` | User records the result of the chosen experiment | Is success a completed action rather than chat engagement? |
| `evening_review_completed` | Evening result is saved | Does the loop close with reflection? |
| `return_next_day` / `return_d7` | User returns on the next day / within seven days | Is the loop repeatable without pressure? |
| `reminder_muted` / `opted_out` | User mutes or disables contacts | Can the user leave without friction or shame? |
| `safety_incident` | Safety flow is invoked or a risky output is reported | Are ordinary role prompts safely bounded? |

Evaluation should report denominators, not only completion rates: eligible opt-ins, delivered contacts, opens, skips, handoffs, successful saves, and exits. Do not use time-in-chat or message count as the success metric.

## Decision gate

The owner must decide whether the first prototype is limited to **Ясность утром + Шаг вечером**, with no automatic Компас. Until that decision and a backend consent/scheduler contract exist, implementation remains out of scope.

## Evidence still required

- Content and safety review of the role copy and crisis boundaries.
- Real Telegram/iPhone gate for morning, evening, close, skip, mute, deep-link handoff, and recovery.
- Confirmed backend contract for consent, quiet hours, deduplication, and opt-out before any scheduler work.

## Dependencies

- #323 — role naming and role contract.
- #121 — contextual deep-link handoff.
- #123 — Telegram return flows.
- #124 — competitive review.
- #291 — UX/audit evidence.
- #292 — Practices and Trends decisions.

## Rollback

This is a documentation-only research artifact. Remove this file and its `CHANGES.md` entry if the owner rejects the hypothesis; no production behavior is changed by this PR.
