---
status: current
last_verified: 2026-09-16
---

# Mentalix

Mentalix — Telegram Mini App и веб-приложение, помогающее превращать понимание в небольшие ежедневные действия и постепенно выстраивать более устойчивые способы поведения.

## С чего начать

1. **Текущее подтверждённое состояние:** [`PROJECT_STATE.md`](PROJECT_STATE.md).
2. **Активный backlog:** [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md).
3. **Правила работы агента:** [`AGENTS.md`](AGENTS.md) и [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md).
4. **Карта документации:** [`docs/INDEX.md`](docs/INDEX.md).

## Каноническая инфраструктура

| Назначение              | Платформа        | Канонический адрес / правило                                                           |
| ----------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| **Demo Preview**        | Cloudflare Pages | <https://mentalix-owner-qa.pages.dev>; ручной запуск для exact-SHA визуальной проверки |
| **Production frontend** | Firebase Hosting | <https://mentalix-production.web.app>; автоматически из `main`                         |
| **Backend/API**         | Render           | <https://mentalix-bot.onrender.com>; отдельный репозиторий `Smira31/mentalix-bot`      |
| **Vercel**              | отключён         | Не используется для новых deploy/checks; старый fallback не является источником истины |

**Важно:** Firebase Preview Channels не используются. Demo Preview не является Production и не должен работать с production-данными без отдельного решения.

## Разработка

```bash
npm install
npm run dev
```

Для локального production-like просмотра:

```bash
npm run build
npm run preview
```

Перед Pull Request:

```bash
npm run check:core
```

Для изменений UI, safe area, keyboard, fullscreen или Telegram дополнительно:

```bash
npm run ux:check
```

Для ручной Demo-проверки используется GitHub Actions → **Cloudflare Owner QA** с полным 40-символьным SHA. Production обновляется только после merge в `main` и успешного Firebase workflow.

## Документация

| Вопрос                                             | Источник                                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Что сейчас развернуто и какой commit в Production? | [`PROJECT_STATE.md`](PROJECT_STATE.md)                                                     |
| Как устроен процесс и окружения?                   | [`docs/handoffs/2026-09-16-hosting-policy.md`](docs/handoffs/2026-09-16-hosting-policy.md) |
| Как начать работу агенту?                          | [`docs/AGENT_ONBOARDING.md`](docs/AGENT_ONBOARDING.md)                                     |
| Какие задачи активны?                              | [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md)                                                 |
| Где карта документов?                              | [`docs/INDEX.md`](docs/INDEX.md)                                                           |
| История изменений и старые handoffs                | [`CHANGES.md`](CHANGES.md), [`TASKS.md`](TASKS.md), [`docs/archive/`](docs/archive/)       |

При конфликте приоритет такой: **явная команда владельца → актуальный код и GitHub → нормативная документация → архив**. Старые Vercel-only документы не описывают текущий deploy-процесс.

## Стек

Frontend: React, Vite, Tailwind. Backend: отдельный FastAPI/SQLAlchemy/aiogram репозиторий, PostgreSQL и Render. Firebase Hosting не проксирует API: браузер обращается к Render напрямую, поэтому CORS backend должен разрешать Firebase Production и Cloudflare Demo origins.

## Дизайн

Актуальные токены, типографика и UI-правила находятся в [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). Не дублируйте численные значения в новых документах.
