---
status: current
last_verified: 2026-09-20
---

# Аудит Telegram BackButton

## Вывод

На `main` общий `BackButton` уже используется в части fullscreen-экранов, но навигация остаётся неоднородной. Найдены production-экраны и компоненты, где возврат рисуется вручную через `ArrowLeft`, `ChevronLeft`, текстовую кнопку или `X`, а `BackButton`/`useBackButton` для этого состояния не зарегистрирован.

**Исходный SHA аудита:** `7f5f41291b46bc0a17b70241a0c18de0bf229a4e`

Аудит ограничен диагностикой. В этом PR не изменяются `src/`, поведение приложения, navigation stack или стили.

Исторические fullscreen-flow и связанные findings до закрытия legacy practice collections сохранены в [`docs/audit/archive/`](archive/). Они не заменяют текущий navigation audit и не описывают production-состояние после PR #743/#744.

## Как проверялось

Проверены:

- общий компонент `src/components/BackButton.jsx`;
- хук и стек `src/platform/telegram.hooks.js`;
- production-экраны в `src/screens/` и production-компоненты в `src/components/`;
- ручные `ArrowLeft`, `ChevronLeft`, `X`, текстовые кнопки «Назад» и обработчики возврата;
- открытые Issues и PR перед началом работы.

Важное правило текущей реализации: если экран не вызывает `useBackButton`/`BackButton` для активного состояния, нативный Telegram BackButton не получает внутренний обработчик. В таком состоянии Telegram может выполнить своё действие по умолчанию — закрыть Mini App.

## Production: найденные места без общего BackButton

| Приоритет | Экран / компонент | Файл | Ручная кнопка | Что происходит с Telegram BackButton |
|---|---|---|---|---|
| P0 | Check-in, карточка вопроса | `src/screens/CheckIn.jsx:1303-1330` | `ChevronLeft` «Назад» и `X` «Закрыть» | `CheckIn` не импортирует и не вызывает общий `BackButton`/`useBackButton`; системный BackButton не получает переход на предыдущую карточку или `requestClose()` и может закрыть всё приложение. |
| P0 | Коллекция практик: практики / ритуалы / аскезы | `src/components/PracticeCatalogV2.jsx:258-269` | `ArrowLeft`, «Назад к коллекциям» | Компонент не регистрирует native back для выбранной коллекции; системный BackButton может закрыть Mini App вместо возврата к списку коллекций. |
| P0 | Библиотека V2: каталог программ, программа, каталог статей, статья | `src/screens/Library.jsx:145-220` | `ArrowLeft`, `aria-label="Назад"` | Вложенные состояния меняются локальным `setScreen`/`setLibraryV2Article`, но общий BackButton не зарегистрирован; системный BackButton может закрыть Mini App вместо выхода из вложенного состояния. |
| P0 | Направленные записи: каталог, выбранная запись, прохождение записи | `src/screens/GuidedJournals.jsx:282-288`, `:713-720`, `:758-764`, `:819-826` | текстовые кнопки «Назад», «К каталогу», «Сохранить и выйти» и `ArrowLeft` | Общий BackButton используется только в `CompletedSessionViewer` (`:177-180`). В остальных вложенных состояниях native back не зарегистрирован и может закрыть Mini App. |
| P1 | Статьи: список коллекции | `src/screens/Articles.jsx:108-120` | `ArrowLeft`, «Вернуться в библиотеку» | Общий `BackButton` есть только в `ArticleReader` (`:68-72`). На списке коллекции остаётся ручная кнопка, а native back не имеет экранного обработчика и может закрыть Mini App. |
| P1 | Материалы / Courses: детали материала | `src/screens/Courses.jsx:143-172` | `ArrowLeft`, текст «Назад» | `CourseDetail` не использует общий `BackButton`; native back может закрыть Mini App вместо `setSelected(null)`. Экран не является fullscreen, но нарушает тот же контракт навигации. |

## Production: смешанные или дублирующие реализации

Эти места уже частично используют общий компонент, поэтому их нельзя считать полностью отсутствующими, но их нужно проверить в следующих точечных PR:

| Экран / компонент | Файл | Наблюдение |
|---|---|---|
| Статьи | `src/screens/Articles.jsx` | `ArticleReader` использует `BackButton`, но список коллекции рисует отдельный `ArrowLeft`. Нужно привести оба состояния к одному контракту. |
| Направленные записи | `src/screens/GuidedJournals.jsx` | `CompletedSessionViewer` использует `BackButton`, а каталог, редактор и активная запись рисуют свои кнопки. |
| Закреплённые практики | `src/components/PinnedPractices.jsx:23-29` | В шапке одновременно есть общий `BackButton` и отдельный `X` «Закрыть». Это визуальный дубль, хотя компонент уже подключён. Внутренние `X` для снятия закрепления (`:224-229`) не являются навигацией назад. |
| Восстановление серии | `src/components/StreakRestoreSheet.jsx:55-86` | Есть общий `useBackButton(onClose)`, но также есть визуальные кнопки закрытия. Это sheet-level close, не экранная навигация; проверить отдельно, если нужен единый визуальный контракт. |
| Поле записи практики | `src/components/PracticeWritingCanvas.jsx:109-116` | `X` закрывает только внутреннее поле записи через `onClose`; это не самостоятельный fullscreen-экран. Не включать в первую волну замены без подтверждения желаемого UX. |

## UI Lab / preview-only: ручные кнопки вне production-списка

Эти файлы не входят в список production-фиксов, потому что относятся к экспериментам и preview-сценариям. Их можно обработать отдельно после production-аудита:

- `src/components/ui-lab/LayeredPracticeCatalogExperiment.jsx` — `ArrowLeft` в demo-экранах коллекции, журнала и темы;
- `src/components/ui-lab/LibraryExperiment.jsx` — ручные back-кнопки preview-каталога и preview-статей;
- `src/components/ui-lab/LibraryProgramsExperiment.jsx` — экранный `useBackButton` уже есть, но остаются видимые web/demo-кнопки;
- `src/components/ui-lab/EveningReviewExperiment.jsx` — текстовая `← Назад`;
- `src/components/ui-lab/HistoryTrendsJournalExperiment.jsx` — ручная кнопка перехода в историю;
- `src/components/ui-lab/MorningCheckinExperiment.jsx`, `ProgressRedesignExperiment.jsx`, `UiExperiments.jsx` — preview-кнопки, найденные поиском ручных back/close-паттернов.

## Отдельно: где Telegram BackButton может закрыть всё приложение

**Подтверждённые по коду кандидаты:**

1. `src/screens/CheckIn.jsx` — fullscreen-карточка вопроса и состояние серии не регистрируют общий BackButton.
2. `src/components/PracticeCatalogV2.jsx` — выбранная коллекция практик не регистрирует общий BackButton.
3. `src/screens/Library.jsx` — вложенные V2-состояния библиотеки меняются локальным состоянием, но native back не подключён.
4. `src/screens/GuidedJournals.jsx` — каталог, редактор и прохождение записи не используют общий BackButton.
5. `src/screens/Articles.jsx` — список коллекции не использует общий BackButton; reader уже использует его, поэтому экран требует точечного выравнивания, а не полной замены.
6. `src/screens/Courses.jsx` — детали материала используют только локальную кнопку.

Это **диагноз по коду**, а не подтверждение реальным Telegram/iPhone. Для каждого пункта нужен отдельный ручной gate в Telegram после точечного исправления: открыть состояние, нажать native BackButton и убедиться, что закрывается только текущий экран/вложенное состояние.

## Уже использующие общий контракт и не являющиеся находками этого аудита

По текущему коду общий компонент уже подключён, среди прочего, в `Rituals`, `ProcrastinationFlow`, `NarrowFocusFlow`, `FinishFlow`, `Ascezas`, `TodayFocusFlow`, `SceneLayout`, `Conversation`, `QuoteView`, `AppLock`, `Onboarding`, `GuidedJournals` (только viewer-state), а также в других перечисленных в коде состояниях. Их не нужно повторно заводить в общий список без новой проверки поведения.

## Граница этого PR

В этом PR добавляется только данный audit-файл. Исправление экранов, замена ручных кнопок, изменение navigation stack и изменение UI намеренно отложены до отдельных точечных PR по одному экрану.

## Следующий шаг

Брать production-находки по одной, начиная с `CheckIn.jsx` или `PracticeCatalogV2.jsx`: сначала подключить общий BackButton к нужному состоянию, затем проверить предыдущий экран, закрытие и реальный native BackButton в Telegram на iPhone.
