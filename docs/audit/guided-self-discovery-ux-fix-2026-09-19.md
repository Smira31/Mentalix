---
status: ready-for-owner-gate
date: 2026-09-19
scope: GuidedSelfDiscoveryFlow only
---

# Guided Self-Discovery UX fix — 2026-09-19

## Диагноз до правки

Корень проблемы с клавиатурой находился в расхождении с уже работающим контрактом `CheckIn.jsx`. `CheckIn` публикует действие шага через `useMainButton` в Telegram и `WebActionBar` в вебе. Эти controls живут вне контента fullscreen-shell: Telegram рисует `MainButton` поверх системной клавиатуры, а веб-`WebActionBar` остаётся последним `shrink-0` элементом shell, высота которого уже ограничена `visualViewport`.

`GuidedSelfDiscoveryFlow` до правки передавал `onSubmit` непосредственно в `PracticeWritingCanvas`. Кнопка перехода поэтому жила в локальном absolute/fixed dock внутри canvas и зависела от visual viewport и keyboard-offset логики canvas. Это был отдельный механизм, а не контракт `CheckIn`; на реальном iPhone в Telegram dock оказывался под клавиатурой. Дополнительное расхождение: flow не оборачивал содержимое intro/writing/completion в `FULLSCREEN_SCROLL_CLASS` и держал completion primary CTA внутри completion-контента.

## Диагностика новых визуальных находок

1. **Крестик:** X не был случайно потерян в PR #688: его нет в текущем `main`, в базовой версии Guided flow и в исходном коммите компонента. `CheckIn.jsx` использует отдельную DOM-кнопку X справа, тогда как Guided flow исторически оставлял только BackButton. По решению владельца X добавляется только в веб/PWA-шапку; в Telegram остаётся native BackButton без DOM-оверлея.
2. **Текст вопроса:** `PracticeWritingCanvas__question` и `PracticeWritingCanvas__description` — разные элементы. Первый — вопрос, белый display-текст; второй — приглушённая подсказка. Разная визуальная роль на скриншотах не является смешением стилей одного элемента.
3. **Хвост предыдущего шага:** `PracticeWritingCanvas` не имел `key` на уровне шага; при смене `stepIndex` React мог переиспользовать внутренний textarea/canvas DOM. Исправление — remount canvas по стабильному `step.key`, без изменения draft-данных.

## Изменения

- Guided flow теперь публикует действие текущего шага через `useMainButton` и `WebActionBar`.
- Локальная submit-кнопка `PracticeWritingCanvas` для этого flow больше не монтируется; пустой dock не рендерится.
- Intro, writing и completion используют общий `FULLSCREEN_SCROLL_CLASS`.
- Completion primary CTA «Вернуться в дневник» перенесён в тот же action bar; внутри completion сохранено вторичное действие «Начать заново».
- Вопросы, тексты, draft-модель и сохранение ответов не менялись.
- Responsive UX-сценарий проверяет compact action bar и сохраняет screenshots для всех семи шагов и completion.

## Проверки

- `npm run check:core` — passed.
- `npm run ux:check` — 11/11 passed.
- `npx playwright test --config=playwright.mxl246.config.mjs` — 8/8 passed на 390×844, 768×1024, 1024×768 и 1440×900.
- В `qa-evidence/mxl-246/390x844/` сохранены состояния 390×844; `02-journal-writer-before-round.png` — before, `02-journal-writer.png` — after.
- Новая regression-проверка — 8/8 passed после добавления веб-X и `key={step.key}`; before/after для всех 7 writing-состояний сохранены как `*-before-header.png` и соответствующие after PNG.

## Telegram MainButton — результат разведки

Официальная документация Telegram Web Apps описывает актуальный объект как `BottomButton` (для main-кнопки это прежний `MainButton`). В `setParams` перечислены `text`, `color`, `text_color`, `has_shine_effect`, `icon_custom_emoji_id`, `position` для secondary-кнопки, `is_active` и `is_visible`; отдельного параметра для размера, ширины, `border-radius` или формы нет. CSS веб-приложения не управляет нативным Telegram UI. Поэтому сделать нативный Telegram MainButton круглым в рамках текущего API нельзя.

Кастомный DOM-оверлей вместо нативной кнопки намеренно не добавлялся. Круглый вариант сделан только для собственного WebActionBar в Safari/standalone: compact mode использует 56×56px, белый круг и шеврон, с сохранением существующего `shrink-0`/visualViewport keyboard-safe расположения. Остальные экраны и общий WebActionBar не изменены.

Источник: [Telegram Mini Apps — BottomButton](https://core.telegram.org/bots/webapps#bottombutton).

## Gate перед merge

Код не считается готовым к merge только на основании этого отчёта. Нужен повторный ручной прогон владельца на iPhone в Telegram: открыть Journal Flow, пройти все семь шагов с открытой клавиатурой, нажимая Telegram MainButton без предварительного скрытия клавиатуры, затем проверить completion и возврат в дневник.
