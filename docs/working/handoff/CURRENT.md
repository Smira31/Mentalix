# CURRENT — Scope A / Progress

## Задача и scope

Закрытие Scope A для экрана «Прогресс» в PR #569 без merge, без включения `VITE_PROGRESS_LAYOUT_V2` в Production и без изменения API, данных, агрегации, периода, карусели и поведения сворачивания BottomNavigation.

## Ветка

`feat/progress-layout-scope-a`

## Головной SHA

`03b7e608b17149405d99bd3f38b28e1e3988a237`.

## Что сделано

В `src/screens/Analytics.jsx` заголовки «Что повторяется», «Календарь», «Эмоции», «Активности» находятся внутри соответствующих карточек; капс-заголовки оставлены отдельной левой строкой. В `src/screens/Analytics.css` для v2 добавлены отступы, типографика капсов и дисциплина акцента: акцент снят с капсов, прогресс-баров и ссылки «Показать аскезы». Сохранён `padding-right: 20px` rail из #568; v2 override обнуляет только старую ui-lab-компенсацию `margin-right: -20px` и `padding-right: 38px`, не production padding.

Иконка вкладки «Прогресс» больше не использует `SemanticGlyph next-step`: в `src/components/BottomNavigation.jsx` оставлен TODO для выбора владельцем финального glyph накопленного результата. Поведение вкладки и collapsed BottomNavigation не менялись.

Пройдены проверки:

```text
npm run lint — PASS
npm run test:unit — PASS
npm run build — PASS
npm run ux:progress-production — legacy: 320x568, 375x812, 390x844, 430x932 PASS
VITE_PROGRESS_LAYOUT_V2=true npm run ux:progress-production — v2: 320x568, 375x812, 390x844, 430x932 PASS
```

В v2 production gate минимальные размеры текста были проверены и прошли: `observationBodySize=13`, `calendarNoteSize=13`, `emotionRowSize=13`, `activityLabelSize=13`, `activityDetailSize=12`; условие gate требует каждый размер не менее 12px. Ellipsis в рамках этих изменений не возвращался.

Вручную с локальными API-моками сняты пары ON/OFF для 390x844: `empty`, `insufficient`, `loading`. Снапшоты сохранены в `docs/working/handoff/shots/` и закоммичены в ветку. Изменены/добавлены следующие бинарные снапшоты: четыре gate-снимка `scopeA_320x568_{on,off}.png` и `scopeA_390x844_{on,off}.png`, а также шесть ручных снимков `scopeA_390x844_{on,off}_{empty,insufficient,loading}.png`. Их изменение ожидаемо: это локальные артефакты приёмки Scope A, отражающие ON/OFF layout и три мок-состояния; production UI и данные ими не меняются. Снапшоты `03-practices` не тронуты.

## Что не сделано

Финальный смысловой glyph для вкладки «Прогресс» не выбран: это оставлено TODO владельцу, как требовалось. Отдельного обновления production gate для ручных мок-состояний не выполнялось; ручные состояния сняты отдельным одноразовым dev-моком и не добавлены в production gate.

## Найденные причины с файлом и строкой

- `src/screens/Analytics.jsx:7` — production Analytics напрямую импортирует `src/components/ui-lab/ProgressRedesignExperiment.css`; ui-lab-файл не изменялся, v2 override размещён в `src/screens/Analytics.css`.
- `src/components/PracticeCatalogV2.jsx:7` — production-компонент импортирует `src/components/ui-lab/LayeredPracticeCatalogExperiment.css`.
- `src/main.jsx:24,45,49` — условные entrypoint-импорты `UiLab`, `PracticeMotionKit`, `CardDirectionsLab` из ui-lab.
- `scripts/mxl-progress-production-check.mjs:141-169` — gate проверяет overflow, rail-scroll, границы production-контента, composition и минимальный размер текста; v2/legacy условия не ослабляют проверки.

## Production leakage report

| Production-файл                          | Импорт из `src/components/ui-lab/*`    |
| ---------------------------------------- | -------------------------------------- |
| `src/screens/Analytics.jsx:7`            | `ProgressRedesignExperiment.css`       |
| `src/components/PracticeCatalogV2.jsx:7` | `LayeredPracticeCatalogExperiment.css` |
| `src/main.jsx:24`                        | lazy `UiLab`                           |
| `src/main.jsx:45`                        | lazy `PracticeMotionKit`               |
| `src/main.jsx:49`                        | lazy `CardDirectionsLab`               |

## Открытые вопросы владельцу

Какой финальный `SemanticGlyph` использовать для вкладки накопленного результата «Прогресс» вместо временного TODO.

## Следующий конкретный шаг одной фразой

Владелец выбирает финальный glyph; до этого Scope A закрыт без включения v2 в Production.
