# Mentalix — активный task index

Статус индекса: каноническое представление **активного product backlog и открытых PR** на 11.09.2026 (после независимой сверки `origin/main` `b099dfe7`). Исторический шум и closed maintenance вынесены; подробные handoff — в связанных GitHub Issue/PR и при необходимости в [`TASKS.md`](../TASKS.md).

## Как читать индекс

`autonomous` можно выполнять без нового продуктового решения при соблюдении обычного PR-цикла. `needs-owner` требует решения владельца. `manual-gate` не закрывается без проверки на реальном устройстве. `backend-dependent` нельзя реализовывать без приватного контракта.

## Каноническая продуктовая очередь (после cleanup)

| Порядок | Issue                                                  | ID / title                | Примечание                                                                                   |
| ------: | ------------------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
|       1 | [#563](https://github.com/Smira31/Mentalix/issues/563) | MXL-PROGRESS-REDESIGN-001 | Production promotion одобренной композиции «Прогресс» (часть уже в `main` через #566/#569/#571/#572; флаг `VITE_PROGRESS_LAYOUT_V2`) |

**Последний completed gate (09.09.2026):** UI Lab задачи [#563](https://github.com/Smira31/Mentalix/issues/563) via [PR #564](https://github.com/Smira31/Mentalix/pull/564) — owner QA PASS, merge commit `a360c45dc1a77bb6603bba8b5aa5a9364836c870`.

**Deferred Issues (не в execution queue):** #514 (NAV-IA), #515 (DIALOG), #516 (ILLUSTRATION-SYSTEM), #480 (AI-HANDOFF).

## Open PR inventory (сверка 11.09.2026)

Список открытых PR с GitHub на момент сверки. Не объявляет PR готовыми к merge и не заменяет их review/QA gates.

| PR | Краткая суть | Примечание |
|---:|---|---|
| [#601](https://github.com/Smira31/Mentalix/pull/601) | docs: Phase 0 — синхронизация state для evaluator-трека (#600) | Координационный; пересекается по `PROJECT_STATE.md` с этой сверкой |
| [#599](https://github.com/Smira31/Mentalix/pull/599) | feat(ui-lab): MXL-435 — редизайн пикера персон (Preview-only) | UI Lab; status `manual-gate` |
| [#593](https://github.com/Smira31/Mentalix/pull/593) | fix(ui-lab): разрешить Cloudflare Owner QA hostname | Draft; base ≠ main |
| [#592](https://github.com/Smira31/Mentalix/pull/592) | docs: полный индекс и нормализация документации | Docs-only |
| [#589](https://github.com/Smira31/Mentalix/pull/589) | fix(a11y): faint contrast, tap targets (Settings/Series scope) | Открыт; батч #585–#588 уже в main |
| [#584](https://github.com/Smira31/Mentalix/pull/584) | MXL-LIBRARY-PROGRAMS-UI-LAB-001 — Preview-only программы в Библиотеке | Draft; Vercel rate-limited |
| [#565](https://github.com/Smira31/Mentalix/pull/565) | MVP «Наставник»: тексты + блок результата + действия | Product/UI; real-device gate не пройден |

## Координационная очередь

| Issue | ID / title | Статус и границы |
|---|---|---|
| [#600](https://github.com/Smira31/Mentalix/issues/600) | `MXL-AGENT-EVALUATOR-001` — граф разработки и evaluator–optimizer | Phase 0: docs/state sync (см. PR #601). Не меняет product logic, API, данные, secrets, production или deployment. |

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

Сейчас очередь `autonomous` пуста. Новая автономная задача появляется только через явную запись с однозначным scope и owner decision.

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
| Светлая тема vs #590/#591 | **Открытый вопрос владельца.** В main смёржены изменения text size scale (#590) и dark theme colors + text size scale (#591). Влияние на light theme не решено. |

## Canonical Preview QA gate

Для feature QA действует последовательность: feature branch → deployment в Vercel project `mentalix-preview` → promote exact deployment нужного SHA в `mentalix-preview` → canonical alias `https://mentalix-preview.vercel.app` → Vercel-side verify alias provenance → Telegram owner QA → iPhone/browser → Telegram `web_app` → owner PASS → merge. Branch URL и deployment URL не являются owner QA URL; владельцу передаётся только canonical alias с разрешённым path/query. Production project `mentalix` для feature QA не используется. Без Vercel API/token GitHub workflow не может доказать alias→SHA автоматически: `Telegram Preview` принимает только явное `provenance_verified=true` как precondition после ручной Vercel-side проверки, не использует GitHub Deployments как proof и fail-closed при отсутствии этой precondition.

## Definition of Ready / Done

**Ready:** однозначная цель, текущее/ожидаемое поведение, scope, «не меняется», критерии, проверки, rollback, автономность.

**Done:** согласованный scope, зелёные проверки, отдельный PR с evidence, пройденный manual gate (если нужен). `docs/TASK_INDEX.md` — активный backlog; `PROJECT_STATE.md` — только подтверждённые release/production факты.
