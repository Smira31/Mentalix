# Mentalix Demo Preview — QA-отчёт 16 сентября 2026

## Область проверки

Проверен канонический Cloudflare Owner QA Preview на SHA `e97905626462b764ff91d2d3854cba734e00bf04`, а также локальная сборка на Demo-ветке `fix/mentor-demo-preview-geometry`. Production branch `main` и PR #621 не изменялись и не мержились.

## Подтверждено

Канонический URL отвечает HTTP 200 и открывает Demo без splash. Synthetic Demo Mode показывает русскоязычный label «Демо-превью», Today и пять вкладок без API-запросов авторизации. В браузерном smoke-check нет горизонтального overflow.

Today использует monochrome-композицию, нейтральную active-поверхность нижней навигации и рабочую CTA. Check-In последовательно проходит mood, energy, noise, focus и выбор эмоции. Выбранные состояния получают светлую поверхность, горизонтальные разделители отсутствуют, редактор показывает `Начни писать`, `Aa` и action bar.

Standalone WebAuth открывается без бесконечного splash и содержит чёрный фон, Stoic-иллюстрацию, круглую кнопку закрытия, заголовок «Продолжай расти даже вне приложения», три смысловых блока, email-поле, цитату и светлую CTA. Reference-фотографии сохранены вне исходного кода в `artifacts/qa-reference/web-auth/`.

## Найдено и исправлено

В Demo редакторе Check-In после прохождения первых пяти состояний показывался ошибочный label `ЧЕК-ИН · 4 ИЗ 6`. Причина — Demo-only override в `src/screens/CheckIn.jsx`. Override удалён: label теперь вычисляется из фактического `step + 1` и `totalSteps`, поэтому редактор отображает `Чек-ин · 6 из 6`.

Также обновлены два устаревших автоматических WebAuth-ожидания и snapshot узкого Today: тесты ожидали старый экран «Вход в Mentalix», старую Telegram-карточку и старую кнопку «Получить код», тогда как действующий утверждённый WebAuth — email-first экран «Продолжай расти…» с кнопкой «Получить письмо». Узкий snapshot отражал старую геометрию навигации, не текущую Demo-композицию.

## Автоматическая проверка

`git diff --check`, `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:design-guard`, `npm run docs:check` и `npm run ux:mxl010` проходят. `npm run ux:check` проходит всеми 8 тестами.

## Ограничения текущей проверки

Sandbox browser не эмулирует Home Screen standalone и настоящую iOS-клавиатуру. Поэтому перед Production необходима ручная проверка на iPhone: переустановка Demo PWA с подписью «Демо-превью», standalone Demo без Telegram-ошибки, WebAuth без и с клавиатурой, Check-In editor и Dialog composer с открытой клавиатурой, отсутствие чёрной прослойки и сохранение фокуса после отправки. Визуальный PASS пользователя ещё не получен.

## Статус Production

Production не изменён. Production release plan, merge PR #621 и любые auth/security или платёжные изменения запрещены до явного визуального PASS пользователя.
