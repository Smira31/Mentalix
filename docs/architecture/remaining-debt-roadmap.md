# Mentalix — план оставшегося архитектурного долга

Дата: 2026-09-01.

## Короткий вывод

После текущих PR проект не требует большого переписывания. Правильный порядок — сначала закрыть проверяемость и честные состояния экранов, затем постепенно уменьшать связанность `App.jsx` и экранов с API. Продуктовые, backend, privacy и Telegram/iPhone решения не следует принимать по предположению.

## Этап 0 — закрыть текущие PR

### PR #464 — Today cache runtime coverage

Статус: открыт.

Нужно дождаться обязательных GitHub checks и проверить, что runtime-сценарий действительно подтверждает: критичный сбой не превращается в пустой Today, retry делает новый запрос, ошибочный snapshot не используется.

Definition of Done: required checks зелёные, diff ограничен тестом, PR просмотрен, merge выполнен владельцем или отдельно подтверждённым admin-merge.

### PR #465 — Profile load error state

Статус: открыт.

PR исправляет реальный UX/architecture defect: ошибка основного profile-запроса раньше только логировалась и могла выглядеть как пустая история. Нужно дождаться checks и отдельно пройти ручной Profile/Settings gate на Telegram/iPhone.

Definition of Done: required checks зелёные, Profile error/retry не меняет Settings и navigation, ручной gate выполнен или явно отмечен blocked.

## Этап 1 — завершить MXL-UI-AUDIT-001

Задача: [Issue #291](https://github.com/Smira31/Mentalix/issues/291).

### 1.1. Закрыть web evidence

Проверить маршрут `Launch → Today → Practices → Journal → возврат в Today` на актуальном `main`. Для каждого шага записать expected/observed/result. Отдельно проверить loading, success, empty и error состояния Practices, затем полный Journal flow от входа до completion/reopen.

### 1.2. Accessibility и responsive

Проверить keyboard focus, accessible names, alert/status semantics, disabled controls, горизонтальный overflow и доступность primary CTA на 320×568, 390×844 и 430×932.

### 1.3. Telegram/iPhone manual gate

Повторить critical path в настоящем Telegram Mini App на iPhone. Проверить safe-area, Back, fullscreen, keyboard и нижнюю навигацию. Desktop/web smoke не заменяет этот gate.

Definition of Done: evidence в `qa-evidence/mxl-ui-audit-001/`, route matrix, screenshots/trace при failure, список дефектов P0–P3 и explicit manual-gate status.

## Этап 2 — Practices и остальные экранные состояния

### 2.1. Practices

После PR #463 проверить уже реализованные loading/error/retry состояния через runtime failure injection. Убедиться, что настоящее пустое состояние не смешивается с API failure.

### 2.2. JournalFlow

Добавить boundary/контракт для runtime failure только если аудит подтвердит, что сбой теряется или оставляет пользователя в недоступном состоянии. Не менять privacy, storage или AI consent.

### 2.3. Settings/Profile

Не добавлять новый Settings PR без подтверждённого дефекта. Profile error-state уже вынесен в #465. После merge проверить, что tier/subscription failure не создаёт ложного premium-состояния; если создаёт — отдельный узкий PR.

## Этап 3 — API и состояние данных

### 3.1. Управляемая отмена

После PR #454 проверить всех потребителей API перед расширением caller-driven `AbortSignal`. Не менять endpoint и schema. Для каждого consumer определить owner cleanup и отсутствие retry после caller abort.

### 3.2. Query-layer

React Query provider уже подключён, но экраны преимущественно используют прямые `useEffect` вызовы. Мигрировать сначала один независимый read-only экран, предпочтительно Analytics/Library, если текущие PR не заняты. Сравнить loading/error/cache semantics до и после.

Definition of Done: один экран, один query hook, отсутствие нового state manager, целевые unit/UX tests, rollback через revert одного PR.

### 3.3. API contract/type safety

Добавить минимальную проверку формы критичных frontend responses или JSDoc/JSON-schema только после выбора допустимого источника схемы. Нельзя выводить backend contract из frontend assumptions.

## Этап 4 — уменьшить связность App.jsx

`App.jsx` одновременно управляет auth, Telegram chrome, fullscreen, tab, overlay, sub-flow и composition. Это P1/P2 refactor, не начинать до закрытия UI-аудита.

Порядок:

1. Зафиксировать текущие transitions таблицей состояний.
2. Вынести pure navigation reducer/state machine без изменения route names.
3. Добавить unit tests на tab/overlay/sub/persona transitions.
4. Только после этого выделять composition helpers.

Не вводить новый router или URL/deep-link слой на этом этапе.

## Этап 5 — legacy и платформенные контракты

### 5.1. `habits` рядом с rituals

Сначала найти фактических потребителей и backend contract в приватном `mentalix-bot`. Не переименовывать и не удалять по frontend-интуиции.

### 5.2. Telegram/auth/security

Провести отдельный backend/frontend contract audit: initData validation, owner scoping, web identity, server-side session и sensitive actions. Это backend-dependent; публичный frontend не может закрыть его самостоятельно.

### 5.3. Deep links и URL state

Рассмотреть только после стабилизации local navigation. Сначала определить product need и допустимые privacy implications, затем поддержать только существующий `?tab=` contract.

## Этап 6 — дизайн-токены и maintenance

Закрывать только конкретные остаточные hardcoded values: QuickAdd shadow, Path illustration и error/danger color. Для каждого сначала определить canonical token. Не запускать широкий visual refactor.

## Что не брать автоматически

| Область | Причина |
|---|---|
| Payment/checkout | Отложено до evidence ценности free loop и owner decision. |
| AI therapy mode/medical claims | Требует safety review и не должен появиться через технический PR. |
| Journal cloud sync, tags, search, media | Backend/privacy/schema-dependent. |
| Новая вкладка или новый router | Нет подтверждённой необходимости; риск scope expansion. |
| Исправление отмеченного StrictMode persona issue | Канонический backlog помечает его как «не чинить». |

## Приоритет на ближайший рабочий цикл

1. Закрыть #464 и #465 по checks и ручным gates.
2. Закрыть MXL-UI-AUDIT-001 evidence.
3. Проверить Practices runtime states.
4. Взять один независимый query-layer или API-consumer slice.
5. Только после этого начинать navigation/App refactor.

## Общий Definition of Done

Каждая задача должна иметь один узкий scope, отдельную ветку и PR, целевые unit/UX проверки, описание того, что не меняется, rollback и явный manual-gate status. Merge и deploy не считать частью реализации автоматически.
