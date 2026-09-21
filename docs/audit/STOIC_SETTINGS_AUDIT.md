# Аудит исчезнувшего Stoic-стиля и настроек

**Дата аудита:** 21 сентября 2026 года  
**Репозитории:** `Smira31/Mentalix`, дополнительно `Smira31/mentalix-bot`  
**Референс:** `IMG_6255.MP4`, вертикальная запись 576×1280, длительность около 45 секунд

## Итог

Работа не потеряна из репозитория и не исчезла из production. Однако в постановке смешаны два разных объекта.

Во-первых, видео показывает не экран **Настроек**, а демонстрационный flow **Daily Check-In** с последующими экранами выбора фокуса, журнала, AI/Premium и завершения check-in. Во-вторых, коммит с названием «Редизайн stoic» действительно существует и попал в `main`, но он не изменял `src/screens/Settings.jsx`. Он менял общую оболочку приложения, экран Today, Practices и связанные визуальные токены. Поэтому искать показанный в видео визуал внутри пункта «Настройки» нельзя: это не тот маршрут.

Связанная работа по Check-In и demo-flow найдена в истории, смёржена в `main` и присутствует в актуальной Firebase Production-сборке. Если владелец открывает обычный Settings-маршрут или старый Vercel URL, показанный flow не будет виден. Каноническая production-среда — `https://mentalix-production.web.app`; demo-flow на этом хосте активируется только при наличии `?demo=1` или `?source=pwa`, после чего его нужно открыть через соответствующий entry point Today/Check-In.

Таким образом, подтверждений потери несохранённой работы до первого push нет. Точнее: **именно отдельный “Stoic Settings redesign”, соответствующий видео, не обнаружен ни в одном коммите или PR, потому что в истории он не оформлен как редизайн Settings. Связанный показанный flow обнаружен и доставлен.**

## Что показано на видео

В начале записи виден экран Today с карточкой запуска check-in и нижней навигацией. После запуска открывается полноэкранный Daily Check-In. Верхняя панель содержит закрытие, бейдж `Premium`, кнопку дополнительных действий и подтверждение.

Далее показаны следующие элементы.

| Участок        | Что видно в референсе                                                                                                                                                                                                 | Интерпретация для Mentalix                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Состояние      | `How are you feeling?`, пять круглых состояний и шкала от `Not at all` до `Very`                                                                                                                                      | Шаг mood/energy check-in, а не настройка профиля              |
| Разрешения     | Системный экран доступа к данным «Здоровье» с переключателями чтения и записи                                                                                                                                         | Системный permission flow iOS; это не пункт Settings Mentalix |
| Фокус дня      | Сетка 3×4: Work, Self-care, People, Hobbies, Chores, Learning, Fun, Rest, Nature, Health, Family, Productivity; ниже `Show all`, `Personalize` и стрелка продолжения                                                  | Отдельный шаг выбора фокуса внутри check-in                   |
| Запись         | Вопрос `What's making you smile today when you think of it?`, поле записи, клавиатура и верхняя панель `+`/`Aa`                                                                                                       | Guided journal writer                                         |
| Вложения       | Меню `+` с Voice Memo, Open Camera, Photo Library, Draw и Journaling Suggestions                                                                                                                                      | Дополнительные действия редактора                             |
| Форматирование | Меню `Aa` со стилями B, I, U, S, quote и уровнями Title, Heading, Subheading, Body                                                                                                                                    | Formatting toolbar редактора                                  |
| AI/Premium     | Экран `Elevate your mental health with AI.`, переключатель `Premium`/`Premium + AI`, AI-функции Personalized Reflections, Reflective Analysis и Smart Notifications, guided journals и кнопка `Start Your Free Trial` | Premium upsell/AI surface, не корневой Settings screen        |
| Завершение     | `You've completed the Daily Check-In!`, `+ Add Tags`, обратная связь `No`/`A little`/`Yes` и `Save & Finish`                                                                                                          | Финальный экран check-in                                      |
| Награда        | Экран `First Steps` с сообщением о первом Daily Check-In и кнопкой Share                                                                                                                                              | Achievement/result flow                                       |

Видеозапись не показывает полноценный экран профиля с заголовком «Настройки» и списком настроек. Поэтому визуальное отсутствие именно этого списка в текущем production не является доказательством отката Settings-redesign: такой экран в референсе не зафиксирован.

## Что найдено в git-истории Mentalix

Полный аудит выполнен по локально обновлённым `origin/*` refs, всем доступным remote branches, истории файлов Settings и связанным PR. Дополнительно проверены unreachable git objects через `git fsck --full --no-reflogs --unreachable`. В `mentalix-bot` найдены backend-контракты для уже существующих настроек, но не найден frontend-редизайн и не найден отдельный UI, который мог бы пропасть из-за backend.

### Коммит «Редизайн stoic»

Коммит `f6296a3313e5dc642893c9118cca8c1e845bf126` от 24 июля 2026 года имеет сообщение `Редизайн stoic`. Он изменяет `src/App.jsx`, `src/index.css`, `src/screens/Today.jsx`, `src/screens/Practices.jsx`, `src/screens/Mentalix.jsx`, `src/screens/Courses.jsx`, Telegram adapter и design tokens. Файл `src/screens/Settings.jsx` в этом коммите отсутствует среди изменённых файлов.

Коммит является предком `main` и отмечен тегом `v1.0.0`. Следовательно, эта широкая Stoic-стилизация не была потеряна и не оставалась в забытой ветке. Она была доставлена в основной код, но она не была редизайном Settings.

### Реальные изменения Settings

История Settings содержит последовательные небольшие функциональные изменения, и они находятся в `main`:

- `4faf094b` — первоначальный экран настроек;
- `e97509df` — управление фразами для «Считки дня»;
- `f4b86dfa` — подписка и экран доната без реальной оплаты;
- `dce0404e` — связь Telegram и веб-аккаунта;
- `0cdd5b71` — час разбора дня;
- `b8549357`, PR #172 — выбор акцентного цвета;
- `4443b947`, PR #167 — переключатели видимости карточек Today;
- PR #182 / `559f6c4f` — быстрый mood-check при запуске;
- `5f5f3999` — тихие часы и цели записи;
- `8b884218` — AI controls и локальные форматы экспорта;
- `1b9c7d51` — фильтры, resume и reminder controls для journey;
- `c312102d` — подтверждённое удаление данных;
- `bb14be7c` — ограничения хранения данных;
- `e46cf26c` — скрытие descriptive insights;
- `bdc7097e` — объяснение экспорта guided session;
- `83389cad` — недельный прогресс writing goal;
- PR #589 / `7d02fa95` — accessibility-полировка Settings/Series;
- `ef80e484`, PR #603 — первая фаза светлой темы.

Эти изменения не образуют отдельного визуального экрана, похожего на видео. Текущий Settings остаётся сгруппированным списком карточек: профиль и подписка, уведомления, основные настройки, поддержка, документы, версия приложения и аккаунт. Это подтверждается текущим `src/screens/Settings.jsx` и production chunk `Settings-UlCpUwfI.js`.

### Работа, соответствующая видеоряду

Показанный в видео flow имеет отдельную историю и найден в `main`:

- PR #182 добавил быстрый mood-check и связанные entry points;
- PR #650 (`4eb6153e`) промоутил Check-In demo flow и visual updates в production;
- PR #654 (`81537fab`) синхронизировал demo production changes в `main`;
- PR #655 (`b07922c3`) синхронизировал актуальный Cloudflare preview в `main`;
- последующие PR #692, #693, #694, #696, #708 и #716 обновляли шкалы, утренний check-in, экран стрика, BackButton и историю check-in.

Все перечисленные PR закрыты после merge. Ни один из них не является потерянным Draft PR. В текущем `main` присутствуют `CheckIn.jsx`, `CheckInDemo.css`, `JournalTextarea.jsx`, demo state и связанные flow-компоненты.

## Почему это может быть незаметно в production

### 1. Открыт Settings вместо Check-In entry point

В референсе нет корневого списка Settings. Пользователь должен запускать Daily Check-In через Today/demo entry point. Переход в профиль и пункт «Настройки» приводит к `Settings.jsx`, где находятся настройки аккаунта и поведения приложения, а не последовательность экранов с mood scale, фокусом и редактором.

### 2. Demo-flow включается явно

`src/lib/demoMode.js` разрешает production demo только на `mentalix-production.web.app` и только при наличии `demo=1` либо `source=pwa`. Без этих параметров приложение работает в обычном режиме и не использует seeded demo state. Это ожидаемое ограничение, а не потеря UI.

### 3. Vercel — устаревший fallback, а не канонический production

После миграции hosting политика проекта определяет Firebase Hosting Live channel как production. Vercel project отключён для новых git deploys и остаётся старым fallback. В Vercel API последний READY deployment имеет SHA `3d2b57d3` и не отражает актуальный Firebase production. Поэтому проверка `mentalix.vercel.app` может дать устаревшее или отличающееся визуальное состояние и создать ложное впечатление, что изменения пропали.

### 4. Firebase production фактически обновлён

Последний Firebase Hosting workflow run — [35606311130][7]. Он успешно собрал merge-коммит `7456d8935094d641e477f2ca8586ea05bc54c9dd` после PR #726. HTML production загружает те же asset names, что и локальная сборка актуального `main`: `index-B3lSmkfM.js`, `index-1ZoLDTtM.css` и `Settings-UlCpUwfI.js`.

Дополнительная проверка SHA-256 показала, что скачанный production `Settings-UlCpUwfI.js` byte-for-byte совпадает с локальным `dist/assets/Settings-UlCpUwfI.js`. В production chunk присутствует, в частности, строка `Premium + AI`. Это исключает сценарий, при котором Firebase production откатился к старой Settings-сборке или потерял chunk при деплое.

## Проверка backend mentalix-bot

В `Smira31/mentalix-bot` присутствуют backend-поля и API для настроек, которые уже использует frontend: reminder settings, quiet hours, writing goals, insights visibility, AI consent и связанные privacy controls. Backend не содержит отдельного визуального слоя и не может объяснить исчезновение экранов из видео. Причина находится на уровне маршрута и ожиданий от Settings, а не в отсутствии backend API.

## Ответы на вопросы владельца

**1. Найдена ли работа в истории?** Да, найдена связанная работа по Stoic-style Check-In/demo flow. Она смёржена в `main` через PR #650, #654 и #655, а затем обновлялась последующими PR. Отдельного коммита или PR, который бы превращал `Settings.jsx` в показанный на видео экран, не найдено.

**2. Если найдена, где она и почему не видна?** Связанная работа находится в Check-In/demo маршрутах, а не в Settings. Она присутствует в актуальном `main` и в Firebase production. Она не видна при обычном открытии Settings. Кроме того, открытие старого Vercel fallback вместо `mentalix-production.web.app` может показать устаревший runtime. На каноническом production demo-flow требует `?demo=1` или `?source=pwa`.

**3. Если работа не найдена?** Формулировка «полная потеря несохранённой работы» не подтверждается. Не обнаружен именно отдельный Settings-redesign из видео, но это объясняется отсутствием такого Settings-коммита: видео относится к Check-In/demo flow. Связанная реализация сохранена, прошла через PR и production deployment. Поэтому восстанавливать её с нуля по памяти не требуется; сначала нужно согласовать, какой маршрут и какая production-среда должны считаться целевыми.

## Ограничения аудита

Видео не содержит URL, query-параметров и явного названия маршрута. Поэтому невозможно по одному файлу определить, каким именно entry point владелец запускал flow. В отчёте разделены наблюдаемые видеокадры и проверяемые факты из исходников и deployment metadata.

## References

[1]: https://github.com/Smira31/Mentalix/commit/f6296a3313e5dc642893c9118cca8c1e845bf126 'Коммит «Редизайн stoic»'
[2]: https://github.com/Smira31/Mentalix/pull/182 'PR #182 — быстрый mood-check'
[3]: https://github.com/Smira31/Mentalix/pull/650 'PR #650 — Check-In demo flow и visual updates'
[4]: https://github.com/Smira31/Mentalix/pull/654 'PR #654 — синхронизация demo production changes'
[5]: https://github.com/Smira31/Mentalix/pull/655 'PR #655 — синхронизация Cloudflare preview'
[6]: https://github.com/Smira31/Mentalix/commit/7456d8935094d641e477f2ca8586ea05bc54c9dd 'Актуальный merge-коммит main'
[7]: https://github.com/Smira31/Mentalix/actions/runs/35606311130 'Firebase Hosting Production deploy'
[8]: https://mentalix-production.web.app 'Mentalix Firebase Production'
[9]: https://mentalix.vercel.app 'Устаревший Vercel fallback'
