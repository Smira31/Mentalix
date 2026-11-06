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

## Проверки документации

- `npm run docs:check` падает на битых локальных ссылках, поэтому при удалении
  файла нужно сразу убрать ссылки на него в Markdown.
- `docs:drift` в контейнере Base44 не работает (`spawnSync git ENOENT` в образе
  `node:22-slim`) — это ограничение окружения, а не ошибка документации; в CI
  шаг выполняется на раннере с git.
