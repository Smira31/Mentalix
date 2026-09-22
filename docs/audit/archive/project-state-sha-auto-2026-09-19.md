---
status: proposal
date: 2026-09-19
scope: автообновление SHA в PROJECT_STATE.md
---

> Historical snapshot before PR #743/#744, no longer reflects production state. Archived 2026-09-22.

# Предложение: автообновление SHA в PROJECT_STATE.md

## Проблема

Два аудита подряд (Today, Practices) находят устаревший SHA в `PROJECT_STATE.md`:

- документ: `048d4736ad49c9ca40b46b866a7f903eec411c04` (last_verified 2026-09-16);
- фактический `main` на 2026-09-19: `ca1d21e84bd1ad0e071b2173604298a924d950dd`.

Обновление сейчас ручное и легко забывается.

## Текущая CI-инфраструктура (факт)

| Workflow | Trigger | `permissions.contents` |
| -------- | ------- | ---------------------- |
| `ci.yml` | PR + push to main | **read** |
| `firebase-hosting.yml` | push to main | **read** |
| остальные | — | read / не пишут в main |

**Ограничение:** ни один workflow на `main` сейчас **не имеет** `contents: write`. Значит шаг «обновить PROJECT_STATE.md и запушить» **нельзя** добавить без решения владельца по permissions/secrets. Обход branch protection / PAT агентом **не делается**.

## Вариант 1 — CI job на push в main (рекомендуемый при согласии на write)

Добавить job (или шаг в `ci.yml` / отдельный workflow) после успешного push в `main`:

1. Checkout `main` с `fetch-depth: 0`.
2. Прочитать `github.sha`.
3. Если строка `Текущий main: \`...\`` уже совпадает — exit 0.
4. Иначе sed/python-замена SHA + `last_verified` на сегодняшнюю дату.
5. Commit + push от `github-actions[bot]` с сообщением вроде `chore(docs): sync PROJECT_STATE.md SHA to <short>`.

Требования к владельцу:

- `permissions: contents: write` (минимум для этого workflow/job);
- согласование с branch protection (нужен ли bypass для github-actions / required status на bot-коммиты);
- опционально: `[skip ci]` в сообщении коммита, чтобы не зациклить pipeline.

Плюсы: полностью автоматически после каждого merge.  
Минусы: нужен write на main; bot-коммиты на защищённой ветке.

## Вариант 2 — npm-скрипт `docs:sync-sha` (ручной, без write в CI)

```bash
npm run docs:sync-sha   # scripts/sync-project-state-sha.mjs
```

Скрипт:

- читает `git rev-parse HEAD` (или `origin/main`);
- обновляет `PROJECT_STATE.md` локально;
- **не** коммитит сам — коммит делает человек в том же PR/follow-up.

Плюсы: нет изменения CI permissions; простое review.  
Минусы: снова зависит от дисциплины (можно добавить в PR template / handoff checklist).

## Вариант 3 — pre-commit / husky hook (локальный)

В существующий husky pipeline добавить шаг: если меняется что-то кроме docs-only и `PROJECT_STATE.md` не содержит текущий HEAD — предупреждение или автоправка.

Плюсы: ловит drift до push.  
Минусы: только у разработчиков с husky; не покрывает merge через GitHub UI без локального hook; merge commit SHA ≠ local HEAD в момент правки.

## Рекомендация для владельца

1. Краткосрочно: **вариант 2** (`docs:sync-sha`) + пункт в PR template «после merge в main — sync SHA».
2. Среднесрочно: **вариант 1**, если владелец явно выдаёт `contents: write` и правила branch protection для bot-коммитов.
3. Вариант 3 — дополнение, не замена.

**В этом PR код workflow не меняется** — только предложение. Выбор и выдача permissions — за владельцем.
