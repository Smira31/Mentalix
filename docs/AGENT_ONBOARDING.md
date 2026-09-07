# Agent onboarding — Mentalix

Этот документ — **единая точка входа** для Codex, Claude Code и других coding agents. Каждый агент обязан начать с него, прочитать указанные источники, найти существующую GitHub Issue и продолжить работу в её контексте. Новые параллельные backlog-файлы, дублирующие Issues и самостоятельные ветки без явной необходимости не создаются. Документ объясняет, где искать правду, как начинать работу и как передавать результат следующему агенту.

## 1. Сначала установите контекст

Прочитайте документы в следующем порядке:

| Порядок | Источник                                  | Для чего                                                                        |
| ------: | ----------------------------------------- | ------------------------------------------------------------------------------- |
|       1 | `PROJECT_STATE.md`                        | Текущий подтверждённый SHA, deployment boundary, CI и ограничения доказательств |
|       2 | `PRODUCT.md`                              | Для кого продукт и какие решения считаются product scope                        |
|       3 | `DESIGN_SYSTEM.md`                        | UI-токены, Card System и визуальные инварианты                                  |
|       4 | `ARCHITECTURE.md`                         | Реальная структура frontend и известный технический долг                        |
|       5 | `docs/TASK_INDEX.md`                      | Единственный активный backlog и следующий decision gate                         |
|       6 | `AI_RULES.md`                             | Обязательный процесс и запреты для AI-агента                                    |
|       7 | `TASKS.md`, `CHANGES.md`, `docs/archive/` | Только исторический контекст, если он действительно нужен                       |

`README.md` даёт карту репозитория, а `AGENTS.md` содержит обязательные operational rules. Ни один исторический документ не переопределяет код, явную команду владельца или актуальный нормативный документ.

## 2. BEFORE STARTING PRODUCT WORK (обязательный pre-flight)

Перед **любой** product work агент обязан:

1. Прочитать `PROJECT_STATE.md` и `docs/TASK_INDEX.md`.
2. Проверить open PRs на GitHub.
3. Определить **одну** текущую Issue из канонической очереди `TASK_INDEX`.
4. Если для неё уже есть active branch/PR — **продолжать его**, не создавать новый.
5. Не начинать следующую Issue, пока текущая не merged или явно parked владельцем.
6. Не создавать duplicate Issue / branch / PR.
7. Явно ответить себе: «Это действительно следующий шаг к готовому Mentalix?»

Если pre-flight не пройден — работа не начинается.

### Канонический flow

```text
Issue → one branch → one PR → exact QA candidate →
mentalix-preview (promote exact deployment) → owner PASS →
merge → delete branch → next Issue
```

Рабочим источником активных задач является связка [`docs/TASK_INDEX.md`](TASK_INDEX.md) + GitHub Issues/PR. Перед началом агент должен найти существующую Issue по теме или task ID, прочитать её описание, комментарии и связанные PR, затем проверить код текущего `main`. Если подходящая Issue уже существует, агент продолжает её, а не создаёт новую. Если задача относится к нескольким направлениям, выбирается одна ведущая Issue, а остальные связываются ссылками или чек-листом.

Порядок работы всегда одинаков: `AGENT_ONBOARDING.md` → нормативные документы → `docs/TASK_INDEX.md` → существующая GitHub Issue → код текущего `main` → минимальный diff → проверки → evidence в PR/Issue → handoff следующему агенту. Чат, личные заметки агента и исторические `TASKS.md`/`CHANGES.md` не являются отдельной точкой правды.

### Правило веток и параллельной работы

Агент не создаёт новую ветку, если владелец явно этого не попросил или если существующая активная ветка/PR уже назначены для этой Issue. Сначала нужно проверить `git status`, текущую ветку, открытые PR и незавершённые изменения. Нельзя прятать чужой WIP в stash, удалять его или начинать работу поверх него без фиксации состояния и согласования.

Если работа уже ведётся в существующей ветке, агент продолжает её. Если рабочее дерево чистое и отдельная ветка действительно необходима для PR, агент сначала сообщает об этом владельцу. Не создавайте несколько веток для одной задачи и не переносите задачу в новый Issue только потому, что предыдущий агент оставил неполный handoff.

### Правило создания новых Issues

Новая Issue разрешена только после поиска по открытым и закрытым задачам и проверки [`docs/TASK_INDEX.md`](TASK_INDEX.md). В новой Issue обязательно указать: цель, текущее и ожидаемое поведение, scope, что не меняется, критерии готовности, проверки, ограничения и ссылки на связанную Issue/PR. Дизайн-гипотеза, функциональный баг и технический блокер оформляются раздельно, если у них разные критерии готовности.

Сформулируйте в PR четыре вещи: цель, список изменяемых файлов, что намеренно не меняется и какие проверки являются достаточными. Не объединяйте рефакторинг, продуктовую гипотезу и визуальный эксперимент в один неописанный diff.

## 3. BEFORE MOVING TO NEXT ISSUE (completion gate)

Переход к следующей Issue из `TASK_INDEX` разрешён **только** когда:

- CI green на candidate PR перед merge;
- exact QA candidate определён (SHA + deployment в `mentalix-preview`), если для задачи требуется manual QA;
- manual QA владельца пройден, если требуется (Telegram/iPhone / `web_app`);
- PR merged в `main`;
- Issue closed/completed;
- feature branch удалена;
- `TASK_INDEX` указывает на правильную следующую задачу;
- нет duplicate open PR в этой же product area.

Пока gate не закрыт — следующая Issue не стартует.

## 4. Как выбирать источник истины

| Вопрос                                | Источник                                        |
| ------------------------------------- | ----------------------------------------------- |
| Что реально работает сейчас?          | Код текущего `main`                             |
| Что принято как product/design rule?  | `PRODUCT.md`, `DESIGN_SYSTEM.md`, `AI_RULES.md` |
| Что активно делается?                 | `docs/TASK_INDEX.md` и GitHub Issue/PR          |
| Какой release/deployment подтверждён? | `PROJECT_STATE.md` и evidence в PR              |
| Почему принято старое решение?        | `TASKS.md`, `CHANGES.md`, archive               |

Если источники расходятся, не выбирайте молча. Зафиксируйте расхождение в PR и решите, нужен ли owner decision или достаточно обновить stale documentation.

## 5. Handoff между агентами

Если у агента закончились лимиты или работа передаётся другому агенту, **новый агент сначала** находит текущие Issue / PR / branch / head SHA и **продолжает их**. Он не получает задачу «как новую» и не создаёт новую ветку/PR без необходимости.

Следующий агент должен получить ссылку на GitHub Issue и PR или commit, изменённые файлы, команды проверок и их результат, открытые риски, необходимый ручной gate и точный следующий шаг. Handoff записывается в существующую Issue или PR, а не в отдельный локальный файл агента. Статус «готово» нельзя использовать, если не выполнен обязательный CI или Telegram/iPhone gate.

Минимальный handoff имеет такой формат:

```text
Issue: #...
PR/commit: ...
Изменено: ...
Проверки: команда — результат
Не проверено: ...
Открытые риски: ...
Следующий шаг: ...
```

Для Codex и Claude Code одинаково обязательны: `npm run check:core` для базового изменения, `npm run ux:check` для UI/platform-sensitive изменения и ручная проверка Telegram/iPhone для safe-area, keyboard, fullscreen или Telegram behavior. После merge `PROJECT_STATE.md` обновляется только для проверяемого release/deployment факта; активные задачи не записываются в исторические `TASKS.md` и `CHANGES.md`.

## 6. Product and Preview boundaries

Card Lab, Motion Kit и другие UI-lab поверхности являются Preview-only, пока владелец отдельно не подтвердил production scope. Preview отправляется через GitHub Actions workflow `Telegram Preview`; локальный PowerShell сценарий — только fallback для Windows. Не отправляйте токены, raw `initData`, персональные данные или production URLs with credentials в PR, issue, chat или commit.

### Preview contract (обязательно)

| Роль                   | Vercel project     | URL                                     |
| ---------------------- | ------------------ | --------------------------------------- |
| **Production**         | `mentalix`         | https://mentalix.vercel.app             |
| **Owner QA / Preview** | `mentalix-preview` | **https://mentalix-preview.vercel.app** |

- Канонический QA-процесс: feature branch → Vercel deployment в project `mentalix-preview` → **PROMOTE exact deployment нужного SHA** в `mentalix-preview` → canonical alias `https://mentalix-preview.vercel.app` → verify alias provenance Vercel-side → Telegram owner QA → iPhone/browser → Telegram `web_app` → owner PASS → merge.
- Production project `mentalix` не используется для feature QA.
- Владельцу QA отдаётся **только** `https://mentalix-preview.vercel.app` с разрешённым path/query.
- Branch URL и deployment URL никогда не являются owner QA URL: **не** отдавать владельцу branch URL, deployment URL (`*.vercel.app` с hash/branch), Preview URL конкретного PR или любой другой `*.vercel.app`.
- Workflow `Telegram Preview` принимает для owner QA только canonical `url=https://mentalix-preview.vercel.app`; `open_url` может отличаться path/query, но host обязан быть тем же.
- Без Vercel API/token workflow не может автоматически доказать alias→SHA. Поэтому перед workflow dispatch обязательны promote exact deployment и Vercel-side provenance verification; workflow fail-closed через `provenance_verified=true` и не использует GitHub Deployments как доказательство.
- Health check и Telegram button используют canonical host.

## 7. Финальный чек-лист PR

Перед merge агент должен проверить, что diff минимален и понятен, нет conflict markers, локальные Markdown-ссылки и task IDs проходят `npm run docs:check`, `npm run check:core` зелёный, а для UI выполнен `npm run ux:check`. В PR должны быть указаны ограничения, не покрытые автоматикой, и следующий ручной gate, если он нужен.
