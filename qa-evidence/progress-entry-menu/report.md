# Экран записи «Истории» — меню не под кнопками Telegram

**Статус:** действующее доказательство прогона.
**Спецификация:** `tests/ux/progress-entry-telegram-menu.spec.mjs`, целевой конфиг `playwright.journal-history.config.mjs` (входит в CI-шаг «Run journal history profile isolation gate»).
**Команда в web-контейнере:**

```bash
docker compose -f docker-compose.base44.yml exec -T web \
  npx playwright test --config=playwright.journal-history.config.mjs progress-entry-telegram-menu.spec.mjs
```

Перед первым прогоном в свежем контейнере: `npx playwright install --with-deps chromium`.

## Что проверяется

1. **Telegram fullscreen, 393×852 и 360×640.** Платформа Telegram включена так же, как в `ai-consent-ui.spec.mjs` (`window.TelegramWebviewProxy`), launch data — как у настоящего клиента (`#tgWebAppData=…`, из неё SDK собирает `WebApp.initData`), а fullscreen подтверждается тем же событием, которое присылает клиент: `window.Telegram.WebView.receiveEvent('fullscreen_changed', { is_fullscreen: true })`. Без launch data `ScreenBack` оставался в потоке, и дефект «меню уехало влево» не воспроизводился: сначала проверяется, что собственной круглой «назад» в экране записи нет. Проверки:
   - ни один элемент экрана записи не заходит в полосу кнопок Telegram (высота берётся из `TG_CONTROLS_HEIGHT` в `src/lib/fullscreenSurface.js`, начало полосы — `--app-safe-top`);
   - кнопка «Действия с записью» стоит справа (её задаёт `margin-left: auto`, а не `space-between`) и `elementFromPoint` в её центре возвращает её же;
   - меню открывается, пункты «Пройти заново» и «Удалить» видны и лежат ниже полосы;
   - лист «AI и эта запись» того же экрана начинается ниже полосы, крестик закрытия тоже.
2. **Веб без Telegram, 393×852 и 360×640.** В собственной круглой «назад» слева, меню справа, отступ как в main: `safe-area + 8px` (полосы кнопок нет), меню открывается.

Действий с записью тест не выполняет: только открывает запись и меню, «Удалить» и «Пройти заново» не нажимаются.

Плашка демо-панели (`demo-panel-badge`, `position: fixed`, `z-index: 9999`, правый верхний угол окна) на телефонной ширине закрывает как раз кнопку меню, поэтому в веб-сценарии она скрывается стилем: это инструмент превью, а не интерфейс приложения.

## Кадры

`before/` — код main (`0acd14c`), `*.png` в корне — эта ветка.

| Состояние | 393×852 | 360×640 |
| --- | --- | --- |
| Telegram fullscreen, запись (до) | `before/tg-393x852-entry.png` | `before/tg-360x640-entry.png` |
| Telegram fullscreen, запись (после) | `tg-393x852-entry.png` | `tg-360x640-entry.png` |
| Telegram fullscreen, меню (до) | `before/tg-393x852-menu.png` | `before/tg-360x640-menu.png` |
| Telegram fullscreen, меню (после) | `tg-393x852-menu.png` | `tg-360x640-menu.png` |
| Telegram fullscreen, лист «AI» (до) | `before/tg-393x852-ai-sheet.png` | `before/tg-360x640-ai-sheet.png` |
| Telegram fullscreen, лист «AI» (после) | `tg-393x852-ai-sheet.png` | `tg-360x640-ai-sheet.png` |
| Веб, запись (до) | `before/web-393x852-entry.png` | `before/web-360x640-entry.png` |
| Веб, запись (после) | `web-393x852-entry.png` | `web-360x640-entry.png` |
| Веб, меню (до) | `before/web-393x852-menu.png` | `before/web-360x640-menu.png` |
| Веб, меню (после) | `web-393x852-menu.png` | `web-360x640-menu.png` |

## Воспроизведение дефекта на main

До исправления тот же набор падает на геометрии (обоснование — фактические замеры, не «на глаз»):

```
Expected: []
Received: [ "mx-progress-entry__top-row (top 8 < 56)",
            "progress-entry-menu-button (top 8 < 56)",
            "progress-entry-menu (top 47 < 56)", … ]
```

В эмуляции Telegram элемент в центре кнопки меню — полоса кнопок Telegram, а не кнопка. После исправления — кнопка, меню и полоса расходятся.

## Ограничения

- Настоящий iPhone и настоящий клиент Telegram — ручной gate (NOT RUN): размеры insets и полосы кнопок в прогоне эмулируются контрактом (`--app-safe-top` + 56 px).
- В эмуляции платформа Telegram объявлена через `TelegramWebviewProxy`, поэтому `ScreenBack` в прогоне остаётся в DOM (в настоящем клиенте его нет); именно поэтому полоса проверяется по контракту, а не по нарисованным пилюлям.
