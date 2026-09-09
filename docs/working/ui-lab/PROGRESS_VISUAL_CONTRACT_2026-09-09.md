# Progress redesign — Visual Contract

Статус: **REFERENCE LOCK / UI LAB**, production не изменён.
Дата: 09.09.2026.
ID: `MXL-PROGRESS-REDESIGN-001`.

## Цель

Перевести композицию Progress из `IMG_6010.MP4`, `IMG_6012.MP4` и
`IMG_6013.MP4` в визуальный язык Mentalix, сохранив реальные периоды,
check-in, observations, rituals и ascezas.

## Текущее production-поведение

`src/screens/Analytics.jsx` показывает период, одно главное наблюдение,
метрики, настроение, эмоции, недельную активность, ритуалы и аскезы длинной
последовательностью блоков. PR #556/#559 улучшили только главное наблюдение.
`MXL-PROGRESS-UX-002` проверил отдельную карточку и safety CTA, но не цельную
композицию вкладки.

## Утверждённое направление UI Lab

1. Заголовок `прогресс.` и один компактный переключатель реально
   поддерживаемых периодов `7 / 14 / 30 / 90 дней`.
2. Большой hero: среднее настроение, одна строка описательного вывода и
   главный line chart.
3. Горизонтальный rail наблюдений с видимым краем следующей карточки и CSS
   `scroll-snap`.
4. Календарь состояния с точками по дням и локальным навигатором месяца.
5. Самостоятельный ярус эмоций, использующий слова из check-in.
6. Двухколоночные карточки существующих активностей: ритуалы, аскезы,
   энергия и фокус.
7. Одинаковая геометрия для `ready`, `insufficient`, `empty`, `loading` и
   `error`; фиктивные успехи в пустых состояниях не показываются.

## Визуальная грамматика

- чёрный фон и плоские графитовые поверхности;
- Onest для основного текста, Manrope/font-label для caps-eyebrow;
- радиусы 24–28 px, одна внешняя граница, без градиентов и рамки в рамке;
- один Gold-акцент на смысловой блок;
- крупный график и воздух важнее количества цифр в первом viewport;
- bottom navigation остаётся плавающей поверхностью и не меняет контракт
  `App.jsx`;
- rail реализуется только CSS overflow/scroll-snap, без document touch
  handlers.

## Сохраняемые функции и данные

- `ANALYTICS_PERIODS` и текущая загрузка `fetchTrendsData`;
- backend observations, `sampleSize`, `sourceDates`, `caveat`;
- check-in mood, energy, anxiety, focus и emotion;
- daily activity, rituals и ascezas;
- настройка `insights_enabled`;
- текущая CTA check-in для честного empty state;
- web и Telegram shell, safe-area и нижняя навигация.

## Не входит

- изменение production `Analytics.jsx` до owner PASS;
- новые backend endpoints, analytics pipeline или метрики;
- HealthKit, daylight, mindful minutes и годовой период;
- диагнозы, причинные выводы, прогнозы и обещания результата;
- premium, sharing, новые достижения или изменение AI-персон;
- редизайн нижней навигации.

## Acceptance gate UI Lab

- отдельный маршрут `?ui_lab=progress-redesign`;
- на 390×844 в первом viewport читаются header, периоды, hero и начало
  следующего яруса;
- на 320×568, 375×812, 390×844 и 430×932 нет clipping и page-level
  horizontal overflow;
- rail прокручивается и показывает край соседней карточки;
- проверяются пять data states;
- product-facing строки только на русском;
- production `src/screens/Analytics.jsx`, API и snapshots не изменены;
- `npm run check:core`, `npm run ux:check`, targeted checker и
  `git diff --check` проходят;
- перенос в production возможен только отдельным PR после owner
  iPhone/Telegram PASS.

## Rollback

Удалить route, `ProgressRedesignExperiment.jsx/.css`, контракт и targeted
tests одним revert. Production и пользовательские данные не затрагиваются.
