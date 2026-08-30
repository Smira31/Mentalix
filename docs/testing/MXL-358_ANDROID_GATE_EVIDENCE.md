# MXL-358 — Android gate evidence form

Этот документ готовит ручной Android gate, но не подменяет реальное устройство. Проверка выполняется на свежем Android/Telegram build с synthetic account data.

| Area | Evidence to capture | Pass condition |
| --- | --- | --- |
| entry | bot launch and Mini App start | no broken deep link or blank shell |
| theme | light and dark screenshots | text and controls remain legible |
| keyboard | focused editor with keyboard open | editor and primary action remain reachable |
| back | Android back gesture/button recording | predictable return; no data loss |
| persistence | save, reload, reopen | saved state is present or clear fallback shown |
| network | offline/slow transition | loading/error state is actionable |

Record device model, Android version, Telegram version, orientation and build commit. Do not use real journal or health content. The issue remains open until a device operator attaches evidence and signs the gate.
