# Mentalix — единый handoff из диалога

Дата сборки: **27.08.2026, Europe/Moscow**.

Этот документ создан, чтобы следующий диалог начинался с одного проверяемого контекста, а не с пересказа нескольких параллельных сессий. История не заменяет актуальный `PROJECT_STATE.md`, `TASKS.md`, `docs/TASK_INDEX.md` и GitHub; перед новым действием нужно повторно проверить `origin/main`, PR, Issues и checks.

## 1. Короткий старт для нового диалога

Скопируйте этот текст в новый диалог:

```text
Продолжи работу над Mentalix в Smira31/Mentalix. Сначала прочитай MENTALIX_WORKSPACE_CONTEXT.md, PROJECT_STATE.md, TASKS.md, docs/TASK_INDEX.md и этот handoff: docs/handoffs/2026-08-27-unified-dialog-handoff.md. Затем сделай read-only проверку фактического origin/main, git status, открытых PR/Issues и GitHub checks. Не делай commit, push, merge, deploy, удаление, изменение secrets или production/data-операции без моего отдельного подтверждения. Текущий выбранный приоритет v1.1.0 — MXL-UX-RESPONSIVE-001; сначала покажи его фактический статус и ближайший decision gate.
```

## 2. Канонические правила работы

| Область            | Зафиксированное правило                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Язык               | GitHub, PR, Issues, коммиты и документация — по возможности на русском; код и идентификаторы — на английском |
| Источник состояния | Сначала `PROJECT_STATE.md`, затем `TASKS.md`, `docs/TASK_INDEX.md`, профильный документ и актуальный GitHub  |
| Git                | Только feature-ветка и PR; необратимые действия требуют отдельного подтверждения                             |
| Продукт            | Не расширять scope и не выбирать P0 самостоятельно                                                           |
| Manual gate        | CI, Vercel и desktop не заменяют Telegram WebView на реальном устройстве                                     |
| Secrets            | Не раскрывать значения; перед удалением проверять references и показывать последствия/rollback               |
| MXL-021            | Исторически два разных scope: тёплый фон и Journey → Today; всегда уточнять контекст                         |

## 3. Что было сделано в этой истории

### Продукт и backlog

MXL-007 и MXL-008 были закрыты. В Journey добавлены CTA «Начать сегодня» и «Продолжить сегодня», ведущие в существующий Today без backend-изменений; это второй исторический scope `MXL-021`, закрытый PR #203. Ранее другой scope MXL-021 — тёплый фон/палитра — также был закрыт; не смешивать эти инициативы.

Проведено сравнение Mentalix со Stoic. Зафиксирован принцип: использовать идею спокойного ежедневного цикла, но не копировать бренд, тексты или UI. Core loop Mentalix остаётся: **Идея → Действие → Анализ → Новый шаг**.

### GitHub, Vercel, Render и Telegram

Были подготовлены русскоязычные шаблоны PR, Issues и release notes. Убрана зависимость release/Preview-процесса от ручного `VERCEL_TOKEN` в workflow; Vercel Git Integration используется для Preview и Production. Создан Telegram Preview workflow с кнопкой открытия Preview, добавлен Render health-check и автоматический journal `PROJECT_STATE.md`.

PR #233 объединил основу автоматизации. PR #235 добавил release automation и русские release notes. PR #236 добавил обязательную проверку Render `/api/health` перед созданием release: retry для Render Free, HTTP 200 и JSON `status: ok`. PR #236 был смёржен.

Создан тег `v1.0.0`; release workflow успешно прошёл Render gate и опубликовал [Mentalix v1.0.0](https://github.com/Smira31/Mentalix/releases/tag/v1.0.0). Первый workflow release был проверен через GitHub Actions.

### Secrets

Устаревший GitHub Actions secret `VERCEL_TOKEN` был проверен через Settings и отсутствует. В актуальном workflow-коде references к нему не осталось; значения действующих secrets не раскрывались. На текущем шаге не менять secrets повторно без новой причины.

### Telegram/iPhone gate

Владелец проверил production Mini App внутри Telegram на реальном **iPhone 16 Pro Max, iOS 26.6**. Подтверждены запуск, safe area/Dynamic Island/Home Indicator, Today, Practices, Mentor/AI, Library, Trends, пять вкладок, Check-in 1–6, ввод текста с iOS keyboard, экран «Чек-ин записан», обновление Today со статусом «Чек-ин выполнен» и фактический ответ AI «Наставника». Итог владельца: «Все работает».

MXL-002 переведена в verified/completed. Отдельный screenshot закрытия Mini App не был представлен, поэтому этот пункт остаётся regression-проверкой, хотя критический пользовательский flow подтверждён.

### Найденные UI-наблюдения

По screenshots были отмечены кандидаты на проверку, а не автоматически объявленные баги: возможное перекрытие верхним Telegram/Mini App header начала контента на Mentor/Journal; взаимодействие нижнего dock с iOS keyboard; floating control, близкий к правому краю; низкий контраст вторичных подписей; возможный layout jump, который нельзя доказать статичным screenshot.

Эти наблюдения оформлены в `MXL-UX-RESPONSIVE-001` и не расширяют scope на backend, API, данные, core loop или новый дизайн.

## 4. Текущее состояние GitHub на момент handoff

Последний проверенный `origin/main`: `0250ec1902293a51b7e34a4467df9255391b912b`, merge commit PR #238.

PR #238 «Добавить responsive UI backlog для v1.1.0» прошёл 4 checks и был смёржен. Он добавил `MXL-UX-RESPONSIVE-001`, responsive UI instruction и обновления project journal.

На момент сборки этого handoff открыт PR #239 «docs: добавить финальный handoff 27.08.2026» с веткой `docs/session-handoff-2026-08-27`. Его файл — `docs/handoffs/2026-08-27-post-merge-handoff.md`. PR #239 появился в GitHub до завершения этой unified-записи и должен быть рассмотрен как существующий кандидат на handoff, а не автоматически дублироваться.

Также открыты исторические или требующие отдельного решения PR, включая #234 и #237, а также старые draft PR. Не смешивать их с текущим responsive scope и не закрывать/сливать автоматически.

> Важное расхождение: snapshots в старых разделах `MENTALIX_WORKSPACE_CONTEXT.md` и некоторых исторических секциях могут ссылаться на более ранние SHA, старые статусы PR или прежние даты. Приоритет имеют свежий GitHub и актуальный `PROJECT_STATE.md`.

## 5. Что подготовлено, но не завершено в GitHub

На локальной feature-ветке `docs/v11-responsive-android-test-plan` подготовлены, но на момент handoff не опубликованы изменения следующего scope:

| Материал                                                           | Состояние                                                                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Приоритет `MXL-UX-RESPONSIVE-001`                                  | Зафиксирован локально как `ready / owner-priority`                                                                                                      |
| `docs/testing/MXL-UX-RESPONSIVE-001_TEST_CASES.md`                 | Локально подготовлены 16 кейсов UX-R-01…UX-R-16                                                                                                         |
| `docs/testing/MXL-012_ANDROID_GATE.md`                             | Локально подготовлены 16 кейсов AND-01…AND-16                                                                                                           |
| `docs/testing/V1_1_TEST_PLAN.md`                                   | Локально подготовлена матрица задач, зависимостей и gates                                                                                               |
| `TASKS.md`, `PROJECT_STATE.md`, `CHANGES.md`, `docs/TASK_INDEX.md` | Локально обновлены для выбранного приоритета                                                                                                            |
| `mentalix-safe-release-workflow`                                   | Skill создан в `/home/ubuntu/skills/mentalix-safe-release-workflow/SKILL.md`, валидатор подтвердил `Skill is valid!`; это не часть репозитория Mentalix |

Эти локальные изменения нельзя считать GitHub-истиной до отдельной проверки, commit, push и PR. Untracked `.agent/` и `stoic-mentalix-comparison.md` не включать в feature PR без отдельного решения.

## 6. Backlog v1.1.0

Канонический активный backlog находится в `docs/TASK_INDEX.md`. Основные незавершённые направления:

| ID                            | Состояние                                                    | Следующая граница                                                                                       |
| ----------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `MXL-UX-RESPONSIVE-001`       | Выбранный приоритет v1.1.0; implementation ещё не начиналась | Сначала подтвердить локальный docs PR, затем read-only audit UI-кода и минимальный implementation scope |
| `MXL-010`                     | manual-gate + backend-dependent                              | Согласовать test account и фактический backend contract для полного E2E                                 |
| `MXL-012`                     | manual-gate                                                  | Провести Android Telegram gate на реальном Android                                                      |
| `MXL-JOURNAL-PERSISTENCE-001` | in progress/backed by local-first, cloud/backend-dependent   | Сначала storage contract и privacy boundary                                                             |
| `MXL-JOURNAL-HISTORY-001`     | backlog/backend-dependent                                    | Только после persistence                                                                                |
| `MXL-JOURNAL-PRIVACY-001`     | backlog/needs-owner + backend-dependent                      | Consent, retention, export, delete и isolation                                                          |
| `MXL-JOURNAL-PERSONALIZE-001` | backlog/needs-owner                                          | Решение по cadence и роли AI                                                                            |
| `MXL-JOURNAL-GUIDED-001`      | backlog/needs-owner                                          | Утверждение guided content                                                                              |
| `MXL-RSCH-002`                | backlog/needs-owner                                          | Research protocol и границы обобщения                                                                   |
| `MXL-USERS`                   | backlog/manual-gate                                          | Consent, выборка 5–10 пользователей и критерии                                                          |

Deferred: `MXL-JOURNAL-ORGANIZE-001`, `MXL-JOURNAL-MEMORIES-001`, `MXL-JOURNAL-REMINDERS-001`, а также `MXL-020`. `MXL-STRICTMODE-PERSONA-001` задокументирована как blocked и не должна запускаться автоматически.

## 7. Что проверить в новом диалоге первым

1. Выполнить read-only `git fetch origin main`, `git status`, `git rev-parse origin/main`, `gh pr list`, `gh issue list` и checks открытых PR.
2. Проверить, смёржен ли существующий PR #239 и нет ли нового handoff PR, чтобы не создавать дубликат.
3. Отдельно проверить, где находятся локальные изменения `docs/v11-responsive-android-test-plan`; не смешивать их с handoff без решения.
4. Для `MXL-UX-RESPONSIVE-001` прочитать `docs/testing/MXL-UX-RESPONSIVE-001_TEST_CASES.md`, затем провести read-only аудит компонентов и существующих `tests/ux/ux-check.spec.mjs`.
5. Не начинать исправление UI до подтверждения, что кандидат действительно воспроизводится, и до фиксации минимального списка затрагиваемых файлов.

## 8. Решения, которые нужны от владельца

| Решение                                   | Рекомендация                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Судьба PR #239                            | Провести read-only ревью; если он покрывает текущий handoff, не создавать дубль      |
| Локальный docs PR responsive/Android/v1.1 | Разрешить отдельный commit/push/PR после проверки diff                               |
| Реализация responsive UI                  | Начинать только после воспроизведения UX-R-кейсов и подтверждения минимального scope |
| Android gate                              | Нужен реальный Android; пока нет device evidence, `MXL-012` остаётся manual-gate     |
| Journal                                   | Не начинать backend-dependent слои без storage/privacy decisions                     |

## 9. Handoff

| Поле                    | Состояние                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Что изменилось          | Синтезирована история диалога и подготовлен этот единый handoff для GitHub                                                                         |
| Где                     | `docs/handoffs/2026-08-27-unified-dialog-handoff.md`                                                                                               |
| Что проверено           | Актуальный `origin/main`, открытые PR/Issues, PR #238 merge, существующий PR #239, канонический backlog и текущие docs                             |
| Что не проверено        | Содержимое всех исторических PR, backend contract для journal, Android device gate, воспроизводимость UI-кандидатов в динамике                     |
| Следующий decision gate | Решить, использовать ли PR #239 или открыть отдельный PR для этой unified-записи и локальных v1.1 docs                                             |
| Риски                   | Несколько диалогов могут одновременно менять canonical docs; старые snapshots расходятся с GitHub; статичные screenshots не доказывают layout jump |
| Rollback                | Документационный merge откатывать отдельным revert PR; код, secrets, production и данные этим handoff не затрагиваются                             |

## References

1. [`PROJECT_STATE.md`](../../PROJECT_STATE.md) — текущий журнал состояния.
2. [`TASKS.md`](../../TASKS.md) — подробный рабочий журнал и backlog.
3. [`docs/TASK_INDEX.md`](../../docs/TASK_INDEX.md) — канонический индекс активных задач.
4. `MENTALIX_WORKSPACE_CONTEXT.md` — внешний project-level файл с рабочими правилами, не хранящийся в этом репозитории.
5. [PR #238](https://github.com/Smira31/Mentalix/pull/238) — responsive backlog foundation.
6. [PR #239](https://github.com/Smira31/Mentalix/pull/239) — существующий post-merge handoff PR.
7. [Release v1.0.0](https://github.com/Smira31/Mentalix/releases/tag/v1.0.0) — первый автоматический release.
