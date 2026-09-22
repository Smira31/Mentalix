---
status: draft
audit_date: 2026-09-19
scope: UX/UI-аудит вкладки «Практики»
base_sha: ca1d21e84bd1ad0e071b2173604298a924d950dd
branch: audit/practices-tab-2026-09-19
---

> Historical snapshot before PR #743/#744, no longer reflects production state. Archived 2026-09-22.

# UX/UI-аудит вкладки «Практики» — 2026-09-19

Формат по образцу `docs/audit/today-tab-2026-09-19.md` (файл-образец на момент аудита в `main` не найден; структура секций сохранена по брифу: Матрица состояний → Документ↔код → Live evidence → Сводка статусов).

**Объём:** разведка и отчёт. Код не менялся. Journal Flow не мёржился. Telegram/iPhone gate владельца не проходился.

**Фактический HEAD `main` на момент аудита:** `ca1d21e84bd1ad0e071b2173604298a924d950dd` (commit message: «docs: close voice diagnostics after owner verification», 2026-09-19).

**PROJECT_STATE.md** по-прежнему указывает `048d4736ad49c9ca40b46b866a7f903eec411c04` (last_verified: 2026-09-16). Расхождение SHA подтверждено (DOC-01 ниже).

---

## 1. Матрица состояний

### 1.1. Структура каталога в коде (фактически)

Каталог «Практики» рендерится через `PracticeCatalogV2` (`src/components/PracticeCatalogV2.jsx`) из `src/screens/Practices.jsx`.

**Верхний уровень (не коллекция):**

| Блок | Что показывает | Источник |
| ---- | -------------- | -------- |
| Journal Banner | Карточка «ЖУРНАЛ · СЕГОДНЯ» → «Разбери день на части» → CTA «Открыть журнал» | `JournalBanner` → `onOpenJournal` → `setSub('journal')` → `GuidedSelfDiscoveryFlow` |
| Practice Rail «Новое и рекомендованное» | 3 карточки: «Разобраться через Лилу» (НОВОЕ, active), «Импульс к действию с Львом» (СКОРО, disabled), «Фокус» (СКОРО, disabled) | хардкод в `PracticeRail` |
| Theme Carousel «Тема недели» | Текущая тема + вопросы дня; CTA «Начать запись» | `api.themes.list` / `api.themes.get` |
| Collection Grid «Коллекции» | 4 коллекции (lila исключена из VISIBLE_COLLECTIONS) | `PRACTICE_COLLECTIONS` без `lila` |

**Коллекции (`PRACTICE_COLLECTIONS` в `practiceCatalogRegistry.js`):**

| key | title | practiceKeys / source |
| --- | ----- | --------------------- |
| psychological | Психологические практики | first-step, no-blame, narrow-focus, one-finish |
| rituals | Ритуалы | source: rituals (live data) |
| ascezas | Аскезы | source: ascezas (live data) |
| lila | Лила | lila-discover (скрыта из grid, доступна в rail) |
| living-lens | Живая линза | meditation, breathing, focus, brain |

**Allowlist доступности (`src/config/practiceAvailability.js`):**

```
lila-discover, rituals, ascezas, first-step, no-blame, narrow-focus,
one-finish, meditation, brain, breathing, focus
```

Все ключи из `PRACTICE_CATALOG_REGISTRY` входят в `AVAILABLE_PRACTICES` → `soon: false` для всех реестровых практик. Статус «Скоро» в UI появляется **только** у хардкод-карточек rail («Импульс к действию с Львом», «Фокус»-preview), не через `isPracticeAvailable`.

### 1.2. Статус каждой практики / карточки

| Карточка / практика | sub / key | Код: доступность | UI-статус | Документы (PRODUCT / ROADMAP / PRODUCT_DECISIONS) | Совпадение |
| ------------------- | --------- | ---------------- | --------- | ------------------------------------------------- | ---------- |
| Журнал (banner) | journal → GuidedSelfDiscoveryFlow | Реализован в main; local-first draft; 7 шагов | Открывается | ROADMAP: Journal Flow из PR #245 / MXL-JOURNAL-001; ждать повторного Telegram/iPhone gate; не production persistence | Частично: код в main, но ROADMAP всё ещё говорит «открытый PR #245» |
| Разобраться через Лилу | lila-discover | AVAILABLE; rail «НОВОЕ» | Доступна | PRODUCT_DECISIONS: MXL-434 Lila Discover ADR | Совпадает (доступна) |
| Импульс к действию с Львом | — | Нет реализации; disabled | СКОРО | Не найдено нормативного решения «в production сейчас» | Совпадает (заглушка) |
| Фокус (rail preview) | — | Нет; disabled | СКОРО | Отдельно от рабочей практики Focus | Совпадает (заглушка) |
| Ритуалы | rituals | AVAILABLE; live data | Доступна | PRODUCT.md: ритуалы — опора продукта | Совпадает |
| Аскезы | ascezas | AVAILABLE; live data | Доступна | PRODUCT.md: аскезы — опора продукта | Совпадает |
| Первый шаг | first-step | AVAILABLE; FirstStepFlow | Доступна | MXL-DEC-013; problem-led track | Совпадает |
| Без вины | no-blame | AVAILABLE; ProcrastinationFlow | Доступна | MXL-DEC-014 | Совпадает |
| Одно из всех | narrow-focus | AVAILABLE; NarrowFocusFlow | Доступна | MXL-DEC-016 | Совпадает |
| Один финиш | one-finish | AVAILABLE; FinishFlow | Доступна | MXL-DEC-015 | Совпадает |
| Медитация | meditation | AVAILABLE; MeditationFlow | Доступна | PRODUCT.md §6: «не объявлять медитации или другие заглушки готовыми» | **Конфликт**: код открывает, PRODUCT запрещает объявлять готовой |
| Дыхание | breathing | AVAILABLE; Breathing | Доступна | PRODUCT.md: аналитика, фокус, дыхание, нейротренажёр в «текущих возможностях по факту кода» | Совпадает (есть в коде) |
| Фокус (коллекция) | focus | AVAILABLE; Focus (с BackButton) | Доступна | practiceAvailability комментарий: «Focus починен #544» | Совпадает |
| Нейротренажёр | brain | AVAILABLE; BrainTrainer | Доступна | То же | Совпадает |
| Тема недели | ThemeScreen | Live API; empty/error/loading states | Зависит от данных | ROADMAP / curated-темы | Совпадает по наличию |

### 1.3. Journal Flow (MXL-JOURNAL-001) — отдельная фиксация

- **В коде `main`:** `GuidedSelfDiscoveryFlow` открывается из banner и из `sub === 'journal'` / `sub === 'self-discovery'`.
- **Структура flow:** intro → 7 writing steps (situation, facts, interpretation, unknown, heavy, control, experiment) → complete («Эксперимент готов» / «Вернуться в дневник»). Не «4 фазы», как в некоторых старых формулировках брифа.
- **Persistence:** local-first (`guidedSelfDiscoveryDraft`); cloud/history — отдельные эпики ROADMAP (`MXL-JOURNAL-PERSISTENCE-001` in progress, `MXL-JOURNAL-HISTORY-001` backlog).
- **ROADMAP.md (фрагмент):** «Текущий JournalFlow реализован в открытом PR #245… не считается production persistence до повторного ручного Telegram/iPhone gate.» Порядок: «1. Довести до повторного Telegram/iPhone gate текущий Journal Flow в «Практиках» из PR #245 / MXL-JOURNAL-001.»
- **Вывод аудита:** код Journal Flow **есть в `main`**. Готовность к production **не подтверждается** этим аудитом: требуется ручной Telegram/iPhone gate владельца. Агент gate не проходил и не делает вывода о готовности на основании кода.

---

## 2. Документ ↔ документ (DOC-01…)

| ID | Расхождение | Детали |
| -- | ----------- | ------ |
| DOC-01 | PROJECT_STATE.md SHA vs фактический main | PROJECT_STATE: `048d4736…` (last_verified 2026-09-16). Фактический HEAD: `ca1d21e84…` (2026-09-19). Повтор прошлого аудита. |
| DOC-02 | Группировка карточек Практик | Бриф / ожидание «Доступно сейчас / Психологические практики / Дальше·Скоро». Код: Journal banner + rail «Новое и рекомендованное» + Theme + Collections (психологические / ритуалы / аскезы / живая линза). Групп «Доступно сейчас» и «Дальше / Скоро» как секций каталога нет. |
| DOC-03 | Статус «Скоро» vs allowlist | `AVAILABLE_PRACTICES` включает meditation, brain, breathing, focus. «Скоро» в UI — только хардкод rail (Лев, Фокус-preview). Документы не описывают этот dual-channel gating. |
| DOC-04 | Journal Flow: PR #245 vs main | ROADMAP говорит «открытый PR #245». В текущем `main` flow уже импортируется и рендерится (`GuidedSelfDiscoveryFlow`). Либо PR смёржен и ROADMAP устарел, либо формулировка «открытый PR» устарела. |
| DOC-05 | Медитация: PRODUCT vs код | PRODUCT.md §6: «не объявлять медитации или другие заглушки готовыми». Код: meditation в AVAILABLE, открывается `MeditationFlow`. Нет явного «Скоро» на карточке медитации в реестре. |
| DOC-06 | Приоритет Journal Flow | ROADMAP ставит повторный Telegram/iPhone gate Journal Flow первым шагом эпика P7. TASK_INDEX (активный backlog) Journal не упоминает в канонической очереди (#623, #620, #618, #615, #612). Приоритет относительно «остального» в активном backlog не зафиксирован явно. |

---

## 3. Документ ↔ код

| Область | Документ говорит | Код делает | Статус |
| ------- | ---------------- | ---------- | ------ |
| Каталог групп | (исторически) три группы «доступно / психологические / скоро» | Layered catalog: banner + rail + theme + 4 collections | Расхождение структуры |
| Allowlist | Не описан детально в PRODUCT | `practiceAvailability.js` — единый источник | Код — источник правды |
| problem-led tracks (4) | MXL-DEC-013…016; без streak | FirstStep / Procrastination / NarrowFocus / Finish; completionSource: local | Совпадает |
| Живая линза | PRODUCT перечисляет как «по факту кода» | brain, breathing, focus, meditation — available | Совпадает по наличию; вопрос «готово» для медитации открыт |
| Journal | ROADMAP: gate перед production; local-first | GuidedSelfDiscoveryFlow в main; local draft | Код впереди устаревшей формулировки ROADMAP про «открытый PR» |
| Лила | ADR MXL-434 | lila-discover available, rail «НОВОЕ» | Совпадает |
| Заглушки rail | Не нормализованы | «Лев», «Фокус» preview — disabled + СКОРО | Ожидаемо как preview |

---

## 4. Live evidence

### 4.1. Production `https://mentalix-production.web.app`

- Загрузка без авторизованной Telegram-сессии: splash → экран newsletter / email-capture («Продолжай расти даже вне приложения»).
- Вкладка «Практики» и каталог **не доступны** без auth-сессии в этом прогоне.
- Зафиксировано: live-окружение без авторизованной сессии **не показывает** каталог Практик. Скриншоты каталога / групп / Journal intro с production в этой сессии **не получены**.
- Канонический прод: Firebase (`mentalix-production.web.app`), не Vercel (подтверждено PROJECT_STATE и прошлым DOC-01 hosting).

### 4.2. Дополнительный источник (не заменяющий live)

- `npm run ux:check` (Playwright) в этой сессии не запускался: нет локального clone с зависимостями в sandbox; evidence ограничено чтением кода + public production guest state.
- Для полного visual evidence нужен owner-сессия (Telegram/iPhone) или Demo Preview с точным SHA.

### 4.3. Ожидаемые скриншоты (не собраны — причина выше)

| Цель | Статус |
| ---- | ------ |
| Каталог Практик целиком | Недоступно без auth |
| Состояние из группы / коллекции «Психологические практики» | Недоступно без auth |
| Состояние «Живая линза» / available | Недоступно без auth |
| Rail «Скоро» | Недоступно без auth |
| Intro Journal Flow | Недоступно без auth |

---

## 5. Сводка статусов

| Практика / карточка | Реализация | Документы согласованы | Live visual |
| ------------------- | ---------- | --------------------- | ----------- |
| Журнал (GuidedSelfDiscoveryFlow) | Реализовано (main, local-first) | Частично (ROADMAP про PR #245 устарел; gate не пройден) | Нет (auth) |
| Лила Discover | Реализовано | Да | Нет (auth) |
| Первый шаг / Без вины / Одно из всех / Один финиш | Реализовано | Да | Нет (auth) |
| Ритуалы / Аскезы | Реализовано (server) | Да | Нет (auth) |
| Дыхание / Фокус / Нейротренажёр | Реализовано | Да (по «факту кода») | Нет (auth) |
| Медитация | Реализовано (открывается) | **Нет** (PRODUCT: не объявлять готовой) | Нет (auth) |
| Rail «Лев» / «Фокус» preview | Заглушка «Скоро» | Ожидаемо | Нет (auth) |
| Тема недели | Реализовано (API-зависимо) | Да | Нет (auth) |

### Критичные открытые пункты (без исправления в этом PR)

1. **DOC-01:** обновить PROJECT_STATE.md SHA и last_verified.
2. **DOC-04 / Journal:** синхронизировать ROADMAP (формулировка «открытый PR #245») с фактом наличия flow в main; статус gate оставить за владельцем.
3. **DOC-05 / Медитация:** решить — либо «Скоро»/gating, либо явное снятие запрета PRODUCT §6.
4. **Структура каталога:** задокументировать актуальную layered-модель (banner + rail + theme + collections) вместо устаревшей трёхгрупповой схемы, если она ещё где-то фигурирует.
5. **Live visual:** для закрытия аудита нужен auth-сессия на production или exact-SHA Demo Preview + owner Telegram/iPhone gate для Journal.

---

## Вне объёма (подтверждение)

- Код не менялся.
- Расхождения не чинились.
- Journal Flow не мёржился и gate не проходился.
- Ветка: `audit/practices-tab-2026-09-19`.
