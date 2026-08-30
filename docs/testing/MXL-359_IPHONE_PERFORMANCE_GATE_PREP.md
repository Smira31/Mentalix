# MXL-359 — iPhone performance gate preparation

Реальный iPhone отсутствует в автономной среде, поэтому этот PR не заявляет, что manual gate пройден. Он подготавливает воспроизводимый evidence form для владельца.

| Check | Device evidence | Pass rule |
| --- | --- | --- |
| launch | model, iOS, Telegram version, cold-start recording | no blank/frozen state; ready screen is visible |
| Journal editor | viewport, keyboard, scroll recording | input remains visible; CTA is not covered |
| Today/Practice | screen capture at 320/390/430 logical widths | no clipped text, overflow or unusable tap target |
| completion | screen capture and elapsed time | save/complete has visible confirmation |
| return | bot/Mini App route and timestamp | return opens intended context |

The operator must record only synthetic or non-sensitive test content, attach before/after evidence and note orientation, network and reduced-motion settings. A failed check is documented with reproduction steps rather than hidden. The actual gate remains a manual owner action.
