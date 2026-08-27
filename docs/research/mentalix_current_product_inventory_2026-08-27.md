# Mentalix — фактический продуктовый инвентарь для сравнения со Stoic

**Исходный срез:** `main` at `12326a54916c4845fddc25212c5d2f3b295ebe6c` (`27 Aug 2026`).
**Актуализация:** в рабочей ветке PR #245 Journal Home заменён на `JournalFlow` в «Практиках»; это изменение ожидает отдельный ручной Telegram/iPhone gate.
**Источник:** текущий frontend-код, канонические документы `PRODUCT.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, `DESIGN_SYSTEM.md` и `docs/TASK_INDEX.md`. Приватный backend исходно не проверялся в этой сессии; его возможности отмечены только по публичным contract/docs.

## 1. Зафиксированная продуктовая модель

Mentalix — **Telegram Mini App и web companion** для движения от состояния к следующему действию: «Идея → Действие → Анализ → Новый шаг». Продукт намеренно строится вокруг ритуалов, аскез, daily check-in, одной next action, трёх AI-персон, Пути/истории и авторского контента; это не универсальная wellness-платформа и не копия Stoic (`PRODUCT.md:6–18, 28–92`).

Главная навигация ограничена пятью вкладками: **Сегодня, Практики, Наставник, Библиотека, Тренды**. Шестая вкладка не допускается без отдельного продуктового решения (`PRODUCT.md:94–104`; `src/App.jsx:333–337`).

## 2. Функции, подтверждённые кодом и текущими документами

| Домен | Наблюдаемая текущая реализация | Уровень готовности / граница |
|---|---|---|
| Daily loop | `Today` переключает состояние по времени и `checkin`: утренний check-in → действие/ритуалы/аскезы → вечерний review → закрытый день. | Данные check-in/ритуалов/тем server-dependent; live iPhone gate отмечен PASS в `PROJECT_STATE.md`. |
| Morning / evening reflection | Шкалы mood/energy/anxiety/focus, emotion taxonomy, утренняя запись, вечерние lessons и «чем горжусь», completion only after server save. | Реализовано как единая check-in record, а не отдельные journal entries (`CheckIn.jsx`). |
| Next action | Hero Today выводит первую незавершённую практику либо Focus-next-step; это осознанная стратегия «один следующий шаг». | **Намеренно отличается** от card carousel Stoic (`Today.jsx:92–114, 500–702`). |
| Journal Flow | Явная строка «Журнал» в «Практиках» ведёт в focused intro, четыре фазы idea/action/analysis/new step, Writing Canvas, completion и возврат в «Практики». | Local-first slice в PR #245; новая запись изолирована по `user.id`, server namespace и cloud sync отсутствуют (`JournalFlow.jsx`, `journalStorage.js`, `Practices.jsx`). Ручной Telegram/iPhone gate ещё не пройден. |
| Free-write / AI | Multi-line Writing Canvas в check-in/theme/journal; optional AI `Пойти глубже` остаётся в поддерживающих flows; три персоны и раздельные histories. | Chat is server-backed; Journal Flow не отправляет journal-текст в AI и остаётся local-first. |
| Rituals / Ascezas | CRUD/list/log/reorder APIs, Today progress and next-action derivation. | Реальное уникальное ядро Mentalix, которого нет в Stoic в таком виде. |
| Themes / Thought of Day | Curated weekly themes, day progress/reflections, daily thought/quote; visible on Today and library-related paths. | Отмечены как completed MXL-015/MXL-016. |
| Practices | Meditation, rituals, ascezas, four guided psychological flows; Brain/Breathing/Focus listed but feature-gated `Скоро`. | Catalog is a switchboard, not Stoic-like broad Explore catalogue (`Practices.jsx`). |
| Meditation | Одна text-based 5–10 minute practice is reported published. | Не audio catalog; intentionally scoped to evidence stage. |
| History / Journey | History merges check-ins and activity by date, shows badges and theme entries; Journey/Year path separate. | No single chronological feed: badges/themes lack dated backend contract (`History.jsx:8–13, 33–97`). |
| Trends | 14-day descriptive analytics over check-ins, rituals/ascezas and safe insights. | No health/sleep data, multi-period exploration or journal drill-downs (`Analytics.jsx`; `TASK_INDEX.md:22`). |
| Personalisation | Today card visibility, accent colour, mood check at launch, review hour, reminder time. | Cadence choice (one daily vs morning/evening) is still a `needs-owner` journal task. |
| Privacy / access | App lock with local PIN + Telegram biometric availability; web-link flow. | No integrated journal privacy centre, export/delete, AI consent/retention screen. |
| Reminders | Bot reminder opt-in and four fixed time choices; separate review hour affects UI, not sending. | Quiet hours, journal reminders and delivery E2E remain deferred/backend-dependent. |
| Content | Articles/courses, themes, quotes; API contracts exist. | Content density/real production records require separate confirmation. |
| Monetisation | Subscription manager/donation API client screens exist. | Payment provider and checkout explicitly deferred, no implementation work allowed without owner decision. |

## 3. Технические границы, влияющие на допустимый backlog

1. Frontend is React/Vite/Tailwind on Vercel. The public repository has a central `/api` client but **no journal API namespace** (`ARCHITECTURE.md:8–76`; `src/lib/api.js`).
2. Journal Flow хранит текущую запись по локальной дате в user-scoped browser key `mx-journal-v2:user:<id>`; у фаз есть draft/final status, но нет server API, cloud sync, cross-device ordering, tags, attachments, deletion/export UI или server-side conflict model (`journalStorage.js`).
3. Existing screens mix fetching and presentation; loading/error/empty states are uneven, and API client lacks timeout/cancellation/retry/normalized failures (`ARCHITECTURE.md:70–101`). These are delivery risks, not automatic refactoring scope.
4. Sensitive backend fixes may not be inferred from frontend. Documentation identifies unresolved global Telegram initData verification, user-id trust and rate limiting; no new backend feature should presume these are closed (`ARCHITECTURE.md:102–104`).
5. Telegram is the critical UX environment. Any mobile-sensitive change must pass iPhone-in-Telegram gate; desktop smoke is not sufficient (`README.md:65–74`; `TASK_INDEX.md:60–61`).

## 4. Intentional differences that must not be recorded as missing

| Stoic pattern | Mentalix decision | Rationale in current product model |
|---|---|---|
| Several parallel Home cards and a central `+` action hub | State-driven Today, one salient next action; QuickAdd removed from Today | Reduce choice noise and avoid a third way to launch the same action (`Today.jsx:949–954`). |
| Separate History / journal-oriented primary destinations | Five tabs only; History nested in Today/Path; Journal Flow — явная focused practice внутри «Практик». | Сохраняет Today-first core loop, не добавляя шестую вкладку и не скрывая путь к журналу внутри AI-наставника. |
| Meditation/audio library and broad mental-health toolbox | One textual meditation plus small authored psychological practices | Content/safety/evidence scope; do not simulate a completed catalogue. |
| Tags/search/favourites/media memories | Deliberately deferred | Need schema, indexing, attachment storage and privacy decisions. |
| HealthKit/iOS native surfaces | Not a Mini App target | Telegram WebView cannot provide direct equivalent; not a v1 implementation candidate. |
| Subscription upsell architecture | Monetisation deferred | Repeated value/free core must be validated before provider choice. |

## 5. Current active opportunities recorded by the repository itself

The canonical index has **no autonomous product task**. The open journal epic is deliberately sequenced: gate явного Journal Flow в «Практиках» → local-first persistence format → server contract → unified dated history → privacy centre → cadence/personalisation → guided content; organisation, memories and reminders are later (`docs/TASK_INDEX.md:31–44`; `ROADMAP.md:159–182`). This is the primary constraint for the Stoic comparison: a feature may be desirable, but cannot be treated as implementation-ready merely because Stoic has it.

## 6. Evidence next required for gap mapping

The subsequent gap map should classify every Stoic capability into one of five categories: **present and stronger**, **present but deliberately different**, **partially implemented**, **missing and implementation-ready only after owner decision**, or **out of current Mini App scope**. It must also state whether each candidate depends on a private backend contract, privacy/safety decision, content governance, real-device gate, or none.
