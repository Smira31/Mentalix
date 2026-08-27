# Mentalix — backlog по итогам сопоставления со Stoic

**Статус:** предложение для решения владельца; не меняет `TASKS.md`, код, backend-контракты, тарифы или навигацию автоматически.  
**Основание:** [`stoic_to_mentalix_gap_map_2026-08-27.md`](stoic_to_mentalix_gap_map_2026-08-27.md), `PRODUCT.md`, `docs/TASK_INDEX.md`, текущий frontend `main` (`12326a5`).

> **Главная рекомендация.** Не переносить набор функций Stoic. Сначала сделать у Mentalix надёжным собственный путь: **свободно зафиксировать мысль → вернуться к ней в датированной истории → понимать, где хранятся данные и как ими управлять**. Это устраняет реальную слабость прежнего Journal Home и одновременно усиливает модель «Идея → Действие → Анализ → Новый шаг».

## 1. Приоритизация

| Волна | Задача | Ценность для Mentalix | Почему именно сейчас | Автономность |
|---|---|---|---|---|
| 0 | `MXL-UX-RESPONSIVE-001` | Сохраняет доступность всех существующих сцен на iPhone/Telegram | Уже выбрано владельцем как v1.1 priority; новые journal screens нельзя строить поверх непроверенного layout. | owner-priority; frontend-only. |
| 1A | `MXL-JOURNAL-001`: принять Journal Flow в «Практиках» на реальном iPhone | Устанавливает, что явный четырёхшаговый путь, completion и возврат понятны и доступны | Код уже есть в PR #245, но остаётся local-first/manual-gate. | **manual-gate**; без дальнейшего изменения кода. |
| 1B | `MXL-JOURNAL-PERSISTENCE-001`: durable local-first journal | Не теряются draft/final, journal становится честной частью daily loop | Без этой основы невозможны History, tags, AI-context и cross-device promises. | Scope можно подготовить; cloud/backend — **не начинать** без контракта. |
| 1C | `MXL-JOURNAL-HISTORY-001`: unified dated history | Позволяет вернуться к идее/действию/анализу в один момент времени | Делает Journey полезным retrieval-инструментом, а не набором разрозненных блоков. | **backend-dependent** после 1B. |
| 1D | `MXL-JOURNAL-PRIVACY-001`: privacy/data centre | Делает доверие к journal и AI явным до роста данных | Появление durable entries без export/delete/consent создаст доверительный долг. | **needs-owner + backend + safety/legal**. |
| 2A | `MXL-JOURNAL-PERSONALIZE-001`: cadence + contextual writing entry | Снижает blank-page friction и даёт выбор ритуала без перегрузки Today | Stoic-подобный принцип нужен, но current one-action design нельзя разрушать. | **needs-owner**. |
| 2B | `MXL-JOURNAL-GUIDED-001`: authored guided micro-tracks | Создаёт второй вход для людей, которым трудно писать свободно | Только после stable journal and content governance. | **needs-owner + content**. |
| 3 | `MXL-JOURNAL-ORGANIZE-001`: tags/search/favourites | Помогает retrieval на большой истории | Не имеет смысла до durable, dated entries. | deferred/backend-dependent. |
| 3 | `MXL-JOURNAL-REMINDERS-001` | Gentle return to practice | Bot reminder exists, but quiet hours/delivery/consent are undefined. | deferred/owner/backend. |
| Later native | media memories, audio library, widgets, Health/Screen Time | Возможный дифференциатор native-app future | Не соответствует текущей Telegram Mini App среде. | out of current scope. |
| Deferred | subscription/paywall | Может монетизировать value later | Оплата не должна предшествовать доказательству привычки. | needs-owner/backend-dependent. |

## 2. Первая волна: определённый scope каждого пункта

### Wave 0 — `MXL-UX-RESPONSIVE-001` (не подменять новой функцией)

Это уже выбранный вами приоритет v1.1.0. Он не копирует Stoic, но снижает риск того, что следующий Journal/Data экран окажется физически недоступным в Telegram WebView. Scope: только UI responsive behavior, keyboard/dock/safe area/header/floating controls and overflow cases по существующему test plan. Не менять дизайн-токены, product logic, backend/API, набор вкладок или контент.

**Готово, когда:** UX-R-01…UX-R-16 проходят в agreed viewports; целевые flows не перекрываются keyboard/dock; `lint`, `test:unit`, `build`, `ux:check` зелёные; владелец проходит iPhone/Telegram gate. Никакие Stoic features не должны быть «захвачены» этой maintenance-задачей.

### Wave 1A — Journal Flow acceptance gate

**Проблема.** В PR #245 Journal Home заменён на явную строку «Журнал» в «Практиках»: intro → writing → completion → возврат. Запись хранится только local-first. До любого расширения надо подтвердить на реальном iPhone внутри Telegram, что пользователь видит вход, может писать поверх keyboard/dock, действительно завершает цикл и без поиска открывает сохранённую запись снова.

**Ручной маршрут:** `Практики → Журнал → Начать → Идея → Действие → Анализ → Новый шаг → Цикл сохранён → Вернуться к практикам → Журнал → Открыть запись`. Используется тестовый, не личный текст.

**Критерии приёмки:**

| Критерий | Наблюдаемое доказательство |
|---|---|
| Понятный start | Пользователь без подсказки видит «Журнал» в «Практиках» и понимает, что это не AI-чат. |
| Понятный progress | Видит 4 шага и может вернуться к заполненному предыдущему. |
| Безопасный draft | Текст сохраняется после ухода/возврата в тот же день для того же профиля и устройства. |
| Завершение | После непустого «Нового шага» появляется отдельный экран `Цикл сохранён`, а `Вернуться к практикам` действительно закрывает flow. |
| Повторное открытие | Из «Практик» повторно находится «Журнал», а готовая запись открывается без потери final-статуса. |
| Telegram layout | Keyboard, back, dock и нижняя навигация не перекрывают сцену на реальном iPhone. |

**Non-goals:** cloud sync, tags, search, upload, AI memory, share, new tab or mock persistence.

### Wave 1B — `MXL-JOURNAL-PERSISTENCE-001`, local-first slice

**Цель.** Стабилизировать уже существующую модель `mx-journal-v2` без обещания cloud-sync: versioned storage, deterministic migration, draft/final status, date/timezone semantics, explicit local-storage error state, per-user isolation on shared browser and a safe clear/reset route. Это не замена backend persistence.

**Факт кода.** `journalStorage.js` уже хранит новые записи в user-scoped ключе `mx-journal-v2:user:<id>` и предлагает перенос прежней browser-wide записи только явным действием. Четыре фазы имеют статусы draft/final; `freeWrites` остаётся моделью без текущего writer UI. Это local-first защита на одном устройстве, а не cloud identity/sync model.

| In scope | Out of scope |
|---|---|
| Versioned local schema/migration | Backend endpoint, DB migration, cross-device sync |
| User-scoped key and migration from old shared key | iCloud/Telegram cloud promise |
| Explicit storage failure and recovery copy | Attachment/media storage |
| Draft/final state contract and predictable reopening | Tags/search/favourites |
| Local delete/reset behaviour with clear warning | Global account deletion/export (belongs to privacy contract) |

**Готово, когда:** journal data survive refresh/reopen for same user; do not appear for a different test user in same browser; old v2/prototype data migrate once without loss; inaccessible storage produces recoverable no-false-success state; `npm run test:unit`, lint/build/UX check green; iPhone gate follows.

**До следующего backend-подэтапа:** зафиксировать server entry ID, schema, calendar-day/timezone, edit/delete across devices, sync conflicts, offline behavior, export и retention. Текущий user-scoped ключ не является заменой этим решениям.

### Wave 1C — `MXL-JOURNAL-HISTORY-001`

**Цель.** Одна честная датированная лента внутри существующего `Today → Path → History`, где check-in, rituals/ascezas, Theme reflection and journal entry can appear in chronological order with type and source. Это заимствует у Stoic **retrieval**, а не его layout.

**Preconditions:** journal entry model has `created_at/updated_at` semantics; backend returns timestamps for themes/badges or they remain dated only by reliable event date; timezone contract is written down.

**Non-goal:** client-side guessed timestamps or a visually unified feed that silently reorders undated records.

### Wave 1D — `MXL-JOURNAL-PRIVACY-001`

**Цель.** Небольшой, понятный Data & Privacy surface inside Settings (not a new primary tab), describing journal storage, AI boundaries, analytics event exclusions, export/delete request path and contact. It must follow actual backend and legal decisions, not competitor promises.

**Required owner decisions:**

1. May AI receive current journal/check-in text? If yes, is there an explicit contextual opt-in and per-action disclosure?
2. What journal/check-in/chat data are retained, by whom and for how long?
3. What does deletion mean (local device, backend, backups, AI provider) and what is the service-level process?
4. What self-service export is feasible at this stage, and in what format?
5. Are behavioural events/no-text analytics optional, and how are they controlled?

No copy, toggle or «privacy secure» claim should be coded before those answers and backend support exist.

## 3. Owner choices needed for Wave 2

### A. Cadence (one decision, not a feature menu)

| Choice | What the user sees | Advantage | Cost / risk |
|---|---|---|---|
| **A1. Current adaptive rhythm** | Morning check-in; Today becomes evening review after chosen hour. | Least scope; preserves existing loop. | No explicit user preference; may be less discoverable. |
| **A2. Compact daily choice** | Settings: `Один ритуал в день` / `Утро и вечер`. Today adjusts its copy and prompt density. | Adds agency without a new tab. | Requires persistence/copy coherence and clear migration. |
| **A3. Fully customised schedule** | Multiple times, days and types. | Maximum flexibility. | Not recommended: turns product into scheduler, requires reminders/quiet hours backend. |

**Recommendation: A1 until Wave 1B/1D are complete; then consider A2. Do not build A3.**

### B. Contextual prompt entry

Proposed scope after Wave 1: one authored line above the current Writing Canvas based on **current weekly theme + time of day**. The user can ignore it and write freely. No AI-generated prompts, no library page, no new navigation.

**Recommendation:** approve only after a small source-reviewed content map exists (7 themes × morning/evening × one fallback), with author/date/version attached. This is smaller and more Mentalix-native than replicating Stoic Suggestions/Templates.

### C. Guided micro-tracks

Proposed scope after Wave 1: two author-reviewed tracks bound to real problem clusters, e.g. `Не могу начать` and `После срыва`. Each must end with **one concrete next action**, not a generic emotional completion.

**Recommendation:** run user interviews/protocol `MXL-USERS` before writing a full library. Existing `Первый шаг` and `Без вины` are a more relevant baseline than Stoic’s broad guided journal catalogue.

## 4. Explicitly rejected for the next two releases

| Candidate inspired by Stoic | Why not now |
|---|---|
| Universal `+` creation hub | Violates one-next-step/low-noise Today design; duplicate actions already removed. |
| Separate Journal or History tab | Violates five-tab decision; History has an approved home inside Today/Path. |
| Photo/video journal, Memories | Requires storage, consent, transfer limits, deletion/retention and native media UX. |
| Audio meditation library/downloads | Requires audio rights, storage/CDN, player state and completion analytics; current textual practice must prove value first. |
| HealthKit, Screen Time shield, widgets | Native OS features, not equivalent Mini App tasks. |
| Tags/search/favourites now | Produces a retrieval surface with no durable shared journal schema. |
| Subscription/Premium cloning | Payment is intentionally deferred and cannot be inferred from Stoic’s model. |
| AI personalisation by hidden history | Cannot proceed before explicit consent and data contract. |

## 5. First-wave decision required

To move from analysis to implementation without violating repository decisions, the owner should approve **one** of these routes:

| Route | Commit-able work after approval | Does it require private backend? | Recommendation |
|---|---|---|---|
| **R0 — Quality first** | `MXL-UX-RESPONSIVE-001` only. | No. | Required release hygiene, but does not close functional journal gap. |
| **R1 — Trustworthy Journal foundation** | Manual acceptance of the Journal Flow in «Практиках», then local-first `MXL-JOURNAL-PERSISTENCE-001` slice. | No for current local-first scope. | **Recommended first product route.** |
| **R2 — History first** | Unified History. | Yes; also blocked by R1. | Do not start first. |
| **R3 — More guided content first** | Prompt cadence/guided track work. | No/limited, but needs content decision. | Useful later; risks hiding persistence weakness. |
| **R4 — Privacy first** | Privacy/data-centre discovery and decision record. | Yes for actual product claims. | Start policy/contract workshop in parallel; code only after answers. |

**Recommended execution order:** approve **R0 + R1**, run the real-device Journal Flow acceptance route, then continue only with the strictly local-first persistence work that has passed that gate. In parallel, record decisions for R4; do not code its claims until private backend/legal behaviour is known.
