# Mentalix — активный task index

Статус индекса: каноническое представление **активного backlog** на 27.08.2026. Подробные handoff и исторические записи остаются в [`TASKS.md`](../TASKS.md). Stoic-inspired product baseline зафиксирован в [`PRODUCT.md`](../PRODUCT.md), но новые safety, backend и коммерческие решения по-прежнему требуют отдельного подтверждения.

## Как читать индекс

`autonomous` можно выполнять без нового продуктового решения при соблюдении обычного PR-цикла. `needs-owner` требует решения владельца по сценарию, приоритету или продуктовой формулировке. `manual-gate` может иметь готовый код, но не закрывается без проверки на реальном устройстве или пользователях. `backend-dependent` нельзя реализовывать по предположению без приватного контракта.

| ID                           |  Размер | Тип              | Статус     | Автономность                    | Следующий шаг                                                    |
| ---------------------------- | ------: | ---------------- | ---------- | ------------------------------- | ---------------------------------------------------------------- |
| `MXL-RSCH-002`               | Ongoing | research         | backlog    | needs-owner                     | Уточнить протокол проверки и границы обобщения                   |
| `MXL-USERS`                  |      ML | research/release | backlog    | manual-gate                     | Согласовать выборку, согласия, сценарий и критерии               |
| `MXL-001`                    |      ML | product/UX       | verified   | completed                      | Закрыта через PR #211; Telegram/iPhone gate пройден владельцем |
| `MXL-002`                    |      ML | UX/release       | backlog    | manual-gate                     | Провести свежий iPhone/Telegram gate всех AI-экранов             |
| `MXL-005`                    |      ML | product/UX       | verified   | completed                      | Закрыта через PR #207; Telegram/iPhone gate пройден владельцем |
| `MXL-006`                    |      ML | UX               | verified   | completed                      | Закрыта через PR #209; iPhone/Telegram gate пройден владельцем     |
| `MXL-007`                    |      ML | product/UX       | verified   | completed                      | Закрыта через PR #197; iPhone/Telegram gate пройден владельцем |
| `MXL-008`                    |      ML | product/UX       | verified   | completed                      | Закрыта через PR #200; Vercel/телефонный gate пройден          |
| `MXL-021`                    |       M | product/UX       | verified   | completed                      | Закрыта через PR #203; Telegram/iPhone gate пройден владельцем |
| `MXL-009`                    |      ML | product/data/UX  | verified   | completed + backend-follow-up | Закрыта через PR #221; frontend safety slice опубликован, backend contract остаётся отдельным follow-up |
| `MXL-010`                    |       L | release          | backlog    | manual-gate + backend-dependent | Согласовать E2E test account и фактические backend данные        |
| `MXL-011`                    |       L | release          | verified   | completed                      | Закрыта после Telegram/iPhone release gate владельца           |
| `MXL-012`                    |       L | release          | backlog    | manual-gate                     | Провести Android gate                                            |
| `MXL-014`                    |       M | product/content/UX | verified   | completed                      | Закрыта через PR #217; 4-сценная text meditation опубликована |
| `MXL-015`                    |       M | content/product  | verified   | completed                      | Закрыта через PR #213; curated-каталог из 7 тем зафиксирован |
| `MXL-016`                    |       M | content/product/UX | verified   | completed                      | Закрыта через PR #215; curated fallback и reflective metadata опубликованы |
| `MXL-STRICTMODE-PERSONA-001` |       ? | technical        | documented | blocked                         | В TASKS.md явно отмечено «не чинить»; не запускать автоматически |
| `MXL-019`                    |       M | product/UX/visual | verified   | completed                      | Закрыта через PR #219; continuous Journey line опубликована |
| `MXL-JOURNAL-001`           |      ML | product/UX       | in progress | manual-gate                    | Journal Home prototype: 4-фазный цикл, Writing Canvas, local draft; ждёт Preview gate |
| `MXL-020`                    |       ? | product/payment  | deferred   | needs-owner + backend-dependent | Не начинать до подтверждения повторяемой ценности и бесплатного ядра |
| `MXL-JOURNAL-PERSISTENCE-001` | XL | product/backend | backlog | backend-dependent | Зафиксировать storage contract для morning/evening entries |
| `MXL-JOURNAL-HISTORY-001` | L | product/backend/UX | backlog | backend-dependent | Объединить датированную историю после persistence |
| `MXL-JOURNAL-PRIVACY-001` | L | product/safety/backend | backlog | needs-owner + backend-dependent | Решить AI consent, retention, export и delete |
| `MXL-JOURNAL-PERSONALIZE-001` | M | product/UX | backlog | needs-owner | Выбрать cadence и режим prompt/free write/AI |
| `MXL-JOURNAL-GUIDED-001` | M | product/content | backlog | needs-owner | Подготовить guided tracks после стабилизации core journal |
| `MXL-JOURNAL-ORGANIZE-001` | M | product/backend/UX | deferred | backend-dependent | Tags, search и favorites после schema decision |
| `MXL-JOURNAL-MEMORIES-001` | M/L | product/privacy/backend | deferred | backend-dependent | Media attachments только после privacy/storage review |
| `MXL-JOURNAL-REMINDERS-001` | S/M | product/backend | deferred | needs-owner + backend-dependent | Quiet hours, consent и scheduler contract |

## Автономная очередь

Сейчас очередь `autonomous` пуста. Это намеренно: все оставшиеся активные записи либо требуют продуктового решения, ручного gate, backend-контракта или прямо помечены как не подлежащие исправлению. Новая автономная задача может появиться только через отдельную запись с однозначным scope и критериями готовности.

Документационные и maintenance-задачи, обнаруженные аудитом, ведутся отдельными ID и после завершения переводятся в историю. Они не должны маскироваться под продуктовый backlog.

## Product decision register

| Тема            | Состояние                              | Не делать автоматически                             |

| --------------- | -------------------------------------- | --------------------------------------------------- |
| P0              | Рекомендована MXL-001 как следующая P0 | Не менять порядок без новых данных или явного решения владельца |
| Навигация       | Пять основных разделов; Today — главный вход | Не добавлять шестую вкладку                         |
| AI-персоны      | Тон и набор зафиксированы              | Не менять персонажей и их роль                      |
| Возраст         | Открыто; safety gate                   | Не менять 18+/16+                                   |
| Оплата          | Отложена до подтверждения ценности     | Не выбирать provider и не менять checkout           |
| Медитации       | Рекомендована одна текстовая практика 5–10 минут | Не объявлять аудио/placeholder готовым без проверки |
| Backend/API     | Приватный репозиторий                  | Не придумывать endpoint или схему                   |
| Telegram/iPhone | Основной manual gate                   | Desktop smoke не считать заменой реальной проверки  |
| Stoic-аудит | Русская карта функций и design principles добавлена в `docs/product/` | Не копировать бренд, тексты и UI Stoic |
| Journal | Большой эпик разбит на persistence, history, privacy, personalization и content layers | Не дублировать закрытые MXL-001/MXL-005/MXL-009/MXL-014/MXL-015/MXL-016/MXL-019 |

## Definition of Ready

Задача может перейти из `backlog` в `ready`, только если есть однозначная цель, наблюдаемое текущее поведение, scope файлов, список того, что не меняется, критерии готовности, проверка, rollback и понятная категория автономности.

## Definition of Done

Задача считается закрытой после реализации согласованного scope, успешной сборки и целевых проверок, обновления `TASKS.md` и `PROJECT_STATE.md`, краткой записи в `CHANGES.md`, открытия отдельного PR и прохождения предусмотренного manual gate.
