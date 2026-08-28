# Mentalix — Architecture v1

Статус: описание публичного frontend-репозитория `Smira31/Mentalix`.
Проверяемый baseline — ветка `main`, HEAD `ceb17efb` (28.08.2026).
Backend находится в приватном `Smira31/mentalix-bot`; его runtime и secrets
не выводятся из frontend-кода.

## 1. Граница системы

Публичный репозиторий содержит frontend:

- React 18.3;
- Vite 5.4;
- Tailwind CSS 3.4;
- `@twa-dev/sdk`;
- lucide-react;
- Recharts.

Деплой описан как Vercel с автосборкой `main`. API доступен frontend через относительный префикс `/api`.

Отдельный приватный `mentalix-bot` содержит FastAPI, SQLAlchemy, aiogram и PostgreSQL; актуальный deployment-контур — Render + Neon. Подробности и текущие secrets/contracts должны проверяться только в `mentalix-bot/main` и его `RENDER.md`.

## 2. Основная структура frontend

```text
src/
  main.jsx                 точка входа React
  App.jsx                  shell, auth, Telegram chrome, навигация, overlays
  index.css                глобальные токены, safe areas, motion
  components/              общие UI-компоненты и иллюстрации
  data/                    локальный контент
  lib/
    api.js                 единый API-клиент
    fullscreenSurface.js   fullscreen surfaces, visualViewport и safe-area интеграция
    apiQuery.js             централизованная сериализация query-параметров
    journalStorage.js       local-first хранение четырёхфазного journal
  platform/
    index.js               определение Telegram/web
    telegram.adapter.js    Telegram SDK
    web.adapter.js         browser/localStorage адаптер
  screens/                 экраны продукта
    mentalix/              AI-персоны и диалог
    JournalFlow.jsx         четырёхфазный journal flow
    GuidedJournals.jsx      Telegram-only guided templates и sessions
```

## 3. Поток запуска

```text
main.jsx
→ App
→ определить platform
→ инициализировать fullscreen и тёмный Telegram chrome
→ requestAuth()
→ onboarding или web auth
→ одна из пяти вкладок
→ screen
→ api.js
→ /api
```

Примечание: первый экран Onboarding реализован и переведён на новый визуальный стиль (смёржено в `main`, 19.08.2026, PR #116). Дальнейшие финальные правки зафиксированы в Issue #117.

Отдельного router package нет. Навигация реализована локальным состоянием `tab`, `overlay`, `sub` и `persona`.

## 4. Ответственность ключевых слоёв

- `App.jsx`: composition root, auth, Telegram behavior, основная навигация, profile/settings overlays.
- `screens/*`: данные и UI конкретного сценария; многие экраны сами вызывают API.
- `lib/api.js`: централизованные HTTP-контракты для habits, rituals, ascezas, check-in, analytics, AI, profile, themes, quotes, courses, focus, brain, subscription и auth.
- `platform/*`: абстракция различий Telegram/web.
- `index.css` + Tailwind: дизайн-токены и базовое поведение.

## 5. Данные и состояние

- серверные данные запрашиваются напрямую из экранов через `useEffect`;
- глобального state/query слоя нет;
- onboarding и web user сохраняются в `localStorage`;
- идентификатор пользователя проходит в API как `user_id`;
- ошибки преимущественно пишутся в console, единого error state нет.

## 6. Положительные решения

- platform adapter уменьшает прямую связность с Telegram;
- API-контракты собраны в одном файле;
- fullscreen имеет fallback и cleanup подписок;
- safe areas сведены к CSS-переменным;
- `prefers-reduced-motion` поддержан;
- основной ежедневный сценарий уже выражен в `Today.jsx`.

## 7. Архитектурные риски и долг

1. `App.jsx` совмещает слишком много обязанностей и содержит ручную state-навигацию.
2. Экраны соединяют получение данных, бизнес-решения и presentation.
3. Автоматический Playwright UX smoke доступен через `npm run ux:check`;
   базовые unit-контракты — через `npm run test:unit`. Широкого покрытия
   unit/integration для экранов и API-контрактов пока нет.
4. Есть lint script (npm run lint, ESLint), но нет typecheck script; проект JavaScript без схем frontend-контрактов.
5. API-клиент не содержит timeout, отмену запроса, retry, нормализованный тип ошибки или telemetry.
6. Query-параметры API централизованно сериализуются через
   `src/lib/apiQuery.js::withQuery` (`URLSearchParams`).
7. Состояния loading/error/empty реализуются неравномерно.
8. `habits` остаётся в API рядом с продуктовой моделью ритуалов — возможный legacy-контракт.
9. Навигационные состояния не отражены в URL, deep-link ограничен только `?tab=`.
10. Части дизайна задаются hardcoded значениями внутри компонентов. Частично исправлено 30.07.2026 (`BottomNavigation`/`QuickAdd`) и 16.08.2026 (`MXL-DESIGN-TOKENS-001` — ещё 10 файлов). Оставшиеся случаи без точного токена (`QuickAdd.jsx` тень, `Path.jsx` иллюстрация, error/danger-цвет) зафиксированы явно, не тронуты.
11. Backend, безопасность Telegram `initData`, авторизация и права доступа требуют проверки по приватному `mentalix-bot` contract. Frontend-документация фиксирует только известные security findings и не должна объявлять backend исправленным без backend evidence. Security contract и оставшийся auth backlog описаны в связанном security-документе и `PROJECT_STATE.md`.

Активный backlog — только `docs/TASK_INDEX.md`. `TASKS.md` и `CHANGES.md` являются историческим слоем и не должны использоваться как текущий список работ.

## 8. Fullscreen-поверхности и отступы

Контейнер контента в `App.jsx` имеет класс `animate-fade-in`. До коммита `f2e9f65`
(02.08.2026) анимация также двигала `transform` (`translateY` + `scale`), и при
`fill-mode: both` её финальный кадр оставался на элементе навсегда — ненулевой
`transform` у предка создаёт containing block, и любой `position: fixed` внутри
якорится к этому контейнеру, а не к viewport. `f2e9f65` убрал `transform` из
keyframes (жалобы на дёрганость в WKWebView) — сейчас `fadeIn` анимирует только
`opacity` и сам по себе containing block не создаёт.

Практические последствия, подтверждённые runtime-проверками на iPhone: экран,
объявленный полноэкранным, начинается ниже реального верха, его низ уходит за
нижнюю кромку, внутренние зоны не переполняются — а значит и не скроллятся, — и
элементы, стоящие в конце потока, оказываются физически недостижимы.

Поэтому действует контракт:

1. Полноэкранная поверхность рендерится через `createPortal` в `document.body`.
2. Высота берётся из `visualViewport`, иначе при открытой клавиатуре низ уходит
   за видимую область.
3. В Telegram fullscreen сверху добавляются 56 px под контролы Telegram.
4. Пока поверхность открыта, скролл `body` заблокирован: иначе iOS двигает layout
   viewport при появлении клавиатуры.

Реализация: `src/lib/fullscreenSurface.js` — хук `useFullscreenSurface` и общие
классы. Потребители: `CheckIn`, `ThemeScreen`, `Onboarding`.

Отступы сверху и снизу принадлежат `App.jsx`. Экраны-вкладки используют обёртку
`w-full max-w-md px-5` и не задают собственные вертикальные отступы. До этого
экраны решали сами: `max-w-sm px-6`, `max-w-md px-5`, `px-[14px]`, плюс `pb-40`
поверх уже зарезервированных под навигацию ста пикселей. Отсюда возникал разный
визуальный масштаб вкладок.

На Today wordmark `MENTALIX` рендерится отдельным absolute-слоем в 56px-зоне
Telegram controls и уходит вместе с прокруткой страницы. Шестерёнка открывает
`settings`; профиль является вложенным экраном настроек. Оба overlay используют
системную Telegram Back через общий `BackButton`, а web получает его fallback.

## 9. Правила будущих изменений

- Не менять backend-контракт по предположению: сначала получить соответствующие приватные схемы/роуты.
- Не вводить новый state manager или router без конкретной подтверждённой проблемы.
- Разделять рефакторинг и продуктовую/визуальную правку.
- При изменении `api.js` проверять всех потребителей и backend-контракт.
- При фиксированном UI всегда проверять Telegram safe areas и клавиатуру.
- Новую полноэкранную поверхность строить только через `useFullscreenSurface`; не вычислять отступы и высоту заново.
- Не добавлять экрану собственные вертикальные отступы: ими владеет `App.jsx`.
- Жесты внутри Telegram Mini App реализовывать нативными средствами CSS, а не document-level обработчиками касаний: свои обработчики конфликтуют с жестами Telegram.
- Перед merge: build, целевой сценарий, smoke web, реальный Telegram для mobile-sensitive изменений.
