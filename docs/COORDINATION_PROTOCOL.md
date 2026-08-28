# Mentalix — протокол координации диалогов и PR

Цель документа — убрать путаницу при работе над Mentalix из нескольких диалогов, Claude Code, Codex или других агентов. Протокол не меняет продуктовый scope, P0, backend, API, production, данные или secrets.

## 1. Роли диалогов

| Роль        | Ответственность                                          | Право изменять canonical docs                         |
| ----------- | -------------------------------------------------------- | ----------------------------------------------------- |
| Координатор | Read-only аудит, выбор кандидата, план, status и handoff | Нет, кроме отдельного согласованного documentation PR |
| Исполнитель | Одна задача и одна feature-ветка; код и связанные docs   | Да, только в пределах назначенного PR                 |
| Ревьюер/QA  | Diff review, checks, manual gate, evidence и rollback    | Нет; замечания оставляются в PR                       |

В каждый момент времени только один writer может менять `PROJECT_STATE.md`, `TASKS.md`, `docs/TASK_INDEX.md` и `CHANGES.md`. Остальные диалоги работают read-only или в изолированных worktree.

## 2. Обязательный старт диалога

Новый диалог должен начинаться с проекта, цели, задачи/PR и ограничения:

```text
Mentalix / [цель] / [активная задача или PR] / [что нельзя менять]
```

Затем агент читает в порядке `MENTALIX_WORKSPACE_CONTEXT.md`, `PROJECT_STATE.md`, `TASKS.md`, `docs/TASK_INDEX.md`, профильный документ и текущий GitHub. Проверяются `origin/main`, `git status`, открытые PR, Issues и checks.

До read-only сверки запрещены commit, push, merge, deploy, rebase, stash, удаление, изменение secrets, production/data-операции и внешняя публикация.

## 3. Lock на scope

Перед началом writer сообщает в handoff или PR:

```text
ACTIVE LOCK
Task: [ID]
Branch: [feature branch]
Base SHA: [origin/main SHA]
Writer: [диалог/агент]
Files: [точный список]
Out of scope: [что не трогать]
```

Если lock уже существует, новый диалог не редактирует те же файлы. Он может сделать read-only review и оставить рекомендацию владельцу.

## 4. Единый источник истины

| Вопрос                         | Проверять первым                   | Правило                                           |
| ------------------------------ | ---------------------------------- | ------------------------------------------------- |
| Что находится в проекте сейчас | `PROJECT_STATE.md` + свежий GitHub | Старый handoff — только исторический snapshot     |
| Что предстоит сделать          | `docs/TASK_INDEX.md`               | `P0` не назначать автоматически                   |
| Детали задачи                  | `TASKS.md` + Issue/PR              | Проверять уникальность ID и scope                 |
| Что изменилось                 | `CHANGES.md` + merge history       | Не считать локальный diff опубликованным          |
| Как продолжить диалог          | последний handoff                  | После новых merge/checks обновлять reconciliation |

При расхождении не выбирать один вариант молча. Записать расхождение, указать источники и запросить decision owner.

## 5. Правила PR

Каждый PR должен иметь один узкий scope, русский title/description, список out-of-scope, checks, manual gates, evidence, risks и rollback. Не смешивать product code, infrastructure, unrelated documentation и cleanup исторических веток.

Перед PR проверить `git diff --check`; для документации выполнить `npm run docs:check`. Для кода добавить релевантные unit/lint/build/UX checks. PR не считать готовым по зелёному Preview: manual Telegram/iPhone/Android gate остаётся отдельным.

Merge выполняется только после clean mergeability, успешных обязательных checks и отдельного подтверждения владельца. Не использовать rebase, force-push или удаление ветки как способ скрыть конфликт.

## 6. Правила triage старых PR

Старый PR не закрывается только из-за возраста или `DIRTY`. Для каждого PR создать карточку: номер, title, scope, изменяемые файлы, checks, mergeability, зависимости, связь с backlog, manual gate, риск и рекомендация.

Допустимые решения владельца:

| Решение                | Когда использовать                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Оставить               | Scope всё ещё актуален и нужен отдельный review                                                |
| Актуализировать        | Идея нужна, но branch отстаёт; создать новый PR от свежего main или обновить по явному решению |
| Закрыть как устаревший | Scope заменён merged PR или явно отменён; перед закрытием сохранить ссылку и причину           |
| Слить                  | Только после review, clean mergeability, checks и подтверждённого manual gate                  |

Не закрывать одновременно несколько PR. Сначала получить решение по одному объекту, затем выполнить действие и проверить результат.

## 7. Device gates

Desktop, Safari, Vercel Preview и CI не заменяют Telegram WebView на реальном устройстве. Для каждого gate сохранять модель, ОС, Telegram, viewport, URL/commit, дату и evidence. `NOT TESTED` не считается PASS.

Для responsive UI применять `docs/testing/MXL-UX-RESPONSIVE-001_TEST_CASES.md`; для Android — `docs/testing/MXL-012_ANDROID_GATE.md`. Статичный screenshot — observation, а не доказательство layout jump. Сначала воспроизвести, затем исправлять.

## 8. Завершение сессии

Каждый значимый диалог заканчивается handoff:

```text
Что изменилось:
Где находится:
Что проверено:
Что не проверено:
Точный следующий decision gate:
Риски:
Rollback:
```

Новый handoff должен ссылаться на commit/PR и отмечать, какие прежние snapshots стали историческими. Не включать secrets, токены, персональные данные и необезличенное device evidence.

## 9. Текущий triage snapshot

На 27.08.2026 был проведён read-only triage открытых PR #241, #237, #234, #152, #28, #26, #21 и #11. Карточки и рекомендации находятся в `docs/handoffs/2026-08-27-pr-triage.md`. В рамках текущего cleanup не выполняется закрытие, merge, удаление веток или переписывание истории.
