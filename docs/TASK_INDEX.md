# Mentalix — активный task index

Статус индекса: каноническое представление **активного product backlog** на 07.09.2026 (после MXL-PROJECT-CANON-001). Исторический шум и closed maintenance вынесены; подробные handoff — в связанных GitHub Issue/PR и при необходимости в [`TASKS.md`](../TASKS.md).

## Как читать индекс

`autonomous` можно выполнять без нового продуктового решения при соблюдении обычного PR-цикла. `needs-owner` требует решения владельца. `manual-gate` не закрывается без проверки на реальном устройстве. `backend-dependent` нельзя реализовывать без приватного контракта.

## Каноническая продуктовая очередь (после cleanup)

| Порядок | Issue | ID / title | Примечание |
| ------: | ----- | ---------- | ---------- |
| 1 | [#521](https://github.com/Smira31/Mentalix/issues/521) | MXL-MEDITATION-UX-001 — привести Meditation к единой grammar Practices | Следующая feature; PR #529 уже открыт |
| 2 | [#510](https://github.com/Smira31/Mentalix/issues/510) / [#522](https://github.com/Smira31/Mentalix/issues/522) | Редизайн дневника / MXL-SELF-DISCOVERY-UX-002 | После Meditation |
| 3 | [#523](https://github.com/Smira31/Mentalix/issues/523) | MXL-LILA-UX-001 — Lila Discover → Practices system | |
| 4 | [#524](https://github.com/Smira31/Mentalix/issues/524) | MXL-RITUALS-ASCEZAS-UX-001 — Rituals и Ascezas | |
| 5 | [#525](https://github.com/Smira31/Mentalix/issues/525) | MXL-PRACTICES-CATALOG-POLISH-001 — финальная сборка каталога | |
| 6 | [#526](https://github.com/Smira31/Mentalix/issues/526) | MXL-LIBRARY-UX-001 — продуктовый редизайн Библиотеки | |
| 7 | [#527](https://github.com/Smira31/Mentalix/issues/527) | MXL-PROGRESS-UX-001 — tab «Прогресс» | PARKED ref на PR #502 head `3490406c…` |

**Deferred Issues (не в execution queue):** #514 (NAV-IA), #515 (DIALOG), #516 (ILLUSTRATION-SYSTEM), #480 (AI-HANDOFF).

**Active open PR:** только [#529](https://github.com/Smira31/Mentalix/pull/529) (`feat/meditation-guided-grammar`).

## PARKED / NOT SCHEDULED

Не текущая execution queue. Задачи без отдельной GitHub Issue и без owner-решения об отмене — сохранены, чтобы не потерять backlog. **Не создавать Issues сейчас.** Не поднимать в каноническую очередь без явного решения владельца.

| ID | Тип | Автономность | Следующий шаг (когда разморозят) |
| -- | --- | ------------ | -------------------------------- |
| `MXL-JOURNAL-HISTORY-001` | product/backend/UX | backend-dependent | Объединить датированную историю после persistence |
| `MXL-JOURNAL-PRIVACY-001` | product/safety/backend | needs-owner + backend-dependent | AI consent, retention, export, delete |
| `MXL-JOURNAL-PERSONALIZE-001` | product/UX | needs-owner | Cadence и режим prompt/free write/AI |
| `MXL-JOURNAL-GUIDED-001` | product/content | needs-owner | Guided tracks после стабилизации core journal |
| `MXL-JOURNAL-ORGANIZE-001` | product/backend/UX | backend-dependent | Tags, search, favorites после schema decision |
| `MXL-JOURNAL-MEMORIES-001` | product/privacy/backend | backend-dependent | Media attachments только после privacy/storage review |
| `MXL-JOURNAL-REMINDERS-001` | product/backend | needs-owner + backend-dependent | Quiet hours, consent, scheduler contract |

Прочие historically completed / closed (MXL-001…, practice-flow #513 via #520, catalog v2) — в [`TASKS.md`](../TASKS.md) / archive, не здесь.

## Автономная очередь

Сейчас очередь `autonomous` пуста. Новая автономная задача появляется только через явную запись с однозначным scope.

## Product decision register (кратко)

| Тема | Состояние |
| ---- | --------- |
| Навигация | Пять основных разделов; Today — главный вход |
| Акцент | Gold ↔ Azure (см. DESIGN_SYSTEM.md) |
| AI-персоны | Тон и набор зафиксированы |
| Оплата | Отложена |
| Backend/API | Приватный `mentalix-bot` |
| Telegram/iPhone | Основной manual gate |
| Preview | Owner QA только `https://mentalix-preview.vercel.app` |

## Definition of Ready / Done

**Ready:** однозначная цель, текущее/ожидаемое поведение, scope, «не меняется», критерии, проверки, rollback, автономность.

**Done:** согласованный scope, зелёные проверки, отдельный PR с evidence, пройденный manual gate (если нужен). `docs/TASK_INDEX.md` — активный backlog; `PROJECT_STATE.md` — только подтверждённые release/production факты.
