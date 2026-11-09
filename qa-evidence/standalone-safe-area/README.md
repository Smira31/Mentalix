# Safe-area в PWA iOS (standalone) — issue #1151

Проверка Playwright (Chromium) на viewport **393×852** и **360×640** для экранов
«Сегодня», «Шаги» и «Диалог». Эмулированные условия iPhone: safe-area сверху
**47px**, оболочка без Telegram-fullscreen (`?demo=1&frame=0`), standalone-блок
взят дословно из `src/index.css`.

Сценарий: `scripts/standalone-safe-area-screenshots.mjs`.
Скриншоты: `before-*.png` — до исправления, `after-*.png` — после.
Числа: `before-metrics.json`, `after-metrics.json`.

## Причина

`index.html` просит `apple-mobile-web-app-status-bar-style=black-translucent`, поэтому
в PWA страница занимает весь экран вместе со строкой статуса, а её высота приходит
только в `env(safe-area-inset-top)`. Оболочка `App` владеет всей высотой (`100dvh`),
и её верхний отступ — единственный в приложении (шапки вкладок своего не добавляют).
Правило #698 заменило этот отступ на `padding-top: 0 !important` и оставило обычные
вкладки без inset — шапки «Сегодня» и «Шаги» начинались под строкой статуса.

## Замеры

Верх шапки — `getBoundingClientRect().top` элемента шапки; «Оболочка» — `padding-top`
у `.mx-app-shell`.

| Экран    | Viewport | Safari, шапка | Standalone до | Standalone после | Оболочка до/после |
| -------- | -------: | ------------: | ------------: | ---------------: | ----------------: |
| Сегодня  |  393×852 |           47px |           0px |             47px |        0px → 47px |
| Шаги     |  393×852 |           51px |           4px |             51px |        0px → 47px |
| Диалог   |  393×852 |          122px |          122px |            122px |       47px → 47px |
| Сегодня  |  360×640 |           47px |           0px |             47px |        0px → 47px |
| Шаги     |  360×640 |           51px |           4px |             51px |        0px → 47px |
| Диалог   |  360×640 |          112px |          112px |            112px |       47px → 47px |

После исправления standalone совпадает с Safari: inset ровно один, второго отступа
нет. «Диалог» и полноэкранные поверхности не изменились — у них свой контракт.

## Скриншоты

- Сегодня: [до](before-standalone-today-393x852.png) · [после](after-standalone-today-393x852.png) · 360×640: [до](before-standalone-today-360x640.png) · [после](after-standalone-today-360x640.png)
- Шаги: [до](before-standalone-practices-393x852.png) · [после](after-standalone-practices-393x852.png) · 360×640: [до](before-standalone-practices-360x640.png) · [после](after-standalone-practices-360x640.png)
- Диалог (без изменений): [до](before-standalone-mentor-393x852.png) · [после](after-standalone-mentor-393x852.png) · 360×640: [до](before-standalone-mentor-360x640.png) · [после](after-standalone-mentor-360x640.png)

## Ручной gate (iPhone)

Chromium не доказывает поведение iOS: нужно добавить сайт на экран «Домой» и
проверить, что «Сегодня» и «Шаги» начинаются ниже строки статуса, «Диалог» не
съехал, в Safari и в Telegram Mini App ничего не изменилось.
