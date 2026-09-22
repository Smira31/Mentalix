---
status: current
last_verified: 2026-09-22
---

# PROJECT_STATE — подтверждённое состояние Mentalix

Этот файл содержит только проверенные факты о репозиториях, окружениях, release provenance и активных GitHub-треках. Активный backlog находится в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md). История решений находится в [`TASKS.md`](TASKS.md), [`CHANGES.md`](CHANGES.md) и `docs/archive/`.

**Последняя сверка:** 22.09.2026. Проверены GitHub, текущий `main` после PR #745 и документный архив.

Текущий `main`: `2296074191b2a42d56053d881414cadd35c65929`.

## Каноническое состояние

| Область             | Факт                                                                                 | Доказательство                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Frontend            | `Smira31/Mentalix`, default branch `main`                                            | [GitHub](https://github.com/Smira31/Mentalix)                                                                        |
| Frontend `main`     | commit `2296074191b2a42d56053d881414cadd35c65929` после мержа PR #745 с аудитом документации | [commit](https://github.com/Smira31/Mentalix/commit/2296074191b2a42d56053d881414cadd35c65929)                        |
| Production frontend | `main → Firebase Hosting Live channel → https://mentalix-production.web.app`         | Firebase workflow run [35119350799](https://github.com/Smira31/Mentalix/actions/runs/35119350799), success; HTTP 200 |
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

Снимок GitHub API на 22.09.2026.

| Объект          | Состояние                                                                               |
| --------------- | --------------------------------------------------------------------------------------- |
| PR #626         | Смёржен; Firebase migration, auth/session compatibility, desktop frame и hosting policy |
| PR #628         | Смёржен; завершён cleanup активной документации и GitHub-состояния                      |
| Открытые PR     | `3` по GitHub API: #732, #733 и #742                                                  |
| Открытые Issues | `13`; автоматически не закрывались                                                     |
| Remote branches | `10` вместе с `main` по GitHub API                                                     |

Текущий активный backlog находится только в [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md). Открытые issues не считаются автоматически взятыми в работу: каждая должна иметь ясный scope и следующий decision gate.

## Исторический документный контекст

Одноразовые аудиты доступности практик, fullscreen-flow и SHA-синхронизации сохранены в [`docs/audit/archive/`](docs/audit/archive/) и не являются текущим production-контрактом. Канонический текущий статус репозитория находится в этом файле; архивные отчёты используются только для исторического контекста и traceability.

## Ограничения подтверждения

Зелёный CI и HTTP 200 не заменяют manual iPhone/Telegram gate. Нельзя объявлять safe-area, keyboard, Telegram WebView или data-dependent сценарии пройденными без соответствующей ручной проверки.

## References

[1]: https://github.com/Smira31/Mentalix/commit/2296074191b2a42d56053d881414cadd35c65929 'Current frontend main'
[2]: https://mentalix-production.web.app 'Mentalix Firebase Production'
[3]: https://mentalix-owner-qa.pages.dev 'Mentalix Cloudflare Demo Preview'
[4]: https://github.com/Smira31/Mentalix/actions/workflows/firebase-hosting.yml 'Firebase Hosting workflow'
