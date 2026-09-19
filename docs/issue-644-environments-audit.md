# Issue #644 — аудит GitHub environments

Проверка выполнена **19 сентября 2026 года**. Удаление environments не выполнялось.

## Чеклист

- [x] Получен список environments из GitHub API; `cloudflare-owner-qa` исключён из удаления и оставлен без изменений.
- [x] Проверены все 7 файлов в текущем `.github/workflows/` на `main`: `ci.yml`, `cloudflare-owner-qa.yml`, `firebase-hosting.yml`, `issue-triage.yml`, `pr-handoff.yml`, `release.yml`, `telegram-owner-qa-webapp.yml`.
- [x] По каждому целевому environment запрошены deployments, environment secrets и protection rules.
- [x] Для последних deployments проверены автор и ref.
- [x] Сформирован итоговый список «можно удалить / нужно уточнить».

## Итоговая таблица

| environment | последний deployment (UTC) | secrets / rules | вердикт |
|---|---|---|---|
| `Production` | 2026-09-09 14:01, `vercel[bot]`, ref `c3ffb3d76f94b80a9cfd9c9ab725a4f5ffdcbc8` | secrets: 0; protection rules: 0; branch policy: нет | **уточнить** |
| `Production – mentalix` | 2026-09-15 08:50, `vercel[bot]`, ref `3d2b57d3dd32e396464b127e11f3ba67685193f6` | secrets: 0; protection rules: 0; branch policy: нет | **уточнить** |
| `Production – mentalix-preview` | 2026-09-08 17:24, `vercel[bot]`, ref `c82d7301826a50df7676fcb7d46b3d657c01dc34` | secrets: 0; protection rules: 0; branch policy: нет | **уточнить** |
| `Preview` | 2026-08-26 17:29, `vercel[bot]`, ref `1cc0388ddd7d1ad606598b273f23dea041f8fac6` | secrets: 0; protection rules: 0; branch policy: нет | **уточнить** |
| `Preview – mentalix` | 2026-09-16 15:03, `vercel[bot]`, ref `6800937a332b2fe0c770f3830bf8d23af5f5f253` | secrets: 0; protection rules: 0; branch policy: нет | **уточнить** |
| `Preview – mentalix-preview` | 2026-09-08 17:07, `vercel[bot]`, ref `c393f084b32b9e1f55281c736d9e0898194f390b` | secrets: 0; protection rules: 0; branch policy: нет | **уточнить** |
| `github-pages` | 2026-09-01 16:17, `Smira31`, ref `main` | secrets: 0; protection rules: 0; branch policy: нет | **уточнить** |

### Как читать результат deployments

По API найдено: `Production` — 100+ записей; `Production – mentalix` — 100+; `Production – mentalix-preview` — 100+; `Preview` — 100+; `Preview – mentalix` — 100+; `Preview – mentalix-preview` — 100+; `github-pages` — 23. Для Vercel-сред записей больше 100, поэтому число — нижняя граница. Последние deployments `Production – mentalix` (15 сентября) и `Preview – mentalix` (16 сентября) произошли после создания используемого `cloudflare-owner-qa` (11 сентября), то есть одного лишь отсутствия ссылок в workflow недостаточно для безопасного удаления. `github-pages` имеет свежий deployment от владельца на `main`.

GitHub API для всех семи environments вернул `total_count: 0` для environment secrets, пустой `protection_rules` и `deployment_branch_policy: null`. Это означает, что по данным API сейчас не обнаружены привязанные secrets или rules; это не отменяет необходимости уточнить назначение недавно созданных deployments и возможных внешних интеграций.

## Проверка workflow-ссылок

В текущем `.github/workflows/` обнаружены только ссылки на `cloudflare-owner-qa`: в `cloudflare-owner-qa.yml` и `telegram-owner-qa-webapp.yml`. Ссылок на `Production`, `Production – mentalix`, `Production – mentalix-preview`, `Preview`, `Preview – mentalix`, `Preview – mentalix-preview` или `github-pages` не обнаружено. Поиск выполнялся по сырому тексту всех workflow-файлов, поэтому учитывал комментарии и устаревшие/закомментированные строки, если они присутствуют в этих файлах. Firebase workflow использует repository secrets и не задаёт отдельный environment.

## Финальный список

### Можно удалить

**Нет environments, которые можно рекомендовать к немедленному удалению.** Хотя текущие workflow на них не ссылаются и API не показывает environment secrets/protection rules, у всех есть история deployments, а у пяти Vercel-сред последний deployment выполнен `vercel[bot]`; для `github-pages` последний deployment выполнен владельцем на `main`.

### Нужно уточнить у владельца

**Все семь проверенных environments.** Перед удалением владелец должен подтвердить, что Vercel integration/deployment history и GitHub Pages больше не нужны, и что сохранение исторических deployment records не требуется. После такого подтверждения environments можно удалять вручную с учётом ограничения: удаление environment необратимо в части привязанных настроек и может снести secrets/protection rules, если они появятся или не отображаются текущим API-доступом.
