# Mentalix v1.1.0 — план задач и тестирования

Дата: **27.08.2026, Europe/Moscow**.

Этот документ объединяет backlog v1.1.0 и проверяемую последовательность delivery. Приоритет `MXL-UX-RESPONSIVE-001` выбран владельцем; это приоритет v1.1.0, но не автоматическое изменение глобального P0-регистра.

## 1. Цели версии

Сначала стабилизировать responsive UI и ручные device gates, затем закрыть release-critical E2E и только после согласования backend/privacy контрактов расширять журнал. Изменения должны сохранять core loop **Идея → Действие → Анализ → Новый шаг**, Telegram WebView и описательную роль AI/аналитики.

## 2. План delivery

| Фаза                      | Задачи                                                                             | Выход                                                               | Gate                                 |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| A. Responsive baseline    | `MXL-UX-RESPONSIVE-001`                                                            | Подтверждённые или исправленные header/dock/keyboard/overflow риски | UI test cases + real device gate     |
| B. Device coverage        | `MXL-012`                                                                          | Android Telegram gate с фактическим профилем устройства             | AND-01–AND-13 mandatory              |
| C. E2E readiness          | `MXL-010`, затем `MXL-009`                                                         | Полный daily cycle и честная аналитика на согласованных данных      | test account + backend/data contract |
| D. Journal foundation     | `MXL-JOURNAL-PERSISTENCE-001` → `MXL-JOURNAL-HISTORY-001`                          | Согласованное storage boundary и датированная история               | backend/privacy decision             |
| E. Journal product layers | `MXL-JOURNAL-PRIVACY-001`, `MXL-JOURNAL-PERSONALIZE-001`, `MXL-JOURNAL-GUIDED-001` | Owner-approved consent/cadence/content decisions                    | privacy and product gates            |
| F. Research/release       | `MXL-RSCH-002`, `MXL-USERS`                                                        | Утверждённый protocol и обезличенный user evidence                  | consent, sample, criteria            |

`MXL-JOURNAL-ORGANIZE-001`, `MXL-JOURNAL-MEMORIES-001` и `MXL-JOURNAL-REMINDERS-001` остаются deferred до отдельных решений.

## 3. Общий автоматический gate

Для каждого PR выполнять только релевантные проверки: `npm run test:unit`, `npm run lint`, `npm run build`, `npm run docs:check`, `git diff --check` и `npm run ux:check`. Для документационных PR обязательны последние две проверки и docs check. В отчёте явно указывать, какие проверки не применялись.

Vercel Preview проверяет сборку и доступность preview, но не заменяет реальное устройство. Render `/api/health` подтверждает health endpoint, но не доказывает корректность пользовательских данных или полного E2E.

## 4. Матричный план по задачам

| ID                            | Сценарии                                                                                                         | Автоматические проверки                                                      | Ручной/evidence gate                                                               | Не начинать до                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `MXL-UX-RESPONSIVE-001`       | UX-R-01–UX-R-16: launch, header, scroll, tabs, keyboard, long text, floating control, safe area, close/reopen    | unit, lint, build, docs, diff, UX smoke 320×568/390×844                      | iPhone SE/узкий/базовый/Pro Max; screenshots/video и повторяемость                 | Подтверждения владельца и узкий implementation scope |
| `MXL-012`                     | AND-01–AND-16: Android launch, insets, keyboard, back, navigation, network                                       | unit, lint, build, docs, diff, UX smoke; Android-specific checks при наличии | Реальный Telegram на Android; отчёт с model/OS/Telegram/viewport/navigation mode   | Android device и согласованный URL/commit            |
| `MXL-010`                     | onboarding → Today → Check-in → next step → ritual/asceza → AI → evening analysis → Следопыт → next day → reload | unit, lint, build, docs, diff, UX; backend health/contract                   | E2E на test account, screenshots, сохранение и повторное открытие                  | test account и фактический backend contract          |
| `MXL-009`                     | Trends/эмоции, проценты, aggregation, empty/low-data states                                                      | unit aggregation tests, lint, build, docs, diff, UX                          | Реальные обезличенные данные и ручное сравнение ожидаемого/фактического результата | Данные и правила агрегации                           |
| `MXL-JOURNAL-PERSISTENCE-001` | draft/final, morning/evening, reload, migration, duplicate/conflict                                              | unit, storage contract tests, lint, build, docs, diff                        | local-first и backend boundary отдельно; проверка отсутствия loss/duplication      | backend/storage contract и privacy boundary          |
| `MXL-JOURNAL-HISTORY-001`     | dates, order, missing timestamp, empty state, Today → History                                                    | unit, lint, build, docs, diff, UX; API tests после persistence               | iPhone/Telegram history gate, screenshots old/new records                          | persistence merged and contract stable               |
| `MXL-JOURNAL-PRIVACY-001`     | consent, retention, export, delete, account isolation                                                            | security/contract/document checks                                            | owner decision и тестовые данные; не выполнять production delete                   | письменное privacy decision                          |
| `MXL-JOURNAL-PERSONALIZE-001` | first use, cadence, prompt/free write/AI, skip/edit, next day                                                    | unit, lint, build, docs, diff, UX                                            | iPhone flow и product sign-off                                                     | решение по cadence и роли AI                         |
| `MXL-JOURNAL-GUIDED-001`      | catalog, open track, progress, completion, return Today                                                          | unit, lint, build, docs, diff, UX                                            | iPhone/Telegram content gate                                                       | утверждённый content scope                           |
| `MXL-RSCH-002`                | reproducible protocol, source traceability, non-overclaim                                                        | docs/analysis checks                                                         | owner review of protocol and limitations                                           | protocol/sample decision                             |
| `MXL-USERS`                   | consent, 5–10 users, scenario coverage, feedback coding                                                          | data/analysis checks without PII                                             | owner-approved research and anonymized report                                      | consent, sample, criteria                            |

## 5. Exit criteria версии

v1.1.0 нельзя объявлять готовой только по зелёному CI. Нужны успешные обязательные автоматические checks, подтверждённые device gates для согласованных платформ, отсутствие открытых blocker/major дефектов в изменённом scope, обновлённые `TASKS.md`, `PROJECT_STATE.md` и `CHANGES.md`, а также явный owner sign-off.

Для каждого device gate фиксировать модель, ОС, Telegram, viewport, сеть, commit/URL, дату, PASS/FAIL по каждому кейсу и evidence. `NOT TESTED` не считается PASS. Backend-dependent задачи остаются blocked до подтверждения приватного контракта.

## 6. Rollback и handoff

Каждая реализация должна быть отдельным PR с узким rollback. При UI-регрессии откатывать только соответствующий frontend diff. Не удалять production/data и не менять secrets в рамках feature PR. В handoff отвечать на вопросы: что изменилось, где находится, что проверено, что не проверено, следующий decision gate, риски и rollback.

## References

1. [`MXL-UX-RESPONSIVE-001_TEST_CASES.md`](MXL-UX-RESPONSIVE-001_TEST_CASES.md) — детальные responsive test cases.
2. [`MXL-012_ANDROID_GATE.md`](MXL-012_ANDROID_GATE.md) — Android Telegram gate.
3. [`UI_RESPONSIVE_CHECK.md`](UI_RESPONSIVE_CHECK.md) — общая responsive UI инструкция.
4. [`TELEGRAM_GATE.md`](TELEGRAM_GATE.md) — базовый Telegram/iPhone gate.
5. [`QA.md`](../../QA.md) — общие QA-сценарии.
6. [`docs/TASK_INDEX.md`](../TASK_INDEX.md) — канонический backlog.
