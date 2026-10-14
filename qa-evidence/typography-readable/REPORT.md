# MXL-TYPE-READABLE-001 — фактические размеры и сравнение до/после

Viewport: 393x852, 360x640. Значения — computed font-size в px.
Фаза `before` — код до шкалы (`origin/main`, `0d95270a`), `after` — с новой шкалой; состояния и измерения одинаковые.

Кадры фаз лежат рядом с измерениями: `qa-evidence/typography-readable/<фаза>/<вьюпорт>/`
(клавиатурный прогон — `<фаза>/keyboard/`). Съёмка идёт через `createEvidenceWriter`:
кадр делается только после входа полноэкранного слоя и при наличии признака экрана,
пустой кадр и кадр, совпавший с другим состоянием, считаются ошибкой прогона.
Пересобрать evidence: `MX_TYPE_PHASE=before|after npm run ux:typography`, затем эта команда.

## 393x852

| Поверхность | Состояние | Роль | Цель | before | after | Δ | Итог |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Сегодня |  | cardTitle (keep) | — | 17.2 | 17.2 | 0 | вне шкалы |
| Сегодня |  | cardStart (keep) | — | 14.62 | 14.62 | 0 | вне шкалы |
| Сегодня |  | quote (keep) | — | 14.62 | 14.62 | 0 | вне шкалы |
| Сегодня |  | practiceTitle (caption) | 13 | 12.04 | 13 | +0.96 | ✔ |
| Сегодня |  | pulse (caption) | 13 | 11 | 13 | +2 | ✔ |
| Сегодня |  | weekDay (keep) | — | 11 | 11 | 0 | вне шкалы |
| Сегодня |  | metaLabel (caption) | 13 | 11 | 13 | +2 | ✔ |
| Чек-ин (утро) | вопрос | question (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Чек-ин (утро) | вопрос | hint (note) | 14 | 12.9 | 14 | +1.1 | ✔ |
| Чек-ин (утро) | вопрос | scaleLabel (caption) | 13 | 11 | 13 | +2 | ✔ |
| Чек-ин (утро) | вопрос | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Чек-ин (утро) | фокус дня | question (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Чек-ин (утро) | фокус дня | hint (note) | 14 | 12.9 | 14 | +1.1 | ✔ |
| Чек-ин (утро) | фокус дня | focusTile (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Чек-ин (утро) | фокус дня | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Чек-ин (утро) | поле записи | question (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Чек-ин (утро) | поле записи | hint (note) | 14 | 12.9 | 14 | +1.1 | ✔ |
| Чек-ин (утро) | поле записи | input (read) | 16 | 17 | 16 | -1 | ✔ |
| Чек-ин (утро) | поле записи | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Чек-ин (утро) | финал | title (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Чек-ин (утро) | финал | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Чек-ин (утро) | финал | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Чек-ин (утро) | финал | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Чек-ин (утро) | финал | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Разбор дня (вечер) | вопрос | question (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Разбор дня (вечер) | вопрос | hint (note) | 14 | 12.9 | 14 | +1.1 | ✔ |
| Разбор дня (вечер) | вопрос | scaleLabel (caption) | 13 | 11 | 13 | +2 | ✔ |
| Разбор дня (вечер) | вопрос | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Разбор дня (вечер) | эмоции | question (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Разбор дня (вечер) | эмоции | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Разбор дня (вечер) | эмоции | eveningQuestion (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Разбор дня (вечер) | эмоции | emotionTile (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Разбор дня (вечер) | поле записи | question (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Разбор дня (вечер) | поле записи | hint (note) | 14 | 11.18 | 14 | +2.82 | ✔ |
| Разбор дня (вечер) | поле записи | input (read) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Разбор дня (вечер) | поле записи | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Разбор дня (вечер) | поле записи | eveningQuestion (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Разбор дня (вечер) | поле записи | eveningHint (note) | 14 | 11.18 | 14 | +2.82 | ✔ |
| Разбор дня (вечер) | финал | title (ask) | 24 | 25.8 | 24 | -1.8 | ✔ |
| Разбор дня (вечер) | финал | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Разбор дня (вечер) | финал | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Разбор дня (вечер) | финал | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Разбор дня (вечер) | финал | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Финал утра (превью) |  | title (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Финал утра (превью) |  | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Финал утра (превью) |  | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Финал утра (превью) |  | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Финал утра (превью) |  | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Финал вечера (превью) |  | title (ask) | 24 | 25.8 | 24 | -1.8 | ✔ |
| Финал вечера (превью) |  | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Финал вечера (превью) |  | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Финал вечера (превью) |  | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Финал вечера (превью) |  | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Дневник | настройка | setupQuestion (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | настройка | setupInput (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | ревью цели | reviewTitle (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | ревью цели | reviewItem (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | ревью цели | reviewNote (note) | 14 | 13.76 | 14 | +0.24 | ✔ |
| Дневник | ревью цели | entriesBtn (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Дневник | поток | streamTitle (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | поток | streamHint (note) | 14 | 12.04 | 14 | +1.96 | ✔ |
| Дневник | поток | streamField (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | вопрос дня | questionText (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | вопрос дня | questionField (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | финал записи | title (ask) | 24 | 25.8 | 24 | -1.8 | ✔ |
| Дневник | финал записи | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Дневник | финал записи | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Дневник | финал записи | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Дневник | финал записи | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Дневник | запись за сегодня | todayTitle (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | запись за сегодня | todayText (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | запись за сегодня | todayAppend (action) | 16 | 16 | 16 | 0 | ✔ |
| Дневник | запись за сегодня | todayPill (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Дневник | мои записи | entriesItemStream (read) | 16 | 12.9 | 16 | +3.1 | ✔ |
| Дневник | мои записи | entriesItemQuestion (note) | 14 | 12.04 | 14 | +1.96 | ✔ |

**Итог по инвентарю 393x852:** изменено 149 из 422 сопоставимых элементов, уменьшилось 29, увеличилось 120.

<details><summary>Уменьшения</summary>

| Элемент | before | after | Δ |
| --- | --- | --- | --- |
| `checkinEvening.completion / strong. / Ты завершил` | 25.8 | 24 | -1.8 |
| `checkinEvening.completion / span. / разбор дня.` | 25.8 | 24 | -1.8 |
| `completeEvening / strong. / Ты завершил` | 25.8 | 24 | -1.8 |
| `completeEvening / span. / разбор дня.` | 25.8 | 24 | -1.8 |
| `journal.complete / strong. / Запись` | 25.8 | 24 | -1.8 |
| `journal.complete / span. / сохранена.` | 25.8 | 24 | -1.8 |
| `checkinMorning.s0 / h1. / Как ты сейчас?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s1 / h1. / Как ты сейчас?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s2 / h1. / Как ты спал?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s3 / h1. / Как ты спал?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s4 / h1. / Сколько в тебе энергии?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s5 / h1. / Сколько в тебе энергии?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s6 / h1. / Уровень концентрации` | 24.94 | 24 | -0.94 |
| `checkinMorning.s7 / h1. / Уровень концентрации` | 24.94 | 24 | -0.94 |
| `checkinMorning.s8 / h1. / Главный фокус на сегодня?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s9 / h1. / Что на уме?` | 24.94 | 24 | -0.94 |
| `checkinMorning.completion / strong. / Ты прошёл` | 24.94 | 24 | -0.94 |
| `checkinMorning.completion / span. / утренний чек-ин.` | 24.94 | 24 | -0.94 |
| `checkinEvening.s0 / h1. / Как ты сейчас?` | 24.94 | 24 | -0.94 |
| `checkinEvening.s1 / h1. / Как ты сейчас?` | 24.94 | 24 | -0.94 |
| `checkinEvening.s2 / h1. / Сколько в тебе энергии?` | 24.94 | 24 | -0.94 |
| `checkinEvening.s3 / h1. / Сколько в тебе энергии?` | 24.94 | 24 | -0.94 |
| `completeMorning / strong. / Ты прошёл` | 24.94 | 24 | -0.94 |
| `completeMorning / span. / утренний чек-ин.` | 24.94 | 24 | -0.94 |
| `checkinMorning.completion / p. / Было полезно сегодня?` | 14.62 | 14 | -0.62 |
| `checkinEvening.completion / p. / Был ли разбор полезен?` | 14.62 | 14 | -0.62 |
| `completeMorning / p. / Было полезно сегодня?` | 14.62 | 14 | -0.62 |
| `completeEvening / p. / Был ли разбор полезен?` | 14.62 | 14 | -0.62 |
| `journal.complete / p. / Помогло?` | 14.62 | 14 | -0.62 |

</details>

<details><summary>Увеличения</summary>

| Элемент | before | after | Δ |
| --- | --- | --- | --- |
| `checkinMorning.completion / div.mx-completion__date-pill / 13 окт` | 12.9 | 13 | +0.1 |
| `checkinMorning.completion / span. / ✓` | 12.9 | 13 | +0.1 |
| `checkinEvening.completion / div.mx-completion__date-pill / 13 окт` | 12.9 | 13 | +0.1 |
| `checkinEvening.completion / span. / ✓` | 12.9 | 13 | +0.1 |
| `completeMorning / div.mx-completion__date-pill / 13 окт` | 12.9 | 13 | +0.1 |
| `completeMorning / span. / ✓` | 12.9 | 13 | +0.1 |
| `completeEvening / div.mx-completion__date-pill / 13 окт` | 12.9 | 13 | +0.1 |
| `completeEvening / span. / ✓` | 12.9 | 13 | +0.1 |
| `journal.review / button[dj-review-edit].mx-dj-review__edit-link / Изменить настройку` | 12.9 | 13 | +0.1 |
| `journal.complete / div.mx-completion__date-pill / день 1 из 90` | 12.9 | 13 | +0.1 |
| `journal.complete / span. / ✓` | 12.9 | 13 | +0.1 |
| `journal.review / p.mx-dj-review__reminder / Выключено` | 13.76 | 14 | +0.24 |
| `today / span.mx-pinned-practice-card__title.text-cream / Даймон` | 12.04 | 13 | +0.96 |
| `today / span.mx-pinned-practice-card__title.text-cream / Ритуалы` | 12.04 | 13 | +0.96 |
| `today / span.mx-pinned-practice-card__title.text-cream / Аскезы` | 12.04 | 13 | +0.96 |
| `checkinMorning.s0 / p.mx-checkin-question__hint / Честный ответ важнее красивого` | 12.9 | 14 | +1.1 |
| `checkinMorning.s1 / p.mx-checkin-question__hint / Честный ответ важнее красивого` | 12.9 | 14 | +1.1 |
| `checkinMorning.s2 / p.mx-checkin-question__hint / Оцени качество сна` | 12.9 | 14 | +1.1 |
| `checkinMorning.s3 / p.mx-checkin-question__hint / Оцени качество сна` | 12.9 | 14 | +1.1 |
| `checkinMorning.s4 / p.mx-checkin-question__hint / Прислушайся к телу` | 12.9 | 14 | +1.1 |
| `checkinMorning.s5 / p.mx-checkin-question__hint / Прислушайся к телу` | 12.9 | 14 | +1.1 |
| `checkinMorning.s6 / p.mx-checkin-question__hint / Где сейчас твоё внимание` | 12.9 | 14 | +1.1 |
| `checkinMorning.s7 / p.mx-checkin-question__hint / Где сейчас твоё внимание` | 12.9 | 14 | +1.1 |
| `checkinMorning.s8 / p.mx-checkin-question__hint / Выбери одно главное на сегодня.` | 12.9 | 14 | +1.1 |
| `checkinMorning.s9 / p.mx-checkin-question__hint / Пара слов — уже разговор с собой.` | 12.9 | 14 | +1.1 |
| `checkinEvening.s0 / p.mx-checkin-question__hint / Честный ответ важнее красивого` | 12.9 | 14 | +1.1 |
| `checkinEvening.s1 / p.mx-checkin-question__hint / Честный ответ важнее красивого` | 12.9 | 14 | +1.1 |
| `checkinEvening.s2 / p.mx-checkin-question__hint / Прислушайся к телу` | 12.9 | 14 | +1.1 |
| `checkinEvening.s3 / p.mx-checkin-question__hint / Прислушайся к телу` | 12.9 | 14 | +1.1 |
| `checkinMorning.s8 / span. / Работа` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Близкие` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Забота о себе` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Тело` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Учёба` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Деньги` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Дом` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Отдых` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Творчество` | 14.62 | 16 | +1.38 |
| `checkinMorning.completion / button[checkin-back-to-today].cta-pill.w-full / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Ровно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Спокойно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Задумчиво` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Нейтрально` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Собранно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Терпимо` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Буднично` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Обычно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Сдержанно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Уравновешенно` | 14.62 | 16 | +1.38 |
| `checkinEvening.completion / button[checkin-back-to-today].cta-pill.w-full / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `completeMorning / button[checkin-back-to-today].cta-pill.w-full / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `completeEvening / button[checkin-back-to-today].cta-pill.w-full / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `journal.review / button[dj-review-entries].mx-pill-btn.mx-pill-btn--dark / Мои записи` | 14.62 | 16 | +1.38 |
| `journal.complete / button[dj-complete-close].cta-pill / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `journal.today / button[dj-today-review].mx-pill-btn.mx-pill-btn--dark / Перечитать` | 14.62 | 16 | +1.38 |
| `journal.today / button[dj-today-entries].mx-pill-btn.mx-pill-btn--dark / Мои записи` | 14.62 | 16 | +1.38 |
| `checkinMorning.completion / span. / Нет` | 11.18 | 13 | +1.82 |
| `checkinMorning.completion / span. / Немного` | 11.18 | 13 | +1.82 |
| `checkinMorning.completion / span. / Да` | 11.18 | 13 | +1.82 |
| `checkinEvening.completion / span. / Нет` | 11.18 | 13 | +1.82 |
| `checkinEvening.completion / span. / Немного` | 11.18 | 13 | +1.82 |
| `checkinEvening.completion / span. / Да` | 11.18 | 13 | +1.82 |
| `completeMorning / span. / Нет` | 11.18 | 13 | +1.82 |
| `completeMorning / span. / Немного` | 11.18 | 13 | +1.82 |
| `completeMorning / span. / Да` | 11.18 | 13 | +1.82 |
| `completeEvening / span. / Нет` | 11.18 | 13 | +1.82 |
| `completeEvening / span. / Немного` | 11.18 | 13 | +1.82 |
| `completeEvening / span. / Да` | 11.18 | 13 | +1.82 |
| `journal.complete / span. / Нет` | 11.18 | 13 | +1.82 |
| `journal.complete / span. / Немного` | 11.18 | 13 | +1.82 |
| `journal.complete / span. / Да` | 11.18 | 13 | +1.82 |
| `journal.entries / span.mx-dj-entries__item-day / день 1` | 11.18 | 13 | +1.82 |
| `journal.review / button[dj-review-reset].mx-dj-review__reset-link / Сбросить и начать заново` | 12.04 | 14 | +1.96 |
| `journal.stream / p.mx-dj-stream__hint / Где ты, что видишь, что чувствуешь — и дальше всё, что приходит ` | 12.04 | 14 | +1.96 |
| `journal.entries / p.mx-dj-entries__item-question / Что я откладываю, хотя знаю, что это важно?` | 12.04 | 14 | +1.96 |
| `today / span.block.mx-type-meta / Мысль дня` | 11 | 13 | +2 |
| `checkinMorning.s0 / span.mx-checkin-scale__label / Тяжко` | 11 | 13 | +2 |
| `checkinMorning.s0 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinMorning.s1 / span.mx-checkin-scale__label / Тяжко` | 11 | 13 | +2 |
| `checkinMorning.s1 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinMorning.s2 / span.mx-checkin-scale__label / Очень плохо` | 11 | 13 | +2 |
| `checkinMorning.s2 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinMorning.s3 / span.mx-checkin-scale__label / Очень плохо` | 11 | 13 | +2 |
| `checkinMorning.s3 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinMorning.s4 / span.mx-checkin-scale__label / На нуле` | 11 | 13 | +2 |
| `checkinMorning.s4 / span.mx-checkin-scale__label / Через край` | 11 | 13 | +2 |
| `checkinMorning.s5 / span.mx-checkin-scale__label / На нуле` | 11 | 13 | +2 |
| `checkinMorning.s5 / span.mx-checkin-scale__label / Через край` | 11 | 13 | +2 |
| `checkinMorning.s6 / span.mx-checkin-scale__label / Рассеян` | 11 | 13 | +2 |
| `checkinMorning.s6 / span.mx-checkin-scale__label / Кристально` | 11 | 13 | +2 |
| `checkinMorning.s7 / span.mx-checkin-scale__label / Рассеян` | 11 | 13 | +2 |
| `checkinMorning.s7 / span.mx-checkin-scale__label / Кристально` | 11 | 13 | +2 |
| `checkinEvening.s0 / span.mx-checkin-scale__label / Тяжко` | 11 | 13 | +2 |
| `checkinEvening.s0 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinEvening.s1 / span.mx-checkin-scale__label / Тяжко` | 11 | 13 | +2 |
| `checkinEvening.s1 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinEvening.s2 / span.mx-checkin-scale__label / На нуле` | 11 | 13 | +2 |
| `checkinEvening.s2 / span.mx-checkin-scale__label / Через край` | 11 | 13 | +2 |
| `checkinEvening.s3 / span.mx-checkin-scale__label / На нуле` | 11 | 13 | +2 |
| `checkinEvening.s3 / span.mx-checkin-scale__label / Через край` | 11 | 13 | +2 |
| `journal.review / p.mx-dj-review__item / Тестовая цель настройки дневника` | 13.76 | 16 | +2.24 |
| `journal.review / p.mx-dj-review__item.mx-dj-review__item--muted / Что может помешать: Тестовая цель настройки дневника` | 13.76 | 16 | +2.24 |
| `journal.review / p.mx-dj-review__item.mx-dj-review__item--muted / Тогда я: Тестовая цель настройки дневника` | 13.76 | 16 | +2.24 |
| `journal.today / p.mx-dj-today__text / Сижу дома, пью чай. Думаю о том, что нужно сделать сегодня.` | 13.76 | 16 | +2.24 |
| `journal.today / p.mx-dj-today__question / Что я откладываю, хотя знаю, что это важно?` | 13.76 | 16 | +2.24 |
| `journal.today / p.mx-dj-today__text / Один спокойный шаг важнее идеального плана.` | 13.76 | 16 | +2.24 |
| `journal.entries / span.mx-dj-entries__item-date / 13 октября` | 13.76 | 16 | +2.24 |
| `checkinEvening.s5 / p.mx-checkin-question__hint.text-[14px] / Пара слов — уже разговор с собой. Можно пропустить.` | 11.18 | 14 | +2.82 |
| `checkinEvening.s6 / p.mx-checkin-question__hint.text-[14px] / Пара слов — уже разговор с собой. Можно пропустить.` | 11.18 | 14 | +2.82 |
| `checkinEvening.s7 / p.mx-checkin-question__hint.text-[14px] / Пара слов — уже разговор с собой. Можно пропустить.` | 11.18 | 14 | +2.82 |
| `journal.entries / p.mx-dj-entries__item-stream / Сижу дома, пью чай. Думаю о том, что нужно сделать сегодня.` | 12.9 | 16 | +3.1 |
| `checkinEvening.s4 / h2.font-display.text-cream / Что ближе всего к тому, что ты чувствуешь?` | 20.64 | 24 | +3.36 |
| `checkinEvening.s5 / h2.font-display.text-cream / Что получилось?` | 20.64 | 24 | +3.36 |
| `checkinEvening.s6 / h2.font-display.text-cream / Что было трудно?` | 20.64 | 24 | +3.36 |
| `checkinEvening.s7 / h2.font-display.text-cream / Какой вывод забираешь?` | 20.64 | 24 | +3.36 |
| `journal.setup / h2.mx-journal-field__question / Чего ты хочешь добиться в ближайший год?` | 20.64 | 24 | +3.36 |
| `journal.review / h2.mx-dj-review__title / Вспомни, куда идёшь` | 20.64 | 24 | +3.36 |
| `journal.stream / h2.mx-dj-stream__title / Выпиши всё из головы` | 20.64 | 24 | +3.36 |
| `journal.question / p.mx-dj-question__text / Что я откладываю, хотя знаю, что это важно?` | 20.64 | 24 | +3.36 |
| `journal.today / h2.mx-dj-today__title / Запись сохранена` | 20.64 | 24 | +3.36 |

</details>

## 360x640

| Поверхность | Состояние | Роль | Цель | before | after | Δ | Итог |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Сегодня |  | cardTitle (keep) | — | 17.2 | 17.2 | 0 | вне шкалы |
| Сегодня |  | cardStart (keep) | — | 14.62 | 14.62 | 0 | вне шкалы |
| Сегодня |  | quote (keep) | — | 14.62 | 14.62 | 0 | вне шкалы |
| Сегодня |  | practiceTitle (caption) | 13 | 12.04 | 13 | +0.96 | ✔ |
| Сегодня |  | pulse (caption) | 13 | 11 | 13 | +2 | ✔ |
| Сегодня |  | weekDay (keep) | — | 11 | 11 | 0 | вне шкалы |
| Сегодня |  | metaLabel (caption) | 13 | 11 | 13 | +2 | ✔ |
| Чек-ин (утро) | вопрос | question (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Чек-ин (утро) | вопрос | hint (note) | 14 | 12.9 | 14 | +1.1 | ✔ |
| Чек-ин (утро) | вопрос | scaleLabel (caption) | 13 | 11 | 13 | +2 | ✔ |
| Чек-ин (утро) | вопрос | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Чек-ин (утро) | фокус дня | question (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Чек-ин (утро) | фокус дня | hint (note) | 14 | 12.9 | 14 | +1.1 | ✔ |
| Чек-ин (утро) | фокус дня | focusTile (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Чек-ин (утро) | фокус дня | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Чек-ин (утро) | поле записи | question (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Чек-ин (утро) | поле записи | hint (note) | 14 | 12.9 | 14 | +1.1 | ✔ |
| Чек-ин (утро) | поле записи | input (read) | 16 | 17 | 16 | -1 | ✔ |
| Чек-ин (утро) | поле записи | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Чек-ин (утро) | финал | title (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Чек-ин (утро) | финал | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Чек-ин (утро) | финал | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Чек-ин (утро) | финал | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Чек-ин (утро) | финал | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Разбор дня (вечер) | вопрос | question (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Разбор дня (вечер) | вопрос | hint (note) | 14 | 12.9 | 14 | +1.1 | ✔ |
| Разбор дня (вечер) | вопрос | scaleLabel (caption) | 13 | 11 | 13 | +2 | ✔ |
| Разбор дня (вечер) | вопрос | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Разбор дня (вечер) | эмоции | question (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Разбор дня (вечер) | эмоции | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Разбор дня (вечер) | эмоции | eveningQuestion (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Разбор дня (вечер) | эмоции | emotionTile (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Разбор дня (вечер) | поле записи | question (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Разбор дня (вечер) | поле записи | hint (note) | 14 | 11.18 | 14 | +2.82 | ✔ |
| Разбор дня (вечер) | поле записи | input (read) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Разбор дня (вечер) | поле записи | submit (action) | 16 | 16 | 16 | 0 | ✔ |
| Разбор дня (вечер) | поле записи | eveningQuestion (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Разбор дня (вечер) | поле записи | eveningHint (note) | 14 | 11.18 | 14 | +2.82 | ✔ |
| Разбор дня (вечер) | финал | title (ask) | 24 | 25.8 | 24 | -1.8 | ✔ |
| Разбор дня (вечер) | финал | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Разбор дня (вечер) | финал | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Разбор дня (вечер) | финал | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Разбор дня (вечер) | финал | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Финал утра (превью) |  | title (ask) | 24 | 24.94 | 24 | -0.94 | ✔ |
| Финал утра (превью) |  | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Финал утра (превью) |  | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Финал утра (превью) |  | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Финал утра (превью) |  | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Финал вечера (превью) |  | title (ask) | 24 | 25.8 | 24 | -1.8 | ✔ |
| Финал вечера (превью) |  | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Финал вечера (превью) |  | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Финал вечера (превью) |  | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Финал вечера (превью) |  | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Дневник | настройка | setupQuestion (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | настройка | setupInput (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | ревью цели | reviewTitle (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | ревью цели | reviewItem (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | ревью цели | reviewNote (note) | 14 | 13.76 | 14 | +0.24 | ✔ |
| Дневник | ревью цели | entriesBtn (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Дневник | поток | streamTitle (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | поток | streamHint (note) | 14 | 12.04 | 14 | +1.96 | ✔ |
| Дневник | поток | streamField (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | вопрос дня | questionText (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | вопрос дня | questionField (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | финал записи | title (ask) | 24 | 25.8 | 24 | -1.8 | ✔ |
| Дневник | финал записи | datePill (caption) | 13 | 12.9 | 13 | +0.1 | ✔ |
| Дневник | финал записи | question (note) | 14 | 14.62 | 14 | -0.62 | ✔ |
| Дневник | финал записи | choice (caption) | 13 | 11.18 | 13 | +1.82 | ✔ |
| Дневник | финал записи | action (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Дневник | запись за сегодня | todayTitle (ask) | 24 | 20.64 | 24 | +3.36 | ✔ |
| Дневник | запись за сегодня | todayText (read) | 16 | 13.76 | 16 | +2.24 | ✔ |
| Дневник | запись за сегодня | todayAppend (action) | 16 | 16 | 16 | 0 | ✔ |
| Дневник | запись за сегодня | todayPill (action) | 16 | 14.62 | 16 | +1.38 | ✔ |
| Дневник | мои записи | entriesItemStream (read) | 16 | 12.9 | 16 | +3.1 | ✔ |
| Дневник | мои записи | entriesItemQuestion (note) | 14 | 12.04 | 14 | +1.96 | ✔ |

**Итог по инвентарю 360x640:** изменено 149 из 422 сопоставимых элементов, уменьшилось 29, увеличилось 120.

<details><summary>Уменьшения</summary>

| Элемент | before | after | Δ |
| --- | --- | --- | --- |
| `checkinEvening.completion / strong. / Ты завершил` | 25.8 | 24 | -1.8 |
| `checkinEvening.completion / span. / разбор дня.` | 25.8 | 24 | -1.8 |
| `completeEvening / strong. / Ты завершил` | 25.8 | 24 | -1.8 |
| `completeEvening / span. / разбор дня.` | 25.8 | 24 | -1.8 |
| `journal.complete / strong. / Запись` | 25.8 | 24 | -1.8 |
| `journal.complete / span. / сохранена.` | 25.8 | 24 | -1.8 |
| `checkinMorning.s0 / h1. / Как ты сейчас?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s1 / h1. / Как ты сейчас?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s2 / h1. / Как ты спал?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s3 / h1. / Как ты спал?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s4 / h1. / Сколько в тебе энергии?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s5 / h1. / Сколько в тебе энергии?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s6 / h1. / Уровень концентрации` | 24.94 | 24 | -0.94 |
| `checkinMorning.s7 / h1. / Уровень концентрации` | 24.94 | 24 | -0.94 |
| `checkinMorning.s8 / h1. / Главный фокус на сегодня?` | 24.94 | 24 | -0.94 |
| `checkinMorning.s9 / h1. / Что на уме?` | 24.94 | 24 | -0.94 |
| `checkinMorning.completion / strong. / Ты прошёл` | 24.94 | 24 | -0.94 |
| `checkinMorning.completion / span. / утренний чек-ин.` | 24.94 | 24 | -0.94 |
| `checkinEvening.s0 / h1. / Как ты сейчас?` | 24.94 | 24 | -0.94 |
| `checkinEvening.s1 / h1. / Как ты сейчас?` | 24.94 | 24 | -0.94 |
| `checkinEvening.s2 / h1. / Сколько в тебе энергии?` | 24.94 | 24 | -0.94 |
| `checkinEvening.s3 / h1. / Сколько в тебе энергии?` | 24.94 | 24 | -0.94 |
| `completeMorning / strong. / Ты прошёл` | 24.94 | 24 | -0.94 |
| `completeMorning / span. / утренний чек-ин.` | 24.94 | 24 | -0.94 |
| `checkinMorning.completion / p. / Было полезно сегодня?` | 14.62 | 14 | -0.62 |
| `checkinEvening.completion / p. / Был ли разбор полезен?` | 14.62 | 14 | -0.62 |
| `completeMorning / p. / Было полезно сегодня?` | 14.62 | 14 | -0.62 |
| `completeEvening / p. / Был ли разбор полезен?` | 14.62 | 14 | -0.62 |
| `journal.complete / p. / Помогло?` | 14.62 | 14 | -0.62 |

</details>

<details><summary>Увеличения</summary>

| Элемент | before | after | Δ |
| --- | --- | --- | --- |
| `checkinMorning.completion / div.mx-completion__date-pill / 13 окт` | 12.9 | 13 | +0.1 |
| `checkinMorning.completion / span. / ✓` | 12.9 | 13 | +0.1 |
| `checkinEvening.completion / div.mx-completion__date-pill / 13 окт` | 12.9 | 13 | +0.1 |
| `checkinEvening.completion / span. / ✓` | 12.9 | 13 | +0.1 |
| `completeMorning / div.mx-completion__date-pill / 13 окт` | 12.9 | 13 | +0.1 |
| `completeMorning / span. / ✓` | 12.9 | 13 | +0.1 |
| `completeEvening / div.mx-completion__date-pill / 13 окт` | 12.9 | 13 | +0.1 |
| `completeEvening / span. / ✓` | 12.9 | 13 | +0.1 |
| `journal.review / button[dj-review-edit].mx-dj-review__edit-link / Изменить настройку` | 12.9 | 13 | +0.1 |
| `journal.complete / div.mx-completion__date-pill / день 1 из 90` | 12.9 | 13 | +0.1 |
| `journal.complete / span. / ✓` | 12.9 | 13 | +0.1 |
| `journal.review / p.mx-dj-review__reminder / Выключено` | 13.76 | 14 | +0.24 |
| `today / span.mx-pinned-practice-card__title.text-cream / Даймон` | 12.04 | 13 | +0.96 |
| `today / span.mx-pinned-practice-card__title.text-cream / Ритуалы` | 12.04 | 13 | +0.96 |
| `today / span.mx-pinned-practice-card__title.text-cream / Аскезы` | 12.04 | 13 | +0.96 |
| `checkinMorning.s0 / p.mx-checkin-question__hint / Честный ответ важнее красивого` | 12.9 | 14 | +1.1 |
| `checkinMorning.s1 / p.mx-checkin-question__hint / Честный ответ важнее красивого` | 12.9 | 14 | +1.1 |
| `checkinMorning.s2 / p.mx-checkin-question__hint / Оцени качество сна` | 12.9 | 14 | +1.1 |
| `checkinMorning.s3 / p.mx-checkin-question__hint / Оцени качество сна` | 12.9 | 14 | +1.1 |
| `checkinMorning.s4 / p.mx-checkin-question__hint / Прислушайся к телу` | 12.9 | 14 | +1.1 |
| `checkinMorning.s5 / p.mx-checkin-question__hint / Прислушайся к телу` | 12.9 | 14 | +1.1 |
| `checkinMorning.s6 / p.mx-checkin-question__hint / Где сейчас твоё внимание` | 12.9 | 14 | +1.1 |
| `checkinMorning.s7 / p.mx-checkin-question__hint / Где сейчас твоё внимание` | 12.9 | 14 | +1.1 |
| `checkinMorning.s8 / p.mx-checkin-question__hint / Выбери одно главное на сегодня.` | 12.9 | 14 | +1.1 |
| `checkinMorning.s9 / p.mx-checkin-question__hint / Пара слов — уже разговор с собой.` | 12.9 | 14 | +1.1 |
| `checkinEvening.s0 / p.mx-checkin-question__hint / Честный ответ важнее красивого` | 12.9 | 14 | +1.1 |
| `checkinEvening.s1 / p.mx-checkin-question__hint / Честный ответ важнее красивого` | 12.9 | 14 | +1.1 |
| `checkinEvening.s2 / p.mx-checkin-question__hint / Прислушайся к телу` | 12.9 | 14 | +1.1 |
| `checkinEvening.s3 / p.mx-checkin-question__hint / Прислушайся к телу` | 12.9 | 14 | +1.1 |
| `checkinMorning.s8 / span. / Работа` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Близкие` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Забота о себе` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Тело` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Учёба` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Деньги` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Дом` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Отдых` | 14.62 | 16 | +1.38 |
| `checkinMorning.s8 / span. / Творчество` | 14.62 | 16 | +1.38 |
| `checkinMorning.completion / button[checkin-back-to-today].cta-pill.w-full / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Ровно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Спокойно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Задумчиво` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Нейтрально` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Собранно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Терпимо` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Буднично` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Обычно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Сдержанно` | 14.62 | 16 | +1.38 |
| `checkinEvening.s4 / button[checkin-emotion-pill].mx-emotion-grid__tile / Уравновешенно` | 14.62 | 16 | +1.38 |
| `checkinEvening.completion / button[checkin-back-to-today].cta-pill.w-full / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `completeMorning / button[checkin-back-to-today].cta-pill.w-full / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `completeEvening / button[checkin-back-to-today].cta-pill.w-full / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `journal.review / button[dj-review-entries].mx-pill-btn.mx-pill-btn--dark / Мои записи` | 14.62 | 16 | +1.38 |
| `journal.complete / button[dj-complete-close].cta-pill / Сохранить и выйти` | 14.62 | 16 | +1.38 |
| `journal.today / button[dj-today-review].mx-pill-btn.mx-pill-btn--dark / Перечитать` | 14.62 | 16 | +1.38 |
| `journal.today / button[dj-today-entries].mx-pill-btn.mx-pill-btn--dark / Мои записи` | 14.62 | 16 | +1.38 |
| `checkinMorning.completion / span. / Нет` | 11.18 | 13 | +1.82 |
| `checkinMorning.completion / span. / Немного` | 11.18 | 13 | +1.82 |
| `checkinMorning.completion / span. / Да` | 11.18 | 13 | +1.82 |
| `checkinEvening.completion / span. / Нет` | 11.18 | 13 | +1.82 |
| `checkinEvening.completion / span. / Немного` | 11.18 | 13 | +1.82 |
| `checkinEvening.completion / span. / Да` | 11.18 | 13 | +1.82 |
| `completeMorning / span. / Нет` | 11.18 | 13 | +1.82 |
| `completeMorning / span. / Немного` | 11.18 | 13 | +1.82 |
| `completeMorning / span. / Да` | 11.18 | 13 | +1.82 |
| `completeEvening / span. / Нет` | 11.18 | 13 | +1.82 |
| `completeEvening / span. / Немного` | 11.18 | 13 | +1.82 |
| `completeEvening / span. / Да` | 11.18 | 13 | +1.82 |
| `journal.complete / span. / Нет` | 11.18 | 13 | +1.82 |
| `journal.complete / span. / Немного` | 11.18 | 13 | +1.82 |
| `journal.complete / span. / Да` | 11.18 | 13 | +1.82 |
| `journal.entries / span.mx-dj-entries__item-day / день 1` | 11.18 | 13 | +1.82 |
| `journal.review / button[dj-review-reset].mx-dj-review__reset-link / Сбросить и начать заново` | 12.04 | 14 | +1.96 |
| `journal.stream / p.mx-dj-stream__hint / Где ты, что видишь, что чувствуешь — и дальше всё, что приходит ` | 12.04 | 14 | +1.96 |
| `journal.entries / p.mx-dj-entries__item-question / Что я откладываю, хотя знаю, что это важно?` | 12.04 | 14 | +1.96 |
| `today / span.block.mx-type-meta / Мысль дня` | 11 | 13 | +2 |
| `checkinMorning.s0 / span.mx-checkin-scale__label / Тяжко` | 11 | 13 | +2 |
| `checkinMorning.s0 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinMorning.s1 / span.mx-checkin-scale__label / Тяжко` | 11 | 13 | +2 |
| `checkinMorning.s1 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinMorning.s2 / span.mx-checkin-scale__label / Очень плохо` | 11 | 13 | +2 |
| `checkinMorning.s2 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinMorning.s3 / span.mx-checkin-scale__label / Очень плохо` | 11 | 13 | +2 |
| `checkinMorning.s3 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinMorning.s4 / span.mx-checkin-scale__label / На нуле` | 11 | 13 | +2 |
| `checkinMorning.s4 / span.mx-checkin-scale__label / Через край` | 11 | 13 | +2 |
| `checkinMorning.s5 / span.mx-checkin-scale__label / На нуле` | 11 | 13 | +2 |
| `checkinMorning.s5 / span.mx-checkin-scale__label / Через край` | 11 | 13 | +2 |
| `checkinMorning.s6 / span.mx-checkin-scale__label / Рассеян` | 11 | 13 | +2 |
| `checkinMorning.s6 / span.mx-checkin-scale__label / Кристально` | 11 | 13 | +2 |
| `checkinMorning.s7 / span.mx-checkin-scale__label / Рассеян` | 11 | 13 | +2 |
| `checkinMorning.s7 / span.mx-checkin-scale__label / Кристально` | 11 | 13 | +2 |
| `checkinEvening.s0 / span.mx-checkin-scale__label / Тяжко` | 11 | 13 | +2 |
| `checkinEvening.s0 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinEvening.s1 / span.mx-checkin-scale__label / Тяжко` | 11 | 13 | +2 |
| `checkinEvening.s1 / span.mx-checkin-scale__label / Отлично` | 11 | 13 | +2 |
| `checkinEvening.s2 / span.mx-checkin-scale__label / На нуле` | 11 | 13 | +2 |
| `checkinEvening.s2 / span.mx-checkin-scale__label / Через край` | 11 | 13 | +2 |
| `checkinEvening.s3 / span.mx-checkin-scale__label / На нуле` | 11 | 13 | +2 |
| `checkinEvening.s3 / span.mx-checkin-scale__label / Через край` | 11 | 13 | +2 |
| `journal.review / p.mx-dj-review__item / Тестовая цель настройки дневника` | 13.76 | 16 | +2.24 |
| `journal.review / p.mx-dj-review__item.mx-dj-review__item--muted / Что может помешать: Тестовая цель настройки дневника` | 13.76 | 16 | +2.24 |
| `journal.review / p.mx-dj-review__item.mx-dj-review__item--muted / Тогда я: Тестовая цель настройки дневника` | 13.76 | 16 | +2.24 |
| `journal.today / p.mx-dj-today__text / Сижу дома, пью чай. Думаю о том, что нужно сделать сегодня.` | 13.76 | 16 | +2.24 |
| `journal.today / p.mx-dj-today__question / Что я откладываю, хотя знаю, что это важно?` | 13.76 | 16 | +2.24 |
| `journal.today / p.mx-dj-today__text / Один спокойный шаг важнее идеального плана.` | 13.76 | 16 | +2.24 |
| `journal.entries / span.mx-dj-entries__item-date / 13 октября` | 13.76 | 16 | +2.24 |
| `checkinEvening.s5 / p.mx-checkin-question__hint.text-[14px] / Пара слов — уже разговор с собой. Можно пропустить.` | 11.18 | 14 | +2.82 |
| `checkinEvening.s6 / p.mx-checkin-question__hint.text-[14px] / Пара слов — уже разговор с собой. Можно пропустить.` | 11.18 | 14 | +2.82 |
| `checkinEvening.s7 / p.mx-checkin-question__hint.text-[14px] / Пара слов — уже разговор с собой. Можно пропустить.` | 11.18 | 14 | +2.82 |
| `journal.entries / p.mx-dj-entries__item-stream / Сижу дома, пью чай. Думаю о том, что нужно сделать сегодня.` | 12.9 | 16 | +3.1 |
| `checkinEvening.s4 / h2.font-display.text-cream / Что ближе всего к тому, что ты чувствуешь?` | 20.64 | 24 | +3.36 |
| `checkinEvening.s5 / h2.font-display.text-cream / Что получилось?` | 20.64 | 24 | +3.36 |
| `checkinEvening.s6 / h2.font-display.text-cream / Что было трудно?` | 20.64 | 24 | +3.36 |
| `checkinEvening.s7 / h2.font-display.text-cream / Какой вывод забираешь?` | 20.64 | 24 | +3.36 |
| `journal.setup / h2.mx-journal-field__question / Чего ты хочешь добиться в ближайший год?` | 20.64 | 24 | +3.36 |
| `journal.review / h2.mx-dj-review__title / Вспомни, куда идёшь` | 20.64 | 24 | +3.36 |
| `journal.stream / h2.mx-dj-stream__title / Выпиши всё из головы` | 20.64 | 24 | +3.36 |
| `journal.question / p.mx-dj-question__text / Что я откладываю, хотя знаю, что это важно?` | 20.64 | 24 | +3.36 |
| `journal.today / h2.mx-dj-today__title / Запись сохранена` | 20.64 | 24 | +3.36 |

</details>

## Сводка

- Ролей с уменьшением: 30.
- Ролей с увеличением: 98.
