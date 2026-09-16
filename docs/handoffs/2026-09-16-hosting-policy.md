# Mentalix Hosting Policy

**Дата:** 16 сентября 2026 года  
**Статус:** действующее правило для дальнейшей разработки

## Каноническая схема

| Назначение                                    | Платформа        | Правило                                                                                                                          |
| --------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Быстрая разработка и визуальная Demo-проверка | Cloudflare Pages | Публиковать Demo Preview из Demo-ветки; использовать synthetic/demo mode и не подключать production data без отдельной проверки. |
| Рабочий Production frontend                   | Firebase Hosting | Публиковать только из `main` через Firebase Live channel.                                                                        |
| Backend/API                                   | Render           | Не переносить и не менять без отдельной задачи; канонический URL — `https://mentalix-bot.onrender.com`.                          |
| Отключённый legacy fallback                   | Vercel           | Git integration отключена; это не действующее окружение и не канонический Preview или Production.                               |

## Запрещённые по умолчанию действия

Firebase Preview Channels для Pull Request не используются. Vercel Preview и Vercel deployment watchdog не используются. Новые платформы или дополнительные hosting environments не добавляются без явного изменения этой policy.

## Рабочий процесс

1. Разработка и быстрая визуальная проверка выполняются через Cloudflare Demo Preview.
2. После ручного QA изменения попадают в `main` обычным PR-процессом.
3. Push в `main` запускает Firebase Hosting Production deploy.
4. После Production deploy проверяются email auth, Safari/PWA, desktop frame, Telegram Mini App и ключевые API flows.
5. DNS и custom domain не меняются автоматически; отключённый Vercel legacy fallback не активируется и не удаляется без отдельного решения.

## Среда и API

Firebase Production frontend использует публичную переменную `VITE_API_BASE_URL=https://mentalix-bot.onrender.com/api`. Firebase Hosting не проксирует API на Render; browser requests идут напрямую на Render и должны быть разрешены его CORS allowlist.

Cloudflare Demo сохраняется как отдельная среда и не заменяется Firebase Production. Production data и backend не должны использоваться для synthetic Demo flows.
