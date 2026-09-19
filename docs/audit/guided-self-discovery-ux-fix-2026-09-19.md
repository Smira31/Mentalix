---
status: ready-for-owner-gate
date: 2026-09-19
scope: GuidedSelfDiscoveryFlow only
---

# Guided Self-Discovery UX fix — 2026-09-19

## Диагноз до правки

Корень проблемы с клавиатурой находился в расхождении с уже работающим контрактом `CheckIn.jsx`. `CheckIn` публикует действие шага через `useMainButton` в Telegram и `WebActionBar` в вебе. Эти controls живут вне контента fullscreen-shell: Telegram рисует `MainButton` поверх системной клавиатуры, а веб-`WebActionBar` остаётся последним `shrink-0` элементом shell, высота которого уже ограничена `visualViewport`.

`GuidedSelfDiscoveryFlow` до правки передавал `onSubmit` непосредственно в `PracticeWritingCanvas`. Кнопка перехода поэтому жила в локальном absolute/fixed dock внутри canvas и зависела от visual viewport и keyboard-offset логики canvas. Это был отдельный механизм, а не контракт `CheckIn`; на реальном iPhone в Telegram dock оказывался под клавиатурой. Дополнительное расхождение: flow не оборачивал содержимое intro/writing/completion в `FULLSCREEN_SCROLL_CLASS` и держал completion primary CTA внутри completion-контента.

## Изменения

- Guided flow теперь публикует действие текущего шага через `useMainButton` и `WebActionBar`.
- Локальная submit-кнопка `PracticeWritingCanvas` для этого flow больше не монтируется; пустой dock не рендерится.
- Intro, writing и completion используют общий `FULLSCREEN_SCROLL_CLASS`.
- Completion primary CTA «Вернуться в дневник» перенесён в тот же action bar; внутри completion сохранено вторичное действие «Начать заново».
- Вопросы, тексты, draft-модель и сохранение ответов не менялись.
- Responsive UX-сценарий обновлён под широкий action bar и сохраняет screenshots для всех семи шагов и completion.

## Проверки

- `npm run check:core` — passed.
- `npm run ux:check` — 11/11 passed.
- `npx playwright test --config=playwright.mxl246.config.mjs` — 8/8 passed на 390×844, 768×1024, 1024×768 и 1440×900.
- В `qa-evidence/mxl-246/390x844/` сохранены состояния 390×844; contact sheet доступен как `390x844-journal-after-contact-sheet.png`.

## Gate перед merge

Код не считается готовым к merge только на основании этого отчёта. Нужен повторный ручной прогон владельца на iPhone в Telegram: открыть Journal Flow, пройти все семь шагов с открытой клавиатурой, нажимая Telegram MainButton без предварительного скрытия клавиатуры, затем проверить completion и возврат в дневник.
