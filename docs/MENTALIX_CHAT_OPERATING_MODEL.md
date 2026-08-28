# Mentalix — модель работы новых чатов и custom instructions

Этот документ описывает, как распределять работу между несколькими диалогами. Он дополняет `mentalix-safe-release-workflow`, но не заменяет его.

## Принцип одного writer

В каждый момент времени только один диалог или агент изменяет canonical docs и только один исполнитель работает над конкретной feature-задачей. Остальные диалоги работают read-only или проводят review.

| Роль        | Назначение                                   | Пример запроса                                        |
| ----------- | -------------------------------------------- | ----------------------------------------------------- |
| Координатор | Статус, backlog, зависимости, decision gates | «Покажи, что реально готово и какой следующий шаг»    |
| Исполнитель | Одна задача, одна ветка, один PR             | «Реализуй только MXL-UX-RESPONSIVE-001 в своей ветке» |
| QA/Reviewer | Diff, checks, screenshots, manual gate       | «Проверь PR и составь список blocker/major/minor»     |

## Минимальный system-like instruction для нового чата

```text
Ты работаешь над проектом Mentalix в репозитории Smira31/Mentalix.

Всегда работай на русском в пользовательских текстах, PR, Issues и документации. Перед существенной задачей прочитай MENTALIX_WORKSPACE_CONTEXT.md, PROJECT_STATE.md, TASKS.md, docs/TASK_INDEX.md, профильный документ и актуальные GitHub PR/Issues/checks.

Сначала выполняй read-only аудит: git fetch origin main, git status, SHA origin/main, открытые PR/Issues, checks и relevant workflows. При расхождениях не угадывай — покажи источники и запроси решение.

Работай только в feature-ветке и через PR. Не делай commit, push, merge, rebase, stash, deploy, удаление, изменение secrets, production/data-операции или внешнюю публикацию без отдельного подтверждения. Не выбирай P0 сам и не расширяй scope.

Один диалог — одна роль: coordinator, implementer или QA. Перед writer-изменениями объяви ACTIVE LOCK с task ID, branch, base SHA, files, out-of-scope, checks и rollback. Не включай unrelated untracked files.

Для Telegram Mini App CI, Safari, desktop и Vercel Preview не заменяют real-device gate. Статичный screenshot — observation; layout jump нужно воспроизвести. В конце сессии дай handoff: что изменилось, где, что проверено, что не проверено, следующий decision gate, риски и rollback.
```

## Правило маршрутизации задач

| Запрос                      | Использовать                                                           |
| --------------------------- | ---------------------------------------------------------------------- |
| «Что сделано/что осталось?» | Координатор + `PROJECT_STATE.md` и свежий GitHub                       |
| «Выбери следующую задачу»   | Координатор + `docs/TASK_INDEX.md`; P0 только после решения владельца  |
| «Исправь UI»                | Исполнитель + отдельная feature-ветка + responsive test cases          |
| «Проверь PR»                | QA/reviewer; не менять код и canonical docs без отдельного scope       |
| «Проверь iPhone/Android»    | Manual gate docs и реальное устройство                                 |
| «Обнови секреты»            | Read-only references, затем отдельное подтверждение destructive action |
| «Подготовь новый диалог»    | Последний handoff + этот operating model                               |

## Шаблон lock

```text
ACTIVE LOCK
Role: coordinator | implementer | QA
Task: MXL-...
Branch: ...
Base SHA: ...
Writer: ...
Files: ...
Out of scope: ...
Checks: ...
Rollback: ...
```

## Шаблон нового диалога

```text
Mentalix / роль: coordinator|implementer|QA
Цель: ...
Задача или PR: ...
Base/branch, если известны: ...
Не менять: backend, API, данные, secrets, production, P0 без решения
Сначала прочитай: PROJECT_STATE.md, docs/TASK_INDEX.md, docs/COORDINATION_PROTOCOL.md и последний handoff
Сначала покажи: read-only статус, расхождения, scope, checks и следующий decision gate
```

## Шаблон завершения

```text
Что изменилось:
Где находится:
Что проверено:
Что не проверено:
Следующий decision gate:
Риски:
Rollback:
```

## Что не нужно создавать

Не создавать отдельный skill для каждого PR, отдельный status-файл для каждого диалога или параллельный backlog. Основной reusable skill остаётся один: `mentalix-safe-release-workflow`. Этот документ — repository-level инструкция для его применения в нескольких чатах.
