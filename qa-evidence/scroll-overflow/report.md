# Искусственная прокрутка и нестабильные короткие экраны (Issue #1096)

Ветка `fix-scroll-overflow`. База — свежий `origin/main` (`0b66fdcc`, включает
смерженные #1124 и #1125); синхронизация выполнена слиянием, без force-push и
rebase, чужие изменения не затронуты.

Прогон — Chromium (Playwright) в web-контейнере Base44. Вьюпорты задачи —
360×640 и 430×932, демо-режим `?demo=1`, `?frame=0` (поверхность считается от
размера окна, как на телефоне).

## Причина дефекта

1. `.mx-scroll-content` держал `min-height: calc(100% + 1px)` — «резинка» iOS,
   из-за которой `scrollHeight` любого экрана был ровно на 1 px больше
   `clientHeight`. Короткие вкладки (Шаги, Диалог, Библиотека) прокручивались
   на этот 1 px при полностью помещающемся контенте.
2. Утренний шаг заметки получал принудительный `overflowY: 'scroll'`
   (`CheckIn.jsx`). Ветка недостижима: `CheckInCore` рендерится только при
   `mode === 'evening'`, поэтому `isMorningNoteStep` всегда `false`. Полоса
   прокрутки резервировалась впустую (мёртвый код после коммита `463f279f`).

## Что изменено

1. `src/index.css` — `min-height: calc(100% + 1px)` → `min-height: 100%`.
   Упругое протягивание на iOS остаётся штатным (`overscroll-behavior-y: auto`
   у `.mx-app-scroll-root`), длинные экраны прокручиваются как раньше.
2. `src/screens/CheckIn.jsx` — удалён недостижимый `interactiveStyle` с
   `overflowY: 'scroll'`; область шага снова использует `overflow-y: auto` из
   `FULLSCREEN_SCROLL_CLASS`.

Механизм, тексты, API, иллюстрации и общий scroll-root не тронуты.

## Замер после исправления (текущая ветка)

Лишняя прокрутка = `scrollHeight − clientHeight` скролл-контейнера.

| Экран | 360×640 | 430×932 |
| --- | --- | --- |
| Сегодня (длинный) | 607 px — естественная | 367 px — естественная |
| Шаги | **0** | **0** |
| Диалог | **0** | **0** |
| Библиотека | **0** | **0** |
| Прогресс | 0 (помещается) | 1145 px — естественная |
| Шаг заметки утреннего чек-ина | **0**, `overflow-y: auto`, полоса не зарезервирована | **0**, `overflow-y: auto` |
| Длинный экран: низ достигнут | `scrollTop` = `maxScroll` = 607 | `scrollTop` = `maxScroll` = 367 |

До исправления короткие экраны прокручивались ровно на 1 px (следствие
`calc(100% + 1px)`) — кадры «до» приложены ниже.

## Проверки

```bash
docker compose -f docker-compose.base44.yml exec -T web npm run check:core
docker compose -f docker-compose.base44.yml exec -T web npx playwright test --config=playwright.scroll-overflow.config.mjs
```

- `check:core` (unit + lint + build + content-leak + docs:check) — PASS.
- `playwright.scroll-overflow.config.mjs` — **14 passed** (Chromium).

Полный `ux:check` и WebKit локально не запускались (остаются CI) — NOT RUN.

## Кадры

- До: `qa-evidence/scroll-overflow/before/`
- После: `qa-evidence/scroll-overflow/after/`

## Ручной gate (NOT RUN)

Реальный iPhone/Telegram: открытие клавиатуры, safe-area и упругое
протягивание автопроверкой не покрываются — проверяются вручную.
