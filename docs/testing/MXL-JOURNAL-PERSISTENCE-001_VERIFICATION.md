# MXL-JOURNAL-PERSISTENCE-001 — локальная визуальная проверка

**Дата:** 27 августа 2026 г.  
**Scope:** local-first persistence slice: user-scoped journal storage, explicit legacy migration and storage-failure handling. Backend/API, cloud sync, primary navigation and design tokens не менялись.

## Автоматический визуальный срез

Кадры `artifacts/ux-check/390x844/03b-journal-home.png` и `artifacts/ux-check/320x568/03b-journal-home.png` просмотрены после обновления UX smoke.

| Viewport | Результат | Наблюдение |
|---|---|---|
| 390×844 | PASS | Заголовок, четыре фазы, вопрос, текстовая зона, форматирование, CTA «Продолжить» и нижняя навигация помещаются без горизонтального overflow; иерархия текста различима. |
| 320×568 | PASS | Заголовок, шаги, вопрос, редактор и форматирование остаются видимы; CTA находится ниже области кадра только после ввода и регулируется реальным scroll-контентом, а не фиксированным перекрытием. Автотест подтверждает доступность CTA. |

## Доступные автоматические проверки

- `npm run test:unit`: 31/31 PASS, включая user isolation, explicit legacy migration, merge safety и storage failure.
- `npm run lint`: PASS.
- `npm run build`: PASS.
- `npm run docs:check`: PASS, 109 Markdown files, 29 canonical task IDs, 0 errors.
- `npm run ux:check`: PASS; маршрут Journal Home добавлен для `390×844` и `320×568`.
- `git diff --check`: PASS.

## Непроверенная граница

Этот срез **не заменяет ручной Telegram/iPhone gate**: local browser smoke не воспроизводит Telegram controls, iOS keyboard, CloudStorage availability, touch/scroll physics и реальный lifecycle background/return. До этого gate изменения не следует называть полностью принятыми для production.
