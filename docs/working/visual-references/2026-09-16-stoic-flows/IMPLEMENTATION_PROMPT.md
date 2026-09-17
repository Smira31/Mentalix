# Задание агенту: Daily Check-In + Practices по видео-референсу

Работай в актуальном Mentalix от свежего `origin/main`. Сначала зафиксируй полный base SHA, текущий HEAD, `git status --short` и прочитай `AGENTS.md`, `docs/AGENT_ONBOARDING.md`, `PROJECT_STATE.md`, `PRODUCT.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `docs/TASK_INDEX.md`, `AI_RULES.md`.

Цель — адаптировать два и только два пользовательских сценария по приложенным полноэкранным PNG:

1. ежедневный Check-In;
2. каталог и пути Practices.

Это перенос принципов и геометрии, а не копирование Stoic. Интерфейс Mentalix остаётся русским, тёмным и использует существующие токены, данные, маршруты и компоненты.

## Источники истины

- `01-checkin-before.png` — текущий Check-In;
- `02-checkin-mood-after.png` — целевая метрика настроения;
- `03-journal-before.png` — текущая journal-точка входа;
- `04-checkin-editor-after.png` — целевой редактор с клавиатурой;
- `05-checkin-completion-after.png` — целевое завершение;
- `06-practices-before.png` — текущая вкладка Practices;
- `07-practices-home-after.png` — целевой каталог;
- `08-practice-intro-before.png` — текущая fullscreen-грамматика практики;
- `09-practices-library-after.png` — целевая компактная библиотека;
- `10-breathing-active-after.png` — целевое активное дыхание;
- `11-weekly-theme-after.png` — целевая недельная тема;
- `ROUTE_AND_STATE_CONTRACT.md` — обязательная логика переходов и границы.

Все PNG `01–11` — полноэкранные `1320×2868` под iPhone 16 Pro Max. PNG задают композицию, safe-area, плотность, типографическую иерархию и форму. Реальный код задаёт функции, тексты данных, значения, доступность и навигацию.

## Фаза A — Check-In

Рабочие файлы по умолчанию:

- `src/screens/CheckIn.jsx`;
- существующий CSS/стили Check-In;
- `src/components/JournalTextarea.jsx` только если без него невозможно keyboard-safe поведение;
- `src/lib/fullscreenSurface.js` менять нельзя без доказанного общего дефекта.

Сделай:

- спокойную fullscreen-композицию метрик по `02`;
- реальный прогресс по существующему количеству шагов;
- keyboard-safe редактор по `04`: панель действий находится максимально близко к клавиатуре и следует `visualViewport`; история/вопрос остаются читаемыми;
- отдельный финал по `05`, но без новых данных, tags, share/favorite backend и paywall;
- существующий save payload, режимы утро/вечер/checkin и `onDone` оставить без изменения;
- optional feedback не должен блокировать сохранение.

Не превращай декоративные share/favorite из PNG в новую функцию, если её нет в текущем контракте: скрыть или оставить неинтерактивной только в UI Lab.

## Фаза B — Practices

Рабочие файлы по умолчанию:

- `src/screens/Practices.jsx`;
- `src/screens/Breathing.jsx`;
- `src/screens/ThemeScreen.jsx`;
- существующие CSS этих экранов;
- `src/components/SemanticGlyph.jsx` только для переиспользования уже имеющихся glyph-kind;
- `src/components/ui-lab/LayeredPracticeCatalogExperiment.jsx/.css` использовать как исследовательский источник, не импортировать временные данные в production.

Сделай:

- основной каталог по `07`, сохранив пять нижних вкладок и все реальные входы;
- локальный экран «Все практики» по `09` из существующего списка; никаких Premium-замков и нового API;
- активное дыхание по `10`, сохранив существующий таймер, pause/visibility и `onBack`;
- тему недели по `11`, сохранив реальные темы, day selection, редактор и persistence текущего `ThemeScreen`;
- journal/editor и completion переиспользуют грамматику Фазы A, а не создают второй несовместимый компонент.

## Жёсткие запреты

- не копировать Stoic: название, логотип, птицу, фиолетовый, английский текст, paywall, Premium, цены, закрытые карточки;
- не добавлять API, backend, router, dependency, шестую вкладку, новые токены или серверное хранение;
- не менять Today, Mentor, Series/Badges, Settings, Analytics, авторизацию, privacy/security и модель данных;
- не редактировать устаревшие `.tsx`-дубли;
- не вызывать side effects внутри `setState` updater;
- не делать document-level touch handlers;
- не добавлять transform/fade-анимацию на fullscreen-контейнер;
- не merge и не менять production без отдельного разрешения владельца.

## Порядок работы

1. Проведи read-only audit и перечисли точные файлы, которые реально нужны. Не начинай с рефакторинга.
2. Реализуй Фазу A отдельным логическим коммитом.
3. Реализуй Фазу B отдельным логическим коммитом.
4. Обнови только необходимые unit/Playwright expectations, если старый тест противоречит новой утверждённой спецификации. Не ослабляй gate и не удаляй покрытие.
5. Запусти `npm run check:core`, затем `npm run ux:check` и targeted mobile/keyboard проверки.
6. Сделай screenshots на iPhone 16 Pro и iPhone 16 Pro Max минимум для: mood, editor+keyboard, completion, practices home, library, breathing active, weekly theme.
7. Сравни каждый screenshot с PNG и перечисли отличия; исправь геометрию до публикации.
8. Опубликуй READY immutable Preview и обнови только `mentalix-owner-qa.pages.dev`.
9. Сообщи base SHA, полный HEAD SHA, Deployment ID, HTTP 200, JS fingerprint, результаты gates и ссылку Preview.
10. Остановись и жди ручного Telegram/iPhone PASS владельца. Production и merge не трогай.

## Критерий готовности

Технический PASS и визуальный PASS сообщаются отдельно. Задача не считается принятой только потому, что build зелёный. Нужны точное соответствие PNG, работающая клавиатура без скачка/мёртвой зоны, сохранённые реальные маршруты и ручной PASS владельца на iPhone в Telegram.

## Amendment 17.09.2026 (owner decision)

Для экранов Check-In editor и completion, соответствующих референсам `04-checkin-editor-after.png` и `05-checkin-completion-after.png`, владелец разрешил визуально воспроизводить композицию, иконографию и тексты референса, включая их пиксельную геометрию. Это исключение отменяет буквальное ограничение «не копировать Stoic» только для этих двух экранов и не распространяется на остальные сценарии.

Иллюстрация-птица остаётся собственной иллюстрацией Mentalix. Название, логотип, фиолетовый цвет, paywall, Premium, цены и любые другие несуществующие продуктовые функции по-прежнему не переносятся. Share/favorite и другие элементы допускаются только в пределах явно утверждённого owner scope и без добавления backend-функций.
