# Safe-area в PWA iOS (standalone) — issues #1151 и #1156

Проверка Playwright (Chromium) на viewport **393×852** и **360×640** для экранов
«Сегодня», «Шаги» (вкладка с шапкой «практики.» и каталогом практик) и «Диалог».
Эмулированные условия iPhone: safe-area сверху **47px**, оболочка без
Telegram-fullscreen (`?demo=1&frame=0`), standalone-блок взят дословно из
`src/index.css`.

Сценарий: `scripts/standalone-safe-area-screenshots.mjs`.
Скриншоты: `before-*.png` — состояние после #1153 (шапка ровно на границе строки
статуса), `after-*.png` — после #1156 (зазор `--mx-space-4` = 16px).
Числа: `before-metrics.json` (`SHOT_GAP=0`), `after-metrics.json` (`SHOT_GAP=16`).

## Причина

`index.html` просит `apple-mobile-web-app-status-bar-style=black-translucent`, поэтому
в PWA страница занимает весь экран вместе со строкой статуса, а её высота приходит
только в `env(safe-area-inset-top)`. Оболочка `App` владеет всей высотой (`100dvh`),
и её верхний отступ — единственный в приложении (шапки вкладок своего не добавляют).
#1151 вернул этот inset (правило #698 обнуляло его), #1156 добавил к нему зазор:
граница inset — это ровно низ строки статуса, и шапка выглядела прижатой.

## Замеры

Верх шапки — `getBoundingClientRect().top` элемента шапки; «Оболочка» — `padding-top`
у `.mx-app-shell`; «Затухание» — верх `.mx-scroll-fade-top`.

| Экран   | Viewport | Safari, шапка | Standalone до | Standalone после | Оболочка до → после | Затухание до → после |
| ------- | -------: | ------------: | ------------: | ---------------: | ------------------: | -------------------: |
| Сегодня |  393×852 |           47px |           47px |             63px |        47px → 63px |          47px → 63px |
| Шаги    |  393×852 |           51px |           51px |             67px |        47px → 63px |          47px → 63px |
| Диалог  |  393×852 |          122px |          122px |            122px |        47px → 47px |          47px → 47px |
| Сегодня |  360×640 |           47px |           47px |             63px |        47px → 63px |          47px → 63px |
| Шаги    |  360×640 |           51px |           51px |             67px |        47px → 63px |          47px → 63px |
| Диалог  |  360×640 |          112px |          112px |            112px |        47px → 47px |          47px → 47px |

После #1156 шапка в PWA ниже, чем в Safari, ровно на зазор (16px), второго inset нет:
оболочка и шапка смещаются на одну и ту же величину. Слой затухания стоит на верху
контента (как в Safari) — при прокрутке шапка гаснет одинаково, без «прыжка».
«Диалог» не изменился: у него свой контракт.

## Перекрытие верхним слоем

Проверено в standalone-состоянии: `opacity` слоя `.mx-scroll-fade-top` в покое — `0`,
`document.elementFromPoint` в верхней точке шапки возвращает элемент внутри самой
шапки (колонка «Верх шапки — её» в `after-metrics.json`). Рамки, blur и
полупрозрачного фона над шапкой нет: оболочка — сплошной `--c-bg`, слой затухания
появляется только при прокрутке. Шапка в PWA той же яркости и резкости, что в Safari.

## Скриншоты

- Сегодня: [до](before-standalone-today-393x852.png) · [после](after-standalone-today-393x852.png) · 360×640: [до](before-standalone-today-360x640.png) · [после](after-standalone-today-360x640.png)
- Шаги: [до](before-standalone-practices-393x852.png) · [после](after-standalone-practices-393x852.png) · 360×640: [до](before-standalone-practices-360x640.png) · [после](after-standalone-practices-360x640.png)
- Диалог (без изменений): [до](before-standalone-mentor-393x852.png) · [после](after-standalone-mentor-393x852.png) · 360×640: [до](before-standalone-mentor-360x640.png) · [после](after-standalone-mentor-360x640.png)
- Safari (без standalone-блока) — те же три экрана в двух размерах: `*-safari-*.png`.

## Ручной gate (iPhone)

Chromium не доказывает поведение iOS: нужно удалить иконку с экрана «Домой», добавить
заново, открыть «Сегодня» и «Шаги», прокрутить вниз и обратно — шапка должна стоять с
зазором под строкой статуса, читаться так же чётко, как в Safari, и не съезжать при
прокрутке. В Safari, Telegram и «Диалоге» ничего не изменилось.
