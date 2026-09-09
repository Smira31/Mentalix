# Mentalix — активный task index

Статус индекса: каноническое представление **активного product backlog** на 09.09.2026 (после owner PASS и merge production PR #555). Исторический шум и closed maintenance вынесены; подробные handoff — в связанных GitHub Issue/PR и при необходимости в [`TASKS.md`](../TASKS.md).

## Как читать индекс

`autonomous` можно выполнять без нового продуктового решения при соблюдении обычного PR-цикла. `needs-owner` требует решения владельца. `manual-gate` не закрывается без проверки на реальном устройстве. `backend-dependent` нельзя реализовывать без приватного контракта.

## Каноническая продуктовая очередь (после cleanup)

| Порядок | Issue                                                  | ID / title                           | Примечание                                                                                                              |
| ------: | ------------------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
|       1 | [#527](https://github.com/Smira31/Mentalix/issues/527) | MXL-PROGRESS-UX-001 — tab «Прогресс» | **Выбран Вариант A:** «Один главный вывод»; следующий шаг — UI Lab candidate и Compare на существующем `/api/analytics` |

**Последний completed gate (09.09.2026):** [#547](https://github.com/Smira31/Mentalix/issues/547) via [PR #553](https://github.com/Smira31/Mentalix/pull/553) — owner QA PASS, production SHA `27b78f725a38b68e046a7b6466157125fbb9f767`.

**Deferred Issues (не в execution queue):** #514 (NAV-IA), #515 (DIALOG), #516 (ILLUSTRATION-SYSTEM), #480 (AI-HANDOFF).

**Active work:** #527 / `MXL-PROGRESS-UX-001`; #526 закрыта через PR #555. Для #527 выбран Вариант A — «Один главный вывод»: одна описательная карточка наблюдения, период, sample/source/caveat и честные loading/error/empty states; следующий gate — UI Lab/Compare.

## PARKED / NOT SCHEDULED

Не текущая execution queue. Задачи без отдельной GitHub Issue и без owner-решения об отмене — сохранены, чтобы не потерять backlog. **Не создавать Issues сейчас.** Не поднимать в каноническую очередь без явного решения владельца.

| ID                            | Тип                     | Автономность                    | Следующий шаг (когда разморозят)                      |
| ----------------------------- | ----------------------- | ------------------------------- | ----------------------------------------------------- |
| `MXL-JOURNAL-HISTORY-001`     | product/backend/UX      | backend-dependent               | Объединить датированную историю после persistence     |
| `MXL-JOURNAL-PRIVACY-001`     | product/safety/backend  | needs-owner + backend-dependent | AI consent, retention, export, delete                 |
| `MXL-JOURNAL-PERSONALIZE-001` | product/UX              | needs-owner                     | Cadence и режим prompt/free write/AI                  |
| `MXL-JOURNAL-GUIDED-001`      | product/content         | needs-owner                     | Guided tracks после стабилизации core journal         |
| `MXL-JOURNAL-ORGANIZE-001`    | product/backend/UX      | backend-dependent               | Tags, search, favorites после schema decision         |
| `MXL-JOURNAL-MEMORIES-001`    | product/privacy/backend | backend-dependent               | Media attachments только после privacy/storage review |
| `MXL-JOURNAL-REMINDERS-001`   | product/backend         | needs-owner + backend-dependent | Quiet hours, consent, scheduler contract              |

Прочие historically completed / closed (MXL-001…, practice-flow #513 via #520, catalog v2, Meditation #521 via #529) — в [`TASKS.md`](../TASKS.md) / archive, не здесь.

## Автономная очередь

Сейчас очередь `autonomous` пуста. Новая автономная задача появляется только через явную запись с однозначным scope.

## Product decision register (кратко)

| Тема            | Состояние                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Навигация       | Пять основных разделов; Today — главный вход                                                                                                          |
| Акцент          | Gold ↔ Azure (см. DESIGN_SYSTEM.md)                                                                                                                   |
| AI-персоны      | Тон и набор зафиксированы                                                                                                                             |
| Оплата          | Отложена                                                                                                                                              |
| Backend/API     | Приватный `mentalix-bot`                                                                                                                              |
| Telegram/iPhone | Основной manual gate                                                                                                                                  |
| Preview         | Owner QA только `https://mentalix-preview.vercel.app`; feature QA проходит через promote exact deployment и Vercel-side alias provenance verification |

## Canonical Preview QA gate

Для feature QA действует последовательность: feature branch → deployment в Vercel project `mentalix-preview` → promote exact deployment нужного SHA в `mentalix-preview` → canonical alias `https://mentalix-preview.vercel.app` → Vercel-side verify alias provenance → Telegram owner QA → iPhone/browser → Telegram `web_app` → owner PASS → merge. Branch URL и deployment URL не являются owner QA URL; владельцу передаётся только canonical alias с разрешённым path/query. Production project `mentalix` для feature QA не используется. Без Vercel API/token GitHub workflow не может доказать alias→SHA автоматически: `Telegram Preview` принимает только явное `provenance_verified=true` как precondition после ручной Vercel-side проверки, не использует GitHub Deployments как proof и fail-closed при отсутствии этой precondition.

## Definition of Ready / Done

**Ready:** однозначная цель, текущее/ожидаемое поведение, scope, «не меняется», критерии, проверки, rollback, автономность.

**Done:** согласованный scope, зелёные проверки, отдельный PR с evidence, пройденный manual gate (если нужен). `docs/TASK_INDEX.md` — активный backlog; `PROJECT_STATE.md` — только подтверждённые release/production факты.
