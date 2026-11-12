# Даймон: «без лимита» для Pro — доказательства

Ветка `daimon-unlimited-pro`, база — `main` (b54b0f0). Бэкенд mentalix-bot #254 отдаёт
`throws_limit = null` и `throws_unlimited = true`.

## Что проверено

| Сценарий | Ожидание | Результат |
| --- | --- | --- |
| Pro: `throws_limit = null`, `throws_unlimited = true`, `throws_today = 7` | бросок активен, «Сегодня без лимита бросков», HelpView «Бросков в день — без лимита» | PASS |
| Free: `throws_limit = 3`, `throws_today = 3` | бросок неактивен, «На сегодня всё. Возвращайся завтра — Даймон подождёт.» | PASS |
| Старый ответ: поля `throws_unlimited` нет, `throws_limit = 3`, `throws_today = 1` | бросок активен, «Осталось бросков сегодня: 2», HelpView «В день — 3 броска: …» | PASS |

## Кадры 393×852

- `free-0-left-393x852.png` — Free, 0 бросков осталось: кнопка неактивна.
- `pro-unlimited-393x852.png` — Pro без лимита: кнопка активна, строка «Сегодня без лимита бросков».
- `pro-help-393x852.png` — «Как играть»: «Бросков в день — без лимита».

## Команды

```bash
npm run check:core
npx playwright test --config=playwright.daimon.config.mjs --project=chromium
```

- `check:core` — PASS (unit, lint, build, content-leak, docs:check).
- Playwright Chromium — 18/19 PASS. Единственное падение — `гостевой отказ ведёт в тот же
  email-вход, что Профиль`: в песочнице `VITE_EMAIL_LOGIN_ENABLED=false` (прод-конфигурация
  из `docker-compose.base44.yml`), экран не рисует email-поле. Падение воспроизведено на
  исходных файлах без правок задачи тем же тестом, к изменённым файлам не относится.
- WebKit (второй проект `playwright.daimon.config.mjs`) — NOT RUN: в песочнице установлен
  только Chromium.
