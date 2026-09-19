# Issue #644 — аудит GitHub environments

Статус: **проверка в процессе**. Удаление environments не выполняется.

## Чеклист

- [x] Получен список environments из GitHub API; `cloudflare-owner-qa` исключён из удаления и проверки.
- [x] Проверены текущие файлы `.github/workflows/*.yml` (включая все файлы, присутствующие в каталоге).
- [x] Для каждого целевого environment запрошены deployments, environment secrets и protection rules.
- [ ] Сопоставить deployments с датой миграции и сформировать финальные вердикты.
- [ ] Обновить итоговый комментарий/описание PR после финальной проверки.

## Предварительная таблица

| environment | последний deployment (UTC) | secrets / rules | предварительный статус |
|---|---:|---|---|
| `Production` | 2026-09-09 14:01 | secrets: не обнаружены; protection rules: нет; branch policy: нет | уточнить |
| `Production – mentalix` | 2026-09-15 08:50 | secrets: не обнаружены; protection rules: нет; branch policy: нет | уточнить |
| `Production – mentalix-preview` | 2026-09-08 17:24 | secrets: не обнаружены; protection rules: нет; branch policy: нет | уточнить |
| `Preview` | 2026-08-26 17:29 | secrets: не обнаружены; protection rules: нет; branch policy: нет | уточнить |
| `Preview – mentalix` | 2026-09-16 15:03 | secrets: не обнаружены; protection rules: нет; branch policy: нет | уточнить |
| `Preview – mentalix-preview` | 2026-09-08 17:07 | secrets: не обнаружены; protection rules: нет; branch policy: нет | уточнить |
| `github-pages` | 2026-09-01 16:17 | secrets: не обнаружены; protection rules: нет; branch policy: нет | уточнить |

> GitHub API возвращает максимум 100 deployments за один запрос; для строк с `100+` количество является нижней границей. Последняя дата взята из наиболее свежего deployment в ответе API.

## Workflow-ссылки

В текущем `.github/workflows/` обнаружена ссылка на `cloudflare-owner-qa` в `cloudflare-owner-qa.yml` и `telegram-owner-qa-webapp.yml`. Ссылок на семь проверяемых environments (`Production`, `Production – mentalix`, `Production – mentalix-preview`, `Preview`, `Preview – mentalix`, `Preview – mentalix-preview`, `github-pages`) не обнаружено, включая комментарии и текст устаревших workflow-файлов, присутствующих в каталоге.

## Ограничение решения

Наличие исторических deployments означает, что environment использовался ранее, но само по себе не доказывает, что он больше не нужен. До уточнения владельца удаление не рекомендуется: удаление может снести связанные secrets и protection rules.
