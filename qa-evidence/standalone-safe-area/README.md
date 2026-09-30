# Синхронизация safe-area для Safari standalone

Визуальная проверка выполнена Playwright на мобильных viewport **390×844** и **430×932** для экранов «Сегодня» и «Шаги».

В эмуляции iOS safe-area задан как 47px. До исправления обычные вкладки получали этот inset повторно на внешней оболочке App; после исправления регулярные вкладки используют `padding-top: 0`, как эталонный «Диалог».

| Экран   | Viewport | Обычный Safari после | Standalone до | Standalone после |
| ------- | -------: | -------------------: | ------------: | ---------------: |
| Сегодня |  390×844 |                  0px |          47px |              0px |
| Шаги    |  390×844 |                  0px |          47px |              0px |
| Сегодня |  430×932 |                  0px |          47px |              0px |
| Шаги    |  430×932 |                  0px |          47px |              0px |

## Скриншоты

- Сегодня, 390×844: до _(artifacts/standalone-safe-area/before-today-390x844-standalone.png)_ · после Safari _(artifacts/standalone-safe-area/after-today-390x844-safari.png)_ · после standalone _(artifacts/standalone-safe-area/after-today-390x844-standalone.png)_
- Шаги, 390×844: до _(artifacts/standalone-safe-area/before-practices-390x844-standalone.png)_ · после Safari _(artifacts/standalone-safe-area/after-practices-390x844-safari.png)_ · после standalone _(artifacts/standalone-safe-area/after-practices-390x844-standalone.png)_
- Сегодня, 430×932: до _(artifacts/standalone-safe-area/before-today-430x932-standalone.png)_ · после Safari _(artifacts/standalone-safe-area/after-today-430x932-safari.png)_ · после standalone _(artifacts/standalone-safe-area/after-today-430x932-standalone.png)_
- Шаги, 430×932: до _(artifacts/standalone-safe-area/before-practices-430x932-standalone.png)_ · после Safari _(artifacts/standalone-safe-area/after-practices-430x932-safari.png)_ · после standalone _(artifacts/standalone-safe-area/after-practices-430x932-standalone.png)_

Скриншоты «до» получены тем же сценарием с принудительным старым резервом 47px; скриншоты «после» — с текущим CSS-правилом standalone.
