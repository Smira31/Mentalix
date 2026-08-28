# MXL-LOOP-001 — action loop implementation and QA plan

**Статус:** первый implementation slice; код продукта в этом коммите не меняется.  
**Цель:** проверить и довести связность сценария `Today → problem-led practice → next action → evening review → return`.

## Product intent

Mentalix должен сокращать расстояние между состоянием пользователя и одним выполнимым действием. Практика не является отдельным упражнением: она должна объяснить проблему, помочь сформулировать действие, вернуть результат в Today и дать материал для вечернего разбора.

## Implementation plan

| Этап | Scope | Результат | Зависимость |
|---:|---|---|---|
| 0 | Зафиксировать baseline и acceptance checklist | Наблюдаемое текущее поведение и тестовый сценарий | Текущие #122, #123, Journal/Practices code |
| 1 | Проверить вход из Today | Check-in, next action и переход в practice не конкурируют и не теряют состояние | Telegram/iPhone manual gate |
| 2 | Проверить problem-led practice handoff | Из Today/Practices понятно, почему выбрана конкретная practice | Четыре текущих flow |
| 3 | Проверить completion contract | После завершения practice создаётся или сохраняется один measurable next action | Existing API/state contract; не придумывать backend endpoint |
| 4 | Проверить evening review | Вечерний экран возвращает к утреннему action и формирует lesson/new step | CheckIn contract, review hour |
| 5 | Проверить return and recovery | Повторный вход, back, свернутое Telegram, loading/error и draft не ломают loop | Telegram/iPhone gate |
| 6 | Добавить только подтверждённые минимальные исправления | Малый PR без новой вкладки, broad catalog или redesign | Evidence этапов 1–5 |
| 7 | Зафиксировать evidence и метрики | QA record, screenshots/recording, event checklist и решение PASS/FAIL | Реальное устройство |

## Invariants — что нельзя менять

| Invariant | Почему |
|---|---|
| Today остаётся главным входом | Это зафиксированная product decision |
| Один главный next action | Снижает choice noise и соответствует Mentalix Core |
| Пять основных вкладок | Journal остаётся практикой внутри Practices |
| AI остаётся optional deepening | Сохранение и действие не должны зависеть от AI |
| Journal/free write не отправляется в AI автоматически | Нужны explicit consent и privacy contract |
| Не добавлять payment, новый backend endpoint или шестую вкладку | Вне scope MXL-LOOP-001 |
| Не считать streak доказательством outcome | Нужны completion, action completion и return metrics |

## Acceptance criteria

### A. Entry and state

| # | Проверка | Ожидаемый результат | Факт |
|---:|---|---|---|
| A1 | Открыть Today в новом тестовом дне | Ясно, что сделать первым; нет конкурирующих равных CTA | ☐ |
| A2 | Завершить morning check-in | Появляется один next action или понятное состояние, почему его пока нет | ☐ |
| A3 | Открыть practice из Today | Возврат не сбрасывает check-in, focus и draft state | ☐ |
| A4 | Открыть Practices напрямую | Четыре psychological practices названы через пользовательскую проблему | ☐ |

### B. Practice handoff

| # | Проверка | Ожидаемый результат | Факт |
|---:|---|---|---|
| B1 | Открыть «Первый шаг» | Видно, что она предназначена для трудного начала | ☐ |
| B2 | Открыть «Без вины» | Видно, что она работает с откладыванием без shame framing | ☐ |
| B3 | Открыть «Одно из всех» | Практика сужает перегруз до одного фокуса | ☐ |
| B4 | Открыть «Один финиш» | Практика переводит большой объём в малое завершение | ☐ |
| B5 | Завершить любую practice | Пользователь получает один конкретный проверяемый action, а не только success message | ☐ |

### C. Evening review and return

| # | Проверка | Ожидаемый результат | Факт |
|---:|---|---|---|
| C1 | Вернуться после утреннего действия в review time | Today предлагает «Анализ дня», а не повторяет утренний check-in | ☐ |
| C2 | Открыть evening review | Можно увидеть/понять связь с сегодняшним action | ☐ |
| C3 | Завершить review | Сохраняются lessons/wins и появляется осмысленное продолжение | ☐ |
| C4 | Закрыть и снова открыть Mini App | Состояние day closed/review complete не откатывается | ☐ |

### D. Recovery and mobile gate

| # | Сценарий | Ожидаемый результат | Факт |
|---:|---|---|---|
| D1 | Нажать back из practice | Возврат в правильный контекст без потери состояния | ☐ |
| D2 | Свернуть Telegram во время flow | После возврата нет неожиданного сброса или ложного completion | ☐ |
| D3 | Медленный/ошибочный API | Нет ложного “saved/completed”; есть понятный recovery state | ☐ |
| D4 | Быстро нажать CTA дважды | Нет двойного перехода/дублирования записи | ☐ |
| D5 | Проверить 320×568 и 390×844 | Keyboard, CTA, safe-area и bottom navigation не перекрываются | ☐ |
| D6 | Проверить длинный русский текст | Нет overflow, потери текста или прыжка фазы | ☐ |

## Event and evidence checklist

До внесения продуктовых изменений нужно подтвердить, что в текущих контрактах или допустимом frontend instrumentation можно наблюдать:

`checkin_started`, `checkin_completed`, `practice_opened`, `practice_completed`, `next_action_created`, `next_action_completed`, `journal_phase_saved`, `journal_completed`, `history_opened`, `return_next_day`.

Минимальный evidence: версия/commit/Preview URL, устройство, iOS, Telegram, дата и timezone, скриншот Today до начала, screen recording одного полного loop, список пройденных критериев, блокеры и решение владельца.

## Definition of Done

Issue #295 не считается закрытой после одного визуального изменения. Она закрывается, когда полный loop пройден на реальном iPhone внутри Telegram, все blocker-сценарии имеют PASS либо явно зарегистрированный follow-up, а измерения позволяют отличить открытие practice от фактического action completion и возврата на следующий день.

## Rollback

Первый коммит и последующие изменения должны быть изолированы отдельным PR. При регрессии откатывается PR целиком; существующие #122, #123 и Journal persistence contracts не переписываются в рамках этой задачи.

## Related work

- Issue #122 — Today: одно главное действие.
- Issue #123 — Telegram return flows.
- Issue #124 — Telegram Mini Apps competitive review.
- Issue #291 — функциональный и UX-аудит.
- Issue #292 — решения по Practices и Trends.
- `docs/research/mentalix_competitive_analysis_execution_backlog_2026-08-28.md`.
