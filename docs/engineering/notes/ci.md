---
status: current
last_verified: 2026-11-07
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
- Любой PR с кодом идёт полной проверкой (~10 минут после кэша браузеров и
  трёх параллельных групп smoke, см. ниже; до этого ~20–25 минут): правило «все файлы —
  `.md` вне `src/`, `public/`, `tests/`, `.github/`» выполняется только для
  чистой документации, а `src/content/x.md`, `tests/notes.md` и правка любого
  workflow сразу дают `docs_only=false`. Ослаблять smoke для PR с кодом нельзя:
  он единственный проверяет UI и Telegram-поведение.
- Агрегат «Функциональная проверка проекта» принимает `ux=skipped` только при
  `docs_only=true`; любой другой `skipped`, а также `failure`/`cancelled` —
  провал.

## Кэш браузеров Playwright

- `~/.cache/ms-playwright` кэшируется `actions/cache` с ключом
  `${{ runner.os }}-playwright-<версия @playwright/test>`; версия читается из
  `package-lock.json` (`packages['node_modules/@playwright/test'].version`).
  Ключ привязан к версии, а не к хешу lock-файла: обновление любого другого
  пакета больше не сбрасывает браузеры, а смена версии Playwright — сбрасывает
  (браузеры разных версий несовместимы).
- Попадание в кэш: `npx playwright install-deps chromium webkit` — только
  системные пакеты (`libnss3`, шрифты и т.д.), без скачивания браузеров.
  Промах: `npx playwright install --with-deps chromium webkit`.
  Смешивать нельзя: `install --with-deps` на попадании всё равно проверяет
  браузеры, и шаг перестаёт быть «только системные зависимости».
- Шаги установки печатают `::notice title=Playwright cache::hit|miss <версия>`:
  попадание в кэш видно в аннотациях job'а, а не только в логах шага.
- Кэш сохраняется post-шагом только успешного job. Три группы матрицы идут
  параллельно с одним ключом: сохраняет та, что завершится первой успешно,
  остальные получают «cache already exists» — это нормально.
- `telegram-p0` (informational) оставлен со своим ключом `hashFiles(...)`:
  он ставит только Chromium и в агрегат не входит.

## Playwright smoke: три параллельные группы

- job `ux` — матрица `group: [smoke-day, smoke-evening, webkit-gates]`,
  `fail-fast: false`. Состав:
  - `smoke-day`: `ux:check` (`UX_FIXED_TIME=08:00`);
  - `smoke-evening`: `ux:check` (`UX_FIXED_TIME=21:00`);
  - `webkit-gates`: `ux:mxl010`, `ux:telegram-react-depth`,
    `ux:react-185-checkin`, `ux:tap-areas` (последние три — WebKit) и
    `ux:journal-history`, `ux:typography`, `ux:keyboard`, `ux:pro-states`,
    `ux:pro-failure-states`, `ux:payment-ui` (Chromium, у каждого свой dev-сервер).
- Два запуска `ux:check` — самые длинные шаги (~6–7 минут каждый, 30 файлов
  спецификаций), поэтому они стоят в разных группах и без дополнительных
  наборов; остальные гейты собраны в `webkit-gates`.
- Объединение групп равно прежнему одиночному job: 12 наборов до и после,
  ни один не дублируется. Два запуска `ux:check` отличаются только
  `UX_FIXED_TIME` (утро/вечер) — это разные сценарии, а не дубль.
- Каждый шаг набора помечен `if: matrix.group == '<группа>'`; без этой метки
  набор попадёт во все три группы и время вырастет втрое.
- Агрегат «Функциональная проверка проекта» читает `needs.ux.result`: это
  худший результат среди всех групп, поэтому failure/cancelled/skipped любой
  группы валит проверку. `ux=skipped` проходит только при `docs_only=true`.
- Идентификатор job `ux` не переименовывать: на него опирается `required-check`.
  Отображаемое имя — «Playwright smoke (<группа>)».
- Артефакты падения — отдельные на каждую группу
  (`playwright-artifacts-<группа>`), иначе `upload-artifact` падает на
  конфликте имён.
- Каждая группа делает свой `npm ci`; это дешевле, чем выигрыш от
  параллельного запуска (npm-кэш `setup-node` общий).

## Проверки документации

- `npm run docs:check` падает на битых локальных ссылках, поэтому при удалении
  файла нужно сразу убрать ссылки на него в Markdown.
- `docs:drift` в контейнере Base44 не работает (`spawnSync git ENOENT` в образе
  `node:22-slim`) — это ограничение окружения, а не ошибка документации; в CI
  шаг выполняется на раннере с git.
