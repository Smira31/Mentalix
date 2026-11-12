---
status: current
last_verified: 2026-11-12
---

# Приватность: согласие на доступ ИИ к записям

Заметки «грабли» по поверхности согласия. Источник текстов и условий —
`src/lib/aiContextConsent.js`; контракт бэкенда не менялся:
GET/PUT `/api/mentalix/consent` (`api.mentalix.contextConsent` /
`setContextConsent`), новых endpoint'ов нет.

## Где поверхность

- **«Диалог»** — тихая строка `src/screens/mentalix/AiContextConsentLine.jsx`
  в `contextSlot` `ConversationChat` (подключение — `src/screens/Mentalix.jsx`).
  Условия показа: `canManageAiContext(user)`, известное состояние сервера
  «выкл.» (`unknown` не показываем), роль из `AI_CONTEXT_PERSONAS`, нет
  кризисного ответа (`hidden`).
- **Профиль → «твои данные.» → «Приватность»** — `AiConsentSwitchRow.jsx`
  (группа в `Settings.jsx`). Включение открывает окно согласия, выключение
  срабатывает сразу. Сегодняшний чек-ин при включении не отмечается:
  `setCheckinContext` здесь вызывать нельзя.

## Грабли

- Вход «Настроить» — существующая навигация в Профиль: ключ намерения
  `sessionStorage['mx-settings-initial-sub'] = 'data'` + `setOverlay('settings')`
  в `App.jsx`. Новых маршрутов нет. `Settings.jsx` читает ключ в инициализаторе
  `useState`, а снимает в эффекте после монтирования — удалять ключ внутри
  инициализатора нельзя (StrictMode вызывает его дважды).
- Группа «Приватность» — первая в под-экране «твои данные.», поэтому
  отдельная прокрутка не нужна: Профиль монтируется заново и скролл стоит
  наверху. Если появится контент выше группы, прокрутку придётся добавлять.
- Закрытие Профиля отправляет `mentalix:tab-refresh` для активной вкладки,
  поэтому строка перечитывает согласие через `useTabRefresh('mentor', …)`.
  Без этого она оставалась бы висеть после включения доступа.
- Окно согласия — существующий `ConfirmDialog` (`src/components/ConfirmDialog.jsx`,
  DESIGN_SYSTEM §5.4). Свайпа у него нет: закрывают «Не сейчас» и фон.
  Нажатие на переключатель само ничего не отправляет — PUT уходит только из
  `save()` после «Включить» или при выключении.
- В песочнице Base44 задан `VITE_PRO_MOCK=ready`: согласие перехватывает
  dev-мок Pro (`src/lib/proMock.js`) и хранит состояние в
  `localStorage['mx-pro-mock-state:v1']`, а не в демо-состоянии
  `mentalix_preview_demo_state_v6`. Тест поэтому проверяет не хранилище,
  а переживание reload: после «Не сейчас» доступ выкл., после «Включить» — вкл.
- Оболочка превью даёт платформу web, где поверхность согласия не
  показывается вовсе. Доказательство — целевой набор, а не превью.

## Проверки

```bash
npm run check:core
npx playwright test -c playwright.consent-ui.config.mjs   # npm run ux:consent-ui
```

Перед первым прогоном в контейнере: `npx playwright install --with-deps chromium`.
Кадры 393×852 и 360×640 — `qa-evidence/ai-context-consent/` (строка в «Диалоге»,
Профиль, окно согласия); в снимках обязателен `animations: 'disabled'`.
Строка проверяется на одной строкой (высота), окно — что целиком влезает в экран.
iPhone/Telegram остаётся ручным gate.
