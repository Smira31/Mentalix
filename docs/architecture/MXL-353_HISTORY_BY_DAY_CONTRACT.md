# MXL-353 — History-by-day contract for Journal tags

Теги зависят от общего Journal history backend. Этот документ фиксирует минимальный контракт, не реализуя endpoint и не меняя frontend до снятия backend blocker.

## Read contract

`GET /journal/history?from=YYYY-MM-DD&to=YYYY-MM-DD&timezone=IANA` возвращает `{ days: [{ date, entries }] }`. `date` — calendar date в переданной timezone; `entries` — стабильные entry ids, timestamps, normalized text metadata and tags when available. The response includes `schema_version` and a pagination cursor if the range is large.

| Rule | Requirement |
| --- | --- |
| Auth | server derives user identity from verified Telegram init data; client user ids are not trusted |
| Range | bounded inclusive range; reject invalid or excessive windows |
| Privacy | default response excludes raw text unless explicitly authorized by existing contract |
| Idempotency | repeated reads return stable ids and ordering for the same version |
| Errors | typed 400/401/403/429/5xx mapping without leaking entry contents |
| Tag readiness | tags are nullable until write/read contract is implemented |

## Dependency gate

Before frontend tags work, backend must approve timezone semantics, retention, authorization, rate limits, deletion behavior and sample response fixtures. Until then, no tag UI, optimistic persistence or client-side history reconstruction is introduced.
