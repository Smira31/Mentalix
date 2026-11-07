---
status: current
last_verified: 2026-11-07
---

# npm-зависимости: грабли обновления

Рабочие заметки по обновлению зависимостей фронтенда. Не заменяет `package.json`
(источник правды) и `docs/engineering/notes/ci.md` (устройство CI).

## Часть пакетов — транзитивные, их нет в `package.json`

- `zod` приходит через `eslint-plugin-react-hooks` (`"zod": "^3.25.0 || ^4.0.0"`),
  `postcss-selector-parser` — через `tailwindcss` (`^6.1.2`).
- Dependabot-обновление такого пакета меняет **только** `package-lock.json`
  (см. PR #1137 и #1143 — по одному файлу, 3 строки). Ставить его через
  `npm install zod@4.6.7 --save-dev` нельзя: npm добавит пакет в `devDependencies`,
  и дальше версию будет держать уже наш диапазон, а не пакет-родитель.
- Правильный способ — обновить внутри дерева: `npm update zod postcss-selector-parser`.
  Проверка результата: `npm ls zod postcss-selector-parser` показывает версию у
  родителя (`deduped`), а в `package.json` новых строк нет.
- `postcss-selector-parser` 6.1.5 опубликован под dist-tag `legacy-v6`, поэтому
  голый `npm install postcss-selector-parser` уводит на 7.x (мажор). Линия 6.x для
  Tailwind 3 — security-only; обновляться нужно внутри диапазона родителя.

## Обновление по диапазону даёт не версию из dependabot

- `npm install vite@^6.4.5` записывает `^6.4.5`, но в lock попадает **последняя**
  6.x, а не 6.4.5. Так же `@playwright/test` ушёл на 1.65.0 вместо 1.64.1 из PR.
  Это нормально (та же мажорная версия), но в отчёте указывать надо фактически
  установленную версию из `npm ls`, а не цель из dependabot.
- Пин без диапазона (`lucide-react`, `autoprefixer`) обновляется с `--save-exact`,
  иначе npm перепишет пин в диапазон `^`.

## Кэш браузеров Playwright зависит от версии пакета

- Ключ кэша в `ci.yml` — `…-playwright-<версия @playwright/test из lock>`, поэтому
  любой бамп `@playwright/test` даёт промах кэша и полную установку браузеров
  (Chromium + WebKit). Это ожидаемо и не требует правок workflow.
- Смешивать нельзя: на попадании кэша — `npx playwright install-deps`, на промахе —
  `npx playwright install --with-deps`. Иначе на попадании шаг начинает качать браузеры.

## Побочные бампы транзитивных пакетов — это норма

Обновление прямого пакета тянет его зависимости: при обновлении `postcss`,
`prettier` и `eslint-plugin-prettier` в lock появились `nanoid` 3.3.18 → 3.3.20,
`synckit` 0.11.13 → 0.12.3 и новый `@dual-bundle/import-meta-resolve`. Lock руками
не правится; достаточно просмотреть `git diff package-lock.json` и убедиться, что
новые имена объясняются обновлёнными пакетами.

## npm в песочнице Base44

- На хосте нет Node: `npm install` / `npm ci` / `npm audit` выполняются в
  web-контейнере (`docker compose … exec -T web …`).
- `node_modules` — анонимный том, поэтому изменения зависимостей видны только после
  перезапуска контейнера: команда старта делает `npm ci`. Автоматический рестарт
  после правки `package-lock.json` в логах выглядит как `npm error signal SIGTERM` —
  это артефакт перезапуска, а не сбой.
- Аудит для отчёта снимается до и после: `npm audit --json` в контейнере, сравнение
  по `metadata.vulnerabilities` (`high`/`critical`) и по списку `vulnerabilities`.

## Порядок проверки такого PR

- Локально только `npm ci` (согласованность lock) и `npm run check:core`. Playwright
  локально не гоняется — полный набор, включая три группы smoke, выполняет CI.
- Изменения в `package.json`/`package-lock.json` включают job `backend-health`
  (`change-scope`) — он `continue-on-error` и в агрегате не участвует.
