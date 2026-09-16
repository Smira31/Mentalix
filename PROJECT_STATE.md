---
status: current
last_verified: 2026-09-16
---

# PROJECT_STATE — подтверждённое состояние Mentalix

Этот файл содержит только проверенные факты о репозиториях, окружениях, release provenance и активных GitHub-треках. Активный backlog находится в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md). История решений находится в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

**Последняя сверка:** 16.09.2026. Проверены GitHub, Vercel integrations, Firebase Production workflow и публичные endpoints.

## Каноническое состояние

| Область             | Факт                                                                                 | Доказательство                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Frontend            | `Smira31/Mentalix`, default branch `main`                                            | [GitHub](https://github.com/Smira31/Mentalix)                                                                        |
| Frontend `main`     | merge commit `eafe13426b2077cadacbb31773ecb082a3aab41b` после PR #626                | [commit](https://github.com/Smira31/Mentalix/commit/eafe13426b2077cadacbb31773ecb082a3aab41b)                        |
| Production frontend | `main → Firebase Hosting Live channel → https://mentalix-production.web.app`         | Firebase workflow run [35114685506](https://github.com/Smira31/Mentalix/actions/runs/35114685506), success; HTTP 200 |
| Demo Preview        | Cloudflare Pages project `mentalix-owner-qa` → `https://mentalix-owner-qa.pages.dev` | workflow [Cloudflare Owner QA](https://github.com/Smira31/Mentalix/actions/workflows/cloudflare-owner-qa.yml)        |
| Backend             | `Smira31/mentalix-bot`, `main`                                                       | [GitHub](https://github.com/Smira31/mentalix-bot)                                                                    |
| Backend runtime     | `https://mentalix-bot.onrender.com/api/health`                                       | Render; CORS разрешает Firebase Production и Cloudflare Demo origins                                                 |
| Vercel              | Git integration отключена у проектов `mentalix` и `mentalix-preview`                 | Vercel git context: linked projects отсутствуют                                                                      |

## Канонический словарь окружений

- **Demo Preview:** Cloudflare Pages, ручной exact-SHA deploy для быстрой визуальной и Telegram/iPhone QA-проверки.
- **Production:** Firebase Hosting Live channel, автоматический deploy только из `main`.
- **Local Preview:** `vite preview` после production build.
- **UI Lab:** экспериментальные маршруты внутри репозитория; не Production.
- **Vercel:** старый fallback, не используется для новых deploy/checks.

## Hosting policy

1. Разработка и быстрая визуальная проверка выполняются через Cloudflare Demo Preview.
2. После QA изменения проходят обычный PR и обязательный GitHub check `Базовая проверка проекта`.
3. Merge в `main` запускает Firebase Hosting Production deploy.
4. Firebase Preview Channels, Vercel Preview и Vercel watchdog не используются.
5. Render backend не переносится в рамках frontend-задач.

Полная policy: [`docs/handoffs/2026-09-16-hosting-policy.md`](docs/handoffs/2026-09-16-hosting-policy.md).

## GitHub после cleanup

| Объект  | Состояние                                                                               |
| ------- | --------------------------------------------------------------------------------------- |
| PR #626 | Смёржен; Firebase migration, auth/session compatibility, desktop frame и hosting policy |
| PR #625 | Закрыт как устаревший дубль PR #626                                                     |
| PR #624 | Закрыт как устаревший дубль PR #626                                                     |
| PR #621 | Закрыт как устаревший дубль PR #626                                                     |
| PR #616 | Открыт; полезный Telegram P0 QA evidence, требует обновления ветки после migration      |
| PR #622 | Открыт; reference assets web-auth, требует отдельного решения о сохранении/переносе     |

Текущий активный backlog находится только в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md). Открытые issues не считаются автоматически взятыми в работу: каждая должна иметь ясный scope и следующий decision gate.

## Ограничения подтверждения

Зелёный CI и HTTP 200 не заменяют manual iPhone/Telegram gate. Нельзя объявлять safe-area, keyboard, Telegram WebView или data-dependent сценарии пройденными без соответствующей ручной проверки.

## References

[1]: https://github.com/Smira31/Mentalix/commit/eafe13426b2077cadacbb31773ecb082a3aab41b 'Current frontend main'
[2]: https://mentalix-production.web.app 'Mentalix Firebase Production'
[3]: https://mentalix-owner-qa.pages.dev 'Mentalix Cloudflare Demo Preview'
[4]: https://github.com/Smira31/Mentalix/actions/workflows/firebase-hosting.yml 'Firebase Hosting workflow'
