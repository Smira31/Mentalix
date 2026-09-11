---
status: current
last_verified: 2026-09-11
---
# Отчёт: комплексный фикс вкладки «Прогресс»

## Изменённые файлы

| Файл                                                   | Изменения                                                                                                                                                                                                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui-lab/ProgressRedesignExperiment.css` | Удалено legacy-переопределение заголовка; observation typography возвращена к `.mx-type-insight`; контраст 7 указанных мест переведён с `--c-faint` на `--c-muted`; подписи дат увеличены до 11px; три группы интерактивных элементов увеличены до 44px. |
| `src/screens/Analytics.css`                            | Убраны V2 override-цвета `--c-faint` для eyebrow/observation labels и удалено неиспользуемое правило для `.activity-card > strong`.                                                                                                                      |
| `src/screens/Analytics.jsx`                            | Заголовок переведён на `font-display mx-type-page text-cream lowercase`; вторичные observation cards получили `mx-type-insight`.                                                                                                                         |
| `tests/unit/maintenance-contracts.test.mjs`            | Удалено устаревшее требование старого класса `mx-type-analytics-heading`, заменённого тикетом на канонический `mx-type-page`.                                                                                                                            |

## Проверки

- `npm run test:unit` — PASS.
- `npm run lint` — PASS, 0 errors, 14 существующих warnings.
- `npm run build` — PASS.
- `npm run ux:progress-production` — PASS на `320x568`, `375x812`, `390x844`, `430x932`.
- `git diff --check` — PASS.

Первый запуск UX-проверки был заблокирован отсутствующим Playwright Chromium; после установки runtime проверка выполнена успешно. Второй запуск также потребовал поднять Vite на `127.0.0.1:5173`; после этого все viewport checks прошли.

## Скриншоты 390×844

Baseline до фикса и результат после фикса сохранены в отдельных каталогах. Скриншоты сделаны профильным production UX harness с одинаковыми fixture-данными:

- До: `artifacts/mxl-progress-production-before/390x844.png`
- После: `artifacts/mxl-progress-production-after/390x844.png`

Отдельный PR создан без merge и deploy; статус GitHub Actions проверяется после публикации PR.

## Ограничения

Изменения не затрагивают данные, вычисления, API, backend или поведение feature flag. Единственная синхронизация вне трёх исходных файлов — обновление maintenance-теста, который проверял удаляемый тикетом класс заголовка и иначе блокировал зелёный unit check.

## Rollback

Откат выполняется обычным revert коммита PR.

## Diff summary

```text
src/components/ui-lab/ProgressRedesignExperiment.css
src/screens/Analytics.css
src/screens/Analytics.jsx
tests/unit/maintenance-contracts.test.mjs
```

Рабочие изменения восстановлены после baseline-съёмки; baseline-файлы не входят в production-код.

---

## Визуальная проверка

Профильный harness подтвердил отсутствие горизонтального overflow, корректную production-композицию legacy, наличие четырёх периодов, rail observations и корректные размеры текста на всех проверенных viewport’ах.
