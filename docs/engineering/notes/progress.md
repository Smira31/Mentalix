# Грабли: экран «Прогресс» (Аналитика / История)

Заметки по задачам экрана «Прогресс». Процессные правила — в `AGENTS.md`,
визуальные — в `DESIGN_SYSTEM.md` §5.5.

## Сегмент «Аналитика | История» — в строке кнопок вкладки

- Сегмент живёт в `.mx-progress-actions-row` (слева), кнопки активной вкладки —
  в `.mx-progress-actions-row__actions` справа. В полосу кнопок Telegram
  (`--app-safe-top`) и в `DemoTelegramHeader` его больше не выносим.
- Причина: `position: fixed` внутри `.mx-app-scroll-root` (`overflow-x: clip`).
  Переключение вкладок мутирует содержимое скроллера, и в iOS WebKit
  fixed-строка перестаёт перерисовываться: раскладка и тапы работают, а пилюля
  невидима. `will-change: transform` не помогал. Липкая строка (`position:
  sticky`) на фоне `--c-bg` — единственный режим для всех вкладок и оболочек,
  поэтому поведение при прокрутке одинаково на «Аналитике» и «Истории».
- `ProgressHistory` порталит свои кнопки (`history-*`) в
  `[data-testid="progress-row-actions"]`, а не в `.mx-progress-actions-row`:
  иначе `space-between` растаскивает вложенные узлы портала по строке.
- Ширина строки на 360×640: сегмент 177 px + зазор 11 px + кнопки «Истории»
  (пилюля группировки ≈ 70–80 px + два круга 39 px + зазоры) помещаются в
  328 px контента. Уменьшать шрифт ниже токенов и прятать кнопки нельзя;
  первым сжимается только зазор.
- Проверка: `npx playwright test --config=playwright.progress-segment.config.mjs`
  (Chromium, demo). Тест переключает вкладки 5 раз и проверяет краску пилюли
  (`elementFromPoint` в центре), одинаковую строку с кнопками и отсутствие
  обрезки текста на 360×640. Полный `ux:check` и WebKit — CI, iPhone — ручной gate.
- В свежем web-контейнере браузера Playwright нет: перед первым прогоном
  `npx playwright install --with-deps chromium`.
- Эталоны `playwright.progress-visual.config.mjs` в репозитории не хранятся:
  CI скачивает артефакт `visual-baselines-progress` из workflow
  `visual-baselines.yml` на `main`. Локальный прогон без эталонов первый раз
  пишет их и падает — второй прогон зелёный; сгенерированные каталоги
  `tests/ux/*.spec.mjs-snapshots/` не коммитим.
