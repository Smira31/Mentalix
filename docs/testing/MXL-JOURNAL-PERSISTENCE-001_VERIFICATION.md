# MXL-JOURNAL-PERSISTENCE-001 — локальная визуальная проверка

**Дата:** 27 августа 2026 г.  
**Scope:** переработанный local-first `JournalFlow`: явный вход из «Практик», intro, четыре фазы, completion/return, user-scoped storage, explicit legacy migration и storage-failure handling. Backend/API, cloud sync, число primary tabs, AI personas и design tokens не менялись.

## Автоматический визуальный срез

Кадры нового route из `artifacts/ux-check/{390x844,320x568}/03b-journal-intro.png`, `03c-journal-writer.png` и `03d-journal-complete.png` просмотрены после финального UX smoke.

| Viewport | Результат | Наблюдение |
|---|---|---|
| 390×844 | PASS | Intro, Writing Canvas с четырьмя фазами, completion, возврат и повторное открытие проверены на desktop-web viewport без горизонтального overflow и без видимой нижней навигации во focused flow. |
| 320×568 | PASS | Многострочный intro, progress, редактор/dock и completion CTA остаются читаемыми и достижимыми; автотест проверяет return, reopen, `final` после правки и Back. |

## Доступные автоматические проверки

- `npm run test:unit`: 31/31 PASS, включая user isolation, explicit legacy migration, merge safety и storage failure.
- `npm run lint`: PASS.
- `npm run build`: PASS.
- `npm run docs:check`: PASS, 110 Markdown files, 29 canonical task IDs, 0 errors.
- `npm run ux:check`: PASS; маршрут `Практики → Журнал → intro → 4 фазы → completion → return/reopen` проверен для `390×844` и `320×568`.
- `git diff --check`: PASS.

## Непроверенная граница

Этот срез **не заменяет ручной Telegram/iPhone gate**: local browser smoke не воспроизводит Telegram controls, iOS keyboard, CloudStorage availability, touch/scroll physics и реальный lifecycle background/return. До этого gate изменения не следует называть полностью принятыми для production.

## Visual review — Journal Flow relocation (390×844)

Кадры `03b-journal-intro.png` и `03c-journal-writer.png` просмотрены после перемещения маршрута в «Практики».

| Экран | Результат | Наблюдение |
|---|---|---|
| Intro | PASS | Полноэкранный entry screen использует тот же спокойный focused-flow ритм, что и существующие practices: Back, короткий label, один смысловой заголовок, пояснение, semantic book glyph и одна CTA `Начать`. Нижняя навигация отсутствует, как и требуется для focused flow. |
| Writing | PASS | Прогресс, вопрос, пояснение, зона текста и dock видимы без горизонтального overflow; нижний `Aa` и save-check не конкурируют с отдельной полноширинной CTA. На скриншоте textarea заполнена тестовой фразой, поэтому placeholder не оценивался. |

Реальная Telegram/iPhone keyboard/safe-area проверка остаётся обязательной.

## Visual review — completion (390×844 и 320×568)

Кадры `03d-journal-complete.png` просмотрены на двух размерах.

| Viewport | Результат | Наблюдение |
|---|---|---|
| 390×844 | PASS | Completion отделён от сохранения: видны подтверждение, объяснение того, что сохранено, главная CTA возврата в «Практики» и вторичное действие для повторного открытия записи. |
| 320×568 | PASS | Заголовок, описание, visual marker, статус `4 из 4 шагов сохранены`, главная CTA и вторичное действие помещаются и читаются без горизонтального overflow. |

Это закрывает зафиксированный пользователем дефект «нажимаю завершить — ничего не происходит» в локальном web UX smoke. Реальная iPhone/Telegram проверка остаётся последним обязательным gate.

## Visual review — compact viewport after final smoke (320×568)

| Экран | Результат | Наблюдение |
|---|---|---|
| Intro | PASS | Многострочный заголовок, пояснение, journal glyph и `Начать` помещаются целиком; CTA остаётся над нижним краем и не теряет заметность. |
| Writing | PASS | Четыре сегмента прогресса, label, двухстрочный вопрос, hint, текстовая область и dock видимы в узком viewport. В кадре нет видимой нижней навигации или горизонтального overflow. |

Автоматическая проверка этого прохода также подтверждает повторное открытие готовой записи, сохранение `newStep.status: final` после правки и возврат в «Практики» через Back.
