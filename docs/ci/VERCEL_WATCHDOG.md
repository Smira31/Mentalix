---
status: normative
last_verified: 2026-09-11
---
# Vercel Production Watchdog

Workflow [`.github/workflows/vercel-production-watchdog.yml`](../../.github/workflows/vercel-production-watchdog.yml) сверяет `main` с последним `READY`-деплоем Production в Vercel. Он запускается после push в `main` и каждые 30 минут. Если SHA коммита отличается, workflow один раз отправляет `POST` на Vercel Deploy Hook. Если секреты ещё не созданы, workflow завершается успешно с понятным сообщением «Секреты не настроены» и не делает запросов к Vercel.

## Что нужно создать владельцу

Владелец должен один раз создать значения в GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

| Секрет | Где получить | Обязательность |
|---|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens. Токен должен иметь доступ к чтению деплоев проекта. | Обязателен |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General → Project ID. | Обязателен |
| `VERCEL_TEAM_ID` | Vercel → Project Settings → General → Team ID. | Только для проекта внутри Vercel Team |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel → Project Settings → Git → Deploy Hooks → создать hook для ветки `main`. | Обязателен |

`VERCEL_TOKEN`, `VERCEL_PROJECT_ID` и `VERCEL_DEPLOY_HOOK_URL` необходимо вставить в GitHub Secrets с точно такими именами. `VERCEL_TEAM_ID` можно не создавать для личного Vercel-проекта; workflow добавляет его в API-запрос только если значение задано.

## Как проверяется состояние

Для Production запрашивается последний деплой со следующими параметрами: `target=production`, `state=READY`, `limit=1` и `projectId`. Из ответа берётся `meta.githubCommitSha`. Этот SHA сравнивается с SHA последнего коммита `main`. Совпадение означает, что Production актуален. Несовпадение запускает один redeploy через Deploy Hook; агрессивные повторы внутри одного запуска не используются.

Итог каждого запуска виден в логе job и в GitHub Actions Step Summary: Production актуален, redeploy запущен для конкретного коммита или запрос завершился ошибкой с её текстом.

## Безопасность

Значения секретов не выводятся в лог. URL Deploy Hook хранится только в GitHub Secrets. Не вставляйте токен или полный URL hook в Issues, Pull Requests, коммиты или обычные переменные репозитория.
