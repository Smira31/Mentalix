# Mentalix — Architecture v1

Статус: описание публичного frontend-репозитория `Smira31/Mentalix`,
проверяемый baseline — ветка `main`, HEAD `2b731d4`. Предыдущий audit baseline:
`6a0b4a70e57d38192ae4f95a04e5c886605b704b`. Приватный backend не
проверялся.

## 1. Граница системы

Публичный репозиторий содержит frontend:

- React 18.3;
- Vite 5.4;
- Tailwind CSS 3.4;
- `@twa-dev/sdk`;
- lucide-react;
- Recharts.

Деплой описан как Vercel с автосборкой `main`. API доступен frontend через относительный префикс `/api`.

По документации отдельный приватный `mentalix-bot` содержит FastAPI, SQLAlchemy, aiogram и PostgreSQL на Railway. Это утверждение не подтверждено аудитом приватного кода.

## 2. Основная структура frontend

```text
src/
  main.jsx                 точка входа React
  App.jsx                  shell, auth, тема, навигация, overlays
  index.css                глобальные токены, safe areas, motion
  components/              общие UI-компоненты и иллюстрации
  data/                    локальный контент
  lib/
    api.js                 единый API-клиент
    tgFullscreen.js        fullscreen и safe-area интеграция
  platform/
    index.js               определение Telegram/web
    telegram.adapter.js    Telegram SDK
    web.adapter.js         browser/localStorage адаптер
  screens/                 экраны продукта
    mentalix/              AI-персоны, диалог, journal UI
```

## 3. Поток запуска

```text
main.jsx
→ App
→ определить platform
→ инициализировать fullscreen/theme
→ requestAuth()
→ onboarding или web auth
→ одна из пяти вкладок
→ screen
→ api.js
→ /api
```

Отдельного router package нет. Навигация реализована локальным состоянием `tab`, `overlay`, `sub` и `persona`.

## 4. Ответственность ключевых слоёв

- `App.jsx`: composition root, theme, auth, Telegram behavior, основная навигация, profile/settings overlays.
- `screens/*`: данные и UI конкретного сценария; многие экраны сами вызывают API.
- `lib/api.js`: централизованные HTTP-контракты для habits, rituals, ascezas, check-in, analytics, AI, profile, themes, quotes, courses, focus, brain, subscription и auth.
- `platform/*`: абстракция различий Telegram/web.
- `index.css` + Tailwind: дизайн-токены и базовое поведение.

## 5. Данные и состояние

- серверные данные запрашиваются напрямую из экранов через `useEffect`;
- глобального state/query слоя нет;
- тема, onboarding и web user сохраняются в `localStorage`;
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
3. Нет автоматических unit/integration/e2e тестов и test script.
4. Нет lint/typecheck script; проект JavaScript без схем frontend-контрактов.
5. API-клиент не содержит timeout, отмену запроса, retry, нормализованный тип ошибки или telemetry.
6. Параметры query собираются строками; отсутствует единый слой сериализации.
7. Состояния loading/error/empty реализуются неравномерно.
8. `habits` остаётся в API рядом с продуктовой моделью ритуалов — возможный legacy-контракт.
9. Навигационные состояния не отражены в URL, deep-link ограничен только `?tab=`.
10. Части дизайна задаются hardcoded значениями внутри компонентов.
11. Backend, безопасность Telegram `initData`, авторизация и права доступа не могли быть проверены.

## 8. Правила будущих изменений

- Не менять backend-контракт по предположению: сначала получить соответствующие приватные схемы/роуты.
- Не вводить новый state manager или router без конкретной подтверждённой проблемы.
- Разделять рефакторинг и продуктовую/визуальную правку.
- При изменении `api.js` проверять всех потребителей и backend-контракт.
- При фиксированном UI всегда проверять Telegram safe areas и клавиатуру.
- Перед merge: build, целевой сценарий, smoke web, реальный Telegram для mobile-sensitive изменений.

