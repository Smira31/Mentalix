# Mentalix — активный task index

Статус индекса: каноническое представление **активного backlog** на 01.09.2026. Подробные handoff и исторические записи остаются в [`TASKS.md`](../TASKS.md). Stoic-inspired product baseline зафиксирован в [`PRODUCT.md`](../PRODUCT.md), но новые safety, backend и коммерческие решения по-прежнему требуют отдельного подтверждения.

## Как читать индекс

`autonomous` можно выполнять без нового продуктового решения при соблюдении обычного PR-цикла. `needs-owner` требует решения владельца по сценарию, приоритету или продуктовой формулировке. `manual-gate` может иметь готовый код, но не закрывается без проверки на реальном устройстве или пользователях. `backend-dependent` нельзя реализовывать по предположению без приватного контракта.

| ID                      |  Размер | Тип              | Статус   | Автономность   | Следующий шаг                                                               |
| ----------------------- | ------: | ---------------- | -------- | -------------- | --------------------------------------------------------------------------- |
| `MXL-RSCH-002`          | Ongoing | research         | backlog  | needs-owner    | Уточнить протокол проверки и границы обобщения                              |
| `MXL-USERS`             |      ML | research/release | backlog  | manual-gate    | Согласовать выборку, согласия, сценарий и критерии                          |
| `MXL-001`               |      ML | product/UX       | verified | completed      | Закрыта через PR #211; Telegram/iPhone gate пройден владельцем              |
| `MXL-002`               |      ML | UX/release       | verified | completed      | Закрыта ручным iPhone/Telegram gate 27.08.2026                              |
| `MXL-UX-RESPONSIVE-001` |       M | UX/maintenance   | ready    | owner-priority | Приоритет v1.1.0: подготовить implementation scope и пройти UX-R-01–UX-R-16 |
| `MXL-DS-LABEL-FONT-001` |       S | design-system    | verified | completed      | Закрыта через PR #287; смёржено в `main` 28.08.2026                         |

| `MXL-005` | ML | product/UX | verified | completed | Закрыта через PR #207; Telegram/iPhone gate пройден владельцем |
| `MXL-006` | ML | UX | verified | completed | Закрыта через PR #209; iPhone/Telegram gate пройден владельцем |
| `MXL-007` | ML | product/UX | verified | completed | Закрыта через PR #197; iPhone/Telegram gate пройден владельцем |
| `MXL-008` | ML | product/UX | verified | completed | Закрыта через PR #200; Vercel/телефонный gate пройден |
| `MXL-021` | M | product/UX | verified | completed | Закрыта через PR #203; Telegram/iPhone gate пройден владельцем |
| `MXL-009` | ML | product/data/UX | verified | completed + backend-follow-up | Закрыта через PR #221; frontend safety slice опубликован, backend contract остаётся отдельным follow-up |
| `MXL-010` | L | release | verified/completed | owner-confirmed PASS + backend follow-up | Закрыта по owner-confirmed PASS в Issue #356; release gate пройден на реальном iPhone в Telegram, backend/data follow-up не объявляется закрытым |
| `MXL-011` | L | release | verified | completed | Закрыта после Telegram/iPhone release gate владельца |
| `MXL-012` | L | release | backlog | manual-gate | Провести Android gate |
| `MXL-014` | M | product/content/UX | verified | completed | Закрыта через PR #217; 4-сценная text meditation опубликована |
| `MXL-015` | M | content/product | verified | completed | Закрыта через PR #213; curated-каталог из 7 тем зафиксирован |
| `MXL-016` | M | content/product/UX | verified | completed | Закрыта через PR #215; curated fallback и reflective metadata опубликованы |
| `MXL-STRICTMODE-PERSONA-001` | ? | technical | documented | blocked | В TASKS.md явно отмечено «не чинить»; не запускать автоматически |
| `MXL-019` | M | product/UX/visual | verified | completed | Закрыта через PR #219; continuous Journey line опубликована |
| `MXL-JOURNAL-001` | ML | product/UX | in progress | manual-gate | Journal core и reusable tag picker представлены в текущем `main` через PR #472; не объявлять весь Journal закрытым, пока не пройден реальный iPhone/Telegram UX gate текущего core loop |
| `MXL-020` | ? | product/payment | deferred | needs-owner + backend-dependent | Не начинать до подтверждения повторяемой ценности и бесплатного ядра |
| `MXL-LOOP-001` | L | product/UX/research | ready | manual-gate | Проверить полный loop Today → practice → next action → evening review → return; связующая задача для #122/#123 |
| `MXL-PRACTICE-UX-001` | M | product/UX/content | backlog | needs-owner | Унифицировать четыре problem-led practice по шаблону problem → steps → measurable action → completion |
| `MXL-INSIGHTS-001` | M | product/data/UX | discovery-ready | needs-owner | Discovery note готов (Issue #297); владелец решает, какие метрики usefulness/return intent заводить первыми |
| `MXL-WTP-001` | M | product/research/payment | discovery | needs-owner | Fake-door/concept test платных outputs без checkout после подтверждения free loop |
| `MXL-JOURNAL-PERSISTENCE-001` | XL | product/backend | in progress | local-first now; backend-dependent later | User-scoped versioned local storage, draft/final и explicit legacy migration реализованы; cloud sync остаётся отдельным backend gate |
| `MXL-JOURNAL-HISTORY-001` | L | product/backend/UX | backlog | backend-dependent | Объединить датированную историю после persistence |
| `MXL-JOURNAL-PRIVACY-001` | L | product/safety/backend | backlog | needs-owner + backend-dependent | Решить AI consent, retention, export и delete |
| `MXL-JOURNAL-PERSONALIZE-001` | M | product/UX | backlog | needs-owner | Выбрать cadence и режим prompt/free write/AI |
| `MXL-JOURNAL-GUIDED-001` | M | product/content | backlog | needs-owner | Подготовить guided tracks после стабилизации core journal |
| `MXL-JOURNAL-ORGANIZE-001` | M | product/backend/UX | deferred | backend-dependent | Tags, search и favorites после schema decision |
| `MXL-JOURNAL-MEMORIES-001` | M/L | product/privacy/backend | deferred | backend-dependent | Media attachments только после privacy/storage review |
| `MXL-JOURNAL-REMINDERS-001` | S/M | product/backend | deferred | needs-owner + backend-dependent | Quiet hours, consent и scheduler contract |

## Новые owner-decision гипотезы — 29.08.2026

| ID                                                                            | Размер | Тип                     | Статус    | Автономность                                  | Следующий шаг                                                                                                                                                       |
| ----------------------------------------------------------------------------- | -----: | ----------------------- | --------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`MXL-PRODUCT-STRATEGY-001`](https://github.com/Smira31/Mentalix/issues/320)  |      M | product/research        | discovery | needs-owner                                   | Выбрать Scope A (Starter Set) или Scope B (+ «Разобраться сейчас»); не выбирать P0 автоматически                                                                    |
| [`MXL-STARTER-SET-001`](https://github.com/Smira31/Mentalix/issues/321)       |      M | product/UX/content      | discovery | needs-owner + manual-gate                     | Owner-decision hypothesis остаётся отдельной от реализованного frontend Starter Set; PR #473 зафиксировал default-off gate, но не утверждает новый onboarding scope |
| [`MXL-SELF-DISCOVERY-001`](https://github.com/Smira31/Mentalix/issues/322)    |      M | product/UX/content      | discovery | needs-owner + backend-dependent               | Согласовать guided flow и границы AI-разбора поверх существующих Journal-задач                                                                                      |
| [`MXL-AI-ROLES-001`](https://github.com/Smira31/Mentalix/issues/323)          |      M | product/research/safety | discovery | needs-owner + manual-gate                     | Утвердить naming и role playbooks; не менять текущих AI-персон автоматически                                                                                        |
| [`MXL-GUIDED-REFLECTION-001`](https://github.com/Smira31/Mentalix/issues/324) |      M | product/research/safety | blocked   | needs-owner + manual-gate + backend-dependent | Провести safety-review; до решения не реализовывать «режим терапии» и medical claims                                                                                |

## Автономная очередь

Сейчас очередь `autonomous` пуста. Это намеренно: все оставшиеся активные записи либо требуют продуктового решения, ручного gate, backend-контракта или прямо помечены как не подлежащие исправлению. Новая автономная задача может появиться только через отдельную запись с однозначным scope и критериями готовности.

Документационные и maintenance-задачи, обнаруженные аудитом, ведутся отдельными ID и после завершения переводятся в историю. Они не должны маскироваться под продуктовый backlog.

## Product decision register

| Тема | Состояние | Не делать автоматически |

| --------------- | -------------------------------------- | --------------------------------------------------- |
| P0 | Рекомендована MXL-001 как следующая P0 | Не менять порядок без новых данных или явного решения владельца |
| v1.1 priority | Владелец выбрал `MXL-UX-RESPONSIVE-001` первым направлением v1.1.0 | Не трактовать как глобальный P0 и не расширять scope за frontend responsive UI |
| Навигация | Пять основных разделов; Today — главный вход | Не добавлять шестую вкладку |
| AI-персоны | Тон и набор зафиксированы | Не менять персонажей и их роль |
| Возраст | Открыто; safety gate | Не менять 18+/16+ |
| Оплата | Отложена до подтверждения ценности | Не выбирать provider и не менять checkout |
| Медитации | Рекомендована одна текстовая практика 5–10 минут | Не объявлять аудио/placeholder готовым без проверки |
| Backend/API | Приватный репозиторий | Не придумывать endpoint или схему |
| Telegram/iPhone | Основной manual gate | Desktop smoke не считать заменой реальной проверки |
| Stoic-аудит | Русская карта функций и design principles добавлена в `docs/product/` | Не копировать бренд, тексты и UI Stoic |
| Competitive analysis execution | Согласованный отчёт переведён в `docs/research/mentalix_competitive_analysis_execution_backlog_2026-08-28.md`; сначала проверяется action loop, затем persistence/history/privacy/content, и только потом payment | Не создавать дубли существующих journal/UX/research задач и не запускать checkout до evidence |
| Journal | Вариант А и текущий frontend core представлены в `main`; PR #472 добавил reusable tag picker. Остальные persistence/history/privacy/personalization/content layers остаются отдельным scope | Не добавлять шестую вкладку, не скрывать Journal внутри Mentor и не объявлять визуальный редизайн утверждённым до единого реального iPhone/Telegram UX gate текущего core loop |

## Definition of Ready

Задача может перейти из `backlog` в `ready`, только если есть однозначная цель, наблюдаемое текущее поведение, scope файлов, список того, что не меняется, критерии готовности, проверка, rollback и понятная категория автономности.

## Definition of Done

Задача считается закрытой после реализации согласованного scope, успешной сборки и целевых проверок, открытия отдельного PR с evidence и прохождения предусмотренного manual gate. `docs/TASK_INDEX.md` обновляется для активного backlog; `PROJECT_STATE.md` — только если изменился подтверждённый release/production факт. `TASKS.md`, `CHANGES.md` и архив пополняются только когда нужна историческая причина, а не как обязательная копия статуса.

## Completed maintenance and audit outcomes

Эта секция хранит завершённые технические и документационные результаты и не является активной очередью. Закрытые Issues не называются активными задачами; нерешённые product hypotheses остаются в своих discovery/backlog строках.

| ID / scope                          | Статус               | Подтверждение                                                                                                                                           |
| ----------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MXL-GIT-SYNC-001` и branch cleanup | verified/completed   | Issue #289 закрыта; `origin/main` синхронизирован, старые remote branches удалены по owner-confirmed read-only аудиту, на GitHub осталась только `main` |
| `MXL-TYPO-001`                      | historical/completed | Issue #290 закрыта; не является активной очередью                                                                                                       |
| `MXL-DESIGN-STOIC-001`              | historical/completed | Issue #292 закрыта; решения аудита отражены в существующей документации, новый Stoic backlog не создаётся                                               |
| GitHub Pages cleanup                | verified/completed   | PR #474 удалил устаревший `.github/workflows/pages.yml`; канонический frontend production — Vercel                                                      |
| `MXL-SERIES-001`                    | verified/completed   | Issue #299, PR #301; Today streak flame и Series & Badges опубликованы                                                                                  |
| `MXL-STREAK-TIERS-001`              | verified/completed   | PR #196; именованные уровни текущей серии опубликованы                                                                                                  |

## Canonical agent workflow and next decision gate

Эта секция связывает активные задачи с единой точкой входа [`docs/AGENT_ONBOARDING.md`](AGENT_ONBOARDING.md). Новые Issues и ветки для уже существующей работы не создаются без явного решения владельца. Устаревший порядок `#289 → #292` удалён из active/audit queue.

| Текущий gate                                                                    | Scope                                                    | Ограничение                                                                                                                         |
| ------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Реальный iPhone/Telegram UX gate текущего core loop перед визуальным редизайном | Today → practice → next action → evening review → return | CI, desktop smoke, HTTP health и Vercel Preview не заменяют ручную проверку; редизайн не объявляется реализованным или утверждённым |

Оставшиеся product hypotheses и backend-dependent задачи продолжают жить в основных таблицах выше. Они не становятся completed только потому, что связанный Issue закрыт; статус и следующий шаг должны соответствовать текущему Issue, PR, коду и решению владельца.
