---
status: current
last_verified: 2026-11-06
---

# CI: грабли и договорённости

Рабочие заметки по GitHub Actions. Не заменяет `docs/ci-cd-audit-2026-09-22.md`
(датированный аудит) и `.github/workflows/` (источник правды).

## Firebase-превью выключены

- Workflow `pr-preview.yml` и `firebase-preview-cleanup.yml` удалены: канал
  PR-превью больше не создаётся, ссылок на демо в комментарии PR нет. Открытые
  каналы `pr-*` в Firebase Hosting, если остались, удаляются вручную в консоли.
- Проверка UI в PR — только локальный `check:core`/целевые Playwright-наборы и
  постоянная демо-ссылка `https://mentalix-production.web.app/?demo=1`.

## `firebase-hosting.yml` — только ручной запуск

- Триггер `workflow_run` удалён: после CI workflow больше не стартует, деплой
  Firebase Hosting — только `workflow_dispatch`.
- В файле лежит блок `env` с флагами прод-сборки (`VITE_API_BASE_URL=/api`,
  `VITE_EMAIL_LOGIN_ENABLED=false`, `VITE_PAYMENT_UI_ENABLED=true`,
  `VITE_PRO_REVIEW_PLAN_ENABLED=true`). Эти строки читает
  `tests/unit/web-auth-email-toggle.test.mjs`, поэтому файл нельзя удалять и
  переписывать без отдельного решения владельца.
- Production — Timeweb (`https://mentalix.space`), Firebase Hosting трафик не
  обслуживает; файл остаётся путём отката.

## `backend-health` в `ci.yml`

- Проверяется `https://api.mentalix.space/api/health` (Timeweb), ожидание —
  `.status == "ok"`.
- Job с `continue-on-error: true` и НЕ входит в `needs` job
  «Функциональная проверка проекта»: недоступность внешнего production не
  блокирует merge. Смотреть результат нужно в самом job, а не в агрегате.
- Job запускается по условию `change-scope`: PR, меняющий `server/`, `api/`,
  `src/lib/api`, `src/platform/`, `package(-lock).json`, `.github/workflows/`,
  `firebase.json`, `render.yaml` или `Dockerfile`.
- В job `change-scope` остался шаг с прежним названием «Определить
  необходимость Render health» — это подпись шага, логика не менялась.

## `docs_only`: документный PR без Playwright smoke

- `change-scope` выдаёт output `docs_only`. Он равен `true`, только если ВСЕ
  изменённые файлы PR оканчиваются на `.md` и ни один не лежит в `src/`,
  `public/`, `tests/`, `.github/` (считается по `git diff BASE_SHA..HEAD_SHA`,
  как и `backend_required`). Для `push` в main, `workflow_dispatch` и пустого
  diff — `docs_only=false`.
- При `docs_only=true` job «Playwright Chromium smoke» пропускается, а job
  «Frontend quality» (`check:core`, `docs:check`, `docs:drift`) продолжает
  запускаться всегда: документация проверяется ссылками и дрейфом.
- Любой PR с кодом идёт полной проверкой (~25 минут): правило «все файлы —
  `.md` вне `src/`, `public/`, `tests/`, `.github/`» выполняется только для
  чистой документации, а `src/content/x.md`, `tests/notes.md` и правка любого
  workflow сразу дают `docs_only=false`. Ослаблять smoke для PR с кодом нельзя:
  он единственный проверяет UI и Telegram-поведение.
- Агрегат «Функциональная проверка проекта» принимает `ux=skipped` только при
  `docs_only=true`; любой другой `skipped`, а также `failure`/`cancelled` —
  провал.

## Проверки документации

- `npm run docs:check` падает на битых локальных ссылках, поэтому при удалении
  файла нужно сразу убрать ссылки на него в Markdown.
- `docs:drift` в контейнере Base44 не работает (`spawnSync git ENOENT` в образе
  `node:22-slim`) — это ограничение окружения, а не ошибка документации; в CI
  шаг выполняется на раннере с git.
