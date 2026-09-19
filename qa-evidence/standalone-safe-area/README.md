# Standalone safe-area regression fix

Визуальная проверка выполнена Playwright на мобильных viewport **390×844** и **430×932** для экранов «Сегодня» и «Шаги». Проверка не подменяет safe-area значением в CSS приложения: тест подаёт профильный inset через `--tg-safe-area-inset-top`, после чего `--app-safe-top` вычисляется существующей логикой приложения.

| Viewport | Профиль                 | Safe-area top |      Старый standalone после #672 | После этого фикса |
| -------- | ----------------------- | ------------: | --------------------------------: | ----------------: |
| 390×844  | iPhone с notch          |          47px | 0px, контент заезжал в статус-бар |              47px |
| 430×932  | iPhone с Dynamic Island |          59px | 0px, контент заезжал в статус-бар |              59px |

До-скриншоты в этой директории показывают прежний дублирующий offset: `calc(var(--app-safe-top) + 47px)`, то есть 94px для профиля 47px и 106px для профиля 59px. После-скриншоты показывают ровно динамический `var(--app-safe-top)`, без фиксированного 47px поверх safe-area.

## Скриншоты

- Сегодня, 390×844: [до](../../artifacts/standalone-safe-area/before-today-390x844-standalone.png) · [после Safari](../../artifacts/standalone-safe-area/after-today-390x844-safari.png) · [после standalone](../../artifacts/standalone-safe-area/after-today-390x844-standalone.png)
- Шаги, 390×844: [до](../../artifacts/standalone-safe-area/before-practices-390x844-standalone.png) · [после Safari](../../artifacts/standalone-safe-area/after-practices-390x844-safari.png) · [после standalone](../../artifacts/standalone-safe-area/after-practices-390x844-standalone.png)
- Сегодня, 430×932: [до](../../artifacts/standalone-safe-area/before-today-430x932-standalone.png) · [после Safari](../../artifacts/standalone-safe-area/after-today-430x932-safari.png) · [после standalone](../../artifacts/standalone-safe-area/after-today-430x932-standalone.png)
- Шаги, 430×932: [до](../../artifacts/standalone-safe-area/before-practices-430x932-standalone.png) · [после Safari](../../artifacts/standalone-safe-area/after-practices-430x932-safari.png) · [после standalone](../../artifacts/standalone-safe-area/after-practices-430x932-standalone.png)

Визуальная проверка подтверждена отдельными заметками: `visual-findings-390.txt` и `visual-findings-430.txt`. Экран «Диалог» не изменялся и остаётся эталоном: его `PersonaPicker.css` продолжает использовать `padding-top: var(--app-safe-top)`.
