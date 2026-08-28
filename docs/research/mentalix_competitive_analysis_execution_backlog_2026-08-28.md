# Mentalix — execution backlog по конкурентному анализу

**Основание:** согласованный отчёт `mentalix_psychological_practices_competitive_analysis_2026-08-28.md`.  
**Статус:** одобрено владельцем продукта к занесению в backlog.  
**Правило:** этот документ не разрешает автоматически менять продукт, backend, payment, AI safety или возрастную политику. Он переводит исследовательские выводы в задачи и сохраняет зависимости.

## Product decision

Mentalix развивается как action-first система: «состояние → одна практика или один следующий шаг → выполнение → вечерний анализ → продолжение». Stoic используется как reference для cadence, guided reflection, history и privacy patterns, но не как UI-, брендовый или feature blueprint. Журнал остаётся явной практикой внутри `Практики`; шестая основная вкладка не добавляется.

## Approved backlog

| ID | Приоритет | Задача | Статус | Зависимости |
|---|---:|---|---|---|
| `MXL-LOOP-001` | P0 | Проверить полный action loop: Today → problem-led practice → next action → evening review → return | ready | Telegram/iPhone manual gate, existing #122/#123 |
| `MXL-PRACTICE-UX-001` | P1 | Привести четыре психологические практики к единому шаблону problem → steps → measurable action → completion | backlog | scope review, content/safety review |
| `MXL-JOURNAL-PERSISTENCE-001` | P0 | Довести production persistence для Journal Flow и зафиксировать entry contract | in progress | private backend contract, privacy decisions |
| `MXL-JOURNAL-HISTORY-001` | P1 | Объединить journal/check-in/activity в честную датированную chronology | backlog | persistence, timezone/date contract |
| `MXL-JOURNAL-PRIVACY-001` | P1 | Реализовать privacy/data center: local/synced/AI-submitted data, retention, export, delete, consent | backlog | owner/safety/backend decision |
| `MXL-JOURNAL-GUIDED-001` | P1 | Подготовить 3–5 авторских guided tracks по пользовательским проблемам | backlog | content governance, core journal stability |
| `MXL-JOURNAL-PERSONALIZE-001` | P1 | Дать простой выбор cadence и free write/prompt/AI mode | backlog | persistence, UX decision |
| `MXL-INSIGHTS-001` | P2 | Проверить descriptive pattern insights как накопленную ценность | discovery | reliable history, provenance, sample-size guards |
| `MXL-WTP-001` | P2 | Провести fake-door/concept test платных outputs без подключения checkout | discovery | completed free loop, owner-approved research protocol |
| `MXL-REMINDERS-001` | P2 | Спроектировать opt-in gentle reminders с quiet hours и stop/cancel | deferred | backend scheduler, consent |

## Existing tasks to reuse, not duplicate

`MXL-UX-RESPONSIVE-001`, `MXL-JOURNAL-001`, `MXL-JOURNAL-PERSISTENCE-001`, `MXL-JOURNAL-HISTORY-001`, `MXL-JOURNAL-PRIVACY-001`, `MXL-JOURNAL-PERSONALIZE-001`, `MXL-JOURNAL-GUIDED-001`, `MXL-JOURNAL-ORGANIZE-001`, `MXL-JOURNAL-MEMORIES-001`, `MXL-JOURNAL-REMINDERS-001` уже присутствуют в `docs/TASK_INDEX.md`. Их нужно считать каноническими задачами и обновить формулировки/ссылку на этот execution backlog, а не создавать вторые копии.

Текущие GitHub Issues `#122` (one main action), `#123` (return flow), `#124` (Telegram competitive review), `#291` (functional/UX audit) и `#292` (решения по Practices и Trends) также переиспользуются. Новая задача `MXL-LOOP-001` является связующим validation epic, а не заменой этим Issues.

## Definition of Ready for implementation

Каждая задача перед переходом в `ready` должна иметь наблюдаемое текущее поведение, точный scope файлов/контрактов, список неизменяемых решений, критерии готовности, проверки, rollback и автономность. Для journal/backend/privacy задач нельзя предполагать endpoint, retention или data model по frontend-коду.

## Definition of Done for product loop

Готовым считается не экран, а проверенный сценарий: пользователь понимает проблему, проходит короткую practice, получает один проверяемый next action, видит результат в Today/History, может вернуться на следующий день, а AI и storage работают только в пределах явно объяснённого consent и контракта.

## Measurement plan

Минимальные события: `checkin_started`, `checkin_completed`, `practice_opened`, `practice_completed`, `next_action_created`, `next_action_completed`, `journal_phase_saved`, `journal_completed`, `history_opened`, `ai_deepen_requested`, `ai_consent_confirmed`, `reminder_opted_in`, `return_next_day`.

Главные метрики: completion полного daily cycle, D1/D7 return, completion и action completion по каждой practice, perceived usefulness, ошибки persistence и доля пользователей, которые могут своими словами объяснить, за что они готовы платить. Streak не является самостоятельным доказательством ценности.

## Product non-goals

Не добавлять шестую вкладку, универсальную `+`-кнопку, широкую wellness-библиотеку, penalty/social pressure, medical claims, custom templates/tags/search до storage decision, media memories до privacy/storage review и постоянный paywall до подтверждения повторяемого outcome.

## References

Основной отчёт: [`mentalix_psychological_practices_competitive_analysis_2026-08-28.md`](mentalix_psychological_practices_competitive_analysis_2026-08-28.md).  
Канонический индекс: [`../../docs/TASK_INDEX.md`](../../docs/TASK_INDEX.md).  
Product source of truth: [`../../PRODUCT.md`](../../PRODUCT.md).
