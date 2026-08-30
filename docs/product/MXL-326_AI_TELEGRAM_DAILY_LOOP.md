# MXL-326 — AI Telegram daily loop

## Proposed loop

| Moment | User intent | Bot message | Mini App destination | Return signal |
| --- | --- | --- | --- | --- |
| Morning | orient | one short state prompt | Today/check-in | one next action |
| After action | reflect | acknowledge result | existing practice or Journal | completion state |
| Evening | review | one observation question | review surface | save/skip |
| Next day | return | contextual reminder only if opted in | exact unfinished state | stop/snooze |

The bot must send one contextual prompt, not a generic content stream. A deep link carries only a non-sensitive route and opaque reference; it never carries raw journal text, diagnosis, or auth payload. The Mini App validates the authenticated user and treats stale or unknown references as a safe Today fallback.

## Safety and consent

Notifications are opt-in, rate-limited and cancellable. AI output is framed as observation or hypothesis, never diagnosis or crisis care. No cross-session memory, new endpoint, or automatic persona change is part of this brief. A crisis signal exits the ordinary loop and uses the separate safety route.

## Evaluation

Measure delivery success, deep-link destination correctness, action completion, opt-out rate and perceived usefulness. Do not optimize message count or time in app.
