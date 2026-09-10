# CURRENT — Scope A / Progress

## Задача и scope

Завершить Scope A для экрана «Прогресс» в PR #569 без merge, без включения `VITE_PROGRESS_LAYOUT_V2` в Production и без изменения API, данных, агрегации, периода, карусели и поведения сворачивания BottomNavigation.

## Ветка

`feat/progress-layout-scope-a`

## Головной SHA

`bd83797d0ab5f85ab5439641638a2c488ce9aa7e`.

## Что сделано

Восстановлен контекст PR #569 и подтверждено исходное состояние ветки. В production-экране `Analytics.jsx` заголовки карточек «Что повторяется», «Календарь», «Эмоции», «Активности» перемещены внутрь соответствующих карточек; капс-заголовки оставлены отдельной левой строкой. В `Analytics.css` для v2 добавлены отступы, типографика капсов, заголовки карточек и дисциплина акцента: акцент снят с капсов, прогресс-баров и ссылки «Показать аскезы». Иконка вкладки «Прогресс» заменена с `AlignJustify` на существующий `SemanticGlyph` (`next-step`), поведение вкладки не изменено.

## Что не сделано

Lint, unit и build пройдены. Production gate пройден отдельно в legacy и v2 режимах: 320/375/390/430 — PASS. В `docs/working/handoff/shots/` сохранены локальные снимки gate для 320x568 и 390x844 с именами ON/OFF; отдельные empty/insufficient/loading-варианты не генерировались существующим gate и остаются ограничением этой сессии. Описание PR ещё нужно обновить после финального коммита.

## Найденные причины с файлом и строкой

- `src/screens/Analytics.jsx:7` — production Analytics напрямую импортирует `src/components/ui-lab/ProgressRedesignExperiment.css`; ui-lab-файл не изменяется в этом scope, v2 override размещён в `src/screens/Analytics.css`.
- `src/components/PracticeCatalogV2.jsx:7` — production-компонент импортирует `src/components/ui-lab/LayeredPracticeCatalogExperiment.css`.
- `src/main.jsx:24,45,49` — условные production entrypoint-импорты `UiLab`, `PracticeMotionKit`, `CardDirectionsLab` из ui-lab.
- `scripts/mxl-progress-production-check.mjs:141-169` — gate проверяет overflow, composition и минимальный размер текста; строки 155-159 адаптированы под v2/legacy период-контролы. Адаптация не ослабляет проверки: в v2 требуется layout-класс и отсутствие legacy period buttons, в legacy — ровно четыре периода.

## Production leakage report

| Production-файл                          | Импорт из `src/components/ui-lab/*`    |
| ---------------------------------------- | -------------------------------------- |
| `src/screens/Analytics.jsx:7`            | `ProgressRedesignExperiment.css`       |
| `src/components/PracticeCatalogV2.jsx:7` | `LayeredPracticeCatalogExperiment.css` |
| `src/main.jsx:24`                        | lazy `UiLab`                           |
| `src/main.jsx:45`                        | lazy `PracticeMotionKit`               |
| `src/main.jsx:49`                        | lazy `CardDirectionsLab`               |

## Открытые вопросы владельцу

Финального semantic glyph с названием `progress` в `SemanticGlyph` нет; использован существующий `next-step` как ближайший смысловой glyph. Если владельцу нужен отдельный специализированный glyph, это отдельный scope, новая графика в Scope A не добавляется.

## Следующий конкретный шаг одной фразой

Запустить проверки, собрать обязательные локальные скриншоты и обновить описание PR #569 полным текущим текстом.
