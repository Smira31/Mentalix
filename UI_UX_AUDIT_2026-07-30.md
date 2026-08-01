# Mentalix — UI/UX audit

Дата: 30.07.2026

Репозиторий: `C:\Users\smira\Documents\Codex\2026-07-27\mentalix-product-vision-roadmap-md-tasks\work\frontend-deploy`

Baseline: `main`, HEAD `162f8ad8a17e74691c805784105b7098e144c195` — «Сделать состояние дня Today надёжным»

Статус: повторный статический аудит актуального frontend. Старый файл из OneDrive использован только как перечень пользовательских наблюдений. Его выводы, ссылки на код, counts, приоритеты и архитектурные рекомендации не переносились.

## 0. Источники и ограничения

Перед аудитом прочитаны актуальные:

- `AGENTS.md`;
- `AI_RULES.md`;
- `PRODUCT.md`;
- `DESIGN_SYSTEM.md`;
- `ARCHITECTURE.md`;
- `ROADMAP.md`;
- `TASKS.md`;
- `QA.md`.

Проверены актуальные компоненты и screens, связанные со всеми 30 наблюдениями. Приватный backend не предоставлен. Реальный iPhone и Telegram Mini App в этой сессии не запускались; device observations пользователя приняты как входные данные, а код проверен на наличие соответствующего механизма.

Этот документ не разрешает реализацию. Код приложения, Today state machine, `review_hour`, `review_completed_at`, frontend API payload и backend-контракт не изменялись.

### Итоговая классификация

- Confirmed technical bugs: **9**.
- Confirmed UI inconsistencies: **10**.
- Product/design decisions required: **9**.
- Deferred redesign: **4**.
- Developer tooling backlog: **3**.

`Confirmed` означает: актуальный код содержит конкретный механизм, согласующийся с наблюдаемым поведением. Для fixed/keyboard/fullscreen проблем окончательная верификация всё равно выполняется на реальном iPhone в Telegram согласно `QA.md`.

## 1. Реестр всех пользовательских наблюдений

| № | Пользовательское наблюдение | Повторный результат |
|---:|---|---|
| 1 | Bottom Navigation виден и перекрывает CheckIn/evening review, включая финалы | Подтверждено: T01 |
| 2 | iPhone keyboard перекрывает поля и CTA CheckIn; нужен visualViewport | Подтверждено: T02, T07 |
| 3 | Theme Week имеет тот же keyboard/navbar конфликт | Подтверждено: T01, T03, T07 |
| 4 | Fullscreen practices требуют понятного выхода и решения по navbar | Частично подтверждено: T01, T06; политика — P02 |
| 5 | AI Conversation back не возвращает к picker | Подтверждено: T05 |
| 6 | Нужен общий FullscreenLayout/FlowLayout | Подтверждена фрагментация; архитектурный объём — P02 |
| 7 | Верхние композиции расходятся относительно Telegram controls | Подтверждено: T04, U01, P09 |
| 8 | Today визуально начинается слишком низко | Подтверждена кодовая композиция: U02; device measurement обязателен |
| 9 | В CheckIn слишком большая зона между header и вопросом; финал требует scroll | Подтверждено: U03 |
| 10 | Profile title нужно проверить/центрировать | Расхождение подтверждено: U04; точный канон — P09 |
| 11 | Settings title привязан к back, желателен centered header | Подтверждено: U04; решение — P09 |
| 12 | Practices допускает горизонтальный сдвиг | Конкретный offender статически не подтверждён: V02 |
| 13 | Между вкладками ощущается разный scale; возможен iOS input zoom | Подтверждено: T07, T08, U08 |
| 14 | Bottom Navigation остаётся тёмным в light theme | Подтверждено: U05 |
| 15 | Hero «Разобрать день?» показывает разные иллюстрации | Подтверждено на новом state machine: U06 |
| 16 | Hero различается по размеру/padding/composition | Подтвержден частичный contract: U07 |
| 17 | Quick Add висит отдельно и не связан с safe area/navbar | Подтверждено: T09 |
| 18 | Time-based greeting Today не нравится | Текущее поведение подтверждено; смена текста — P01 |
| 19 | Нейротренажёр/Дыхание/Фокус/Медитации предлагается временно закрыть | Текущая неоднородность подтверждена; gating — P03 |
| 20 | «Курсы» переименовать/закрыть; будущая модель «Пути» | Текущий активный раздел подтверждён; решение — P04 |
| 21 | Нужны `/dev-reset`, `/dev-onboarding`, `/dev-demo`, state panel | Отсутствуют: V01 |
| 22 | Empty state «Ритуалов пока нет» визуально пуст | Существование подтверждено; вариант дизайна — P05 |
| 23 | Article cards нужны с cover/metadata/CTA и reader | Текущая структура подтверждена: U09; schema/source — P06 |
| 24 | AI picker cards должны быть крупнее, header — центрирован | Текущее расхождение подтверждено: U10 |
| 25 | Гипотеза fullscreen AI cards с horizontal swipe | Не реализация: P07, D01 |
| 26 | Conversation нравится; нужен аккуратный header и speech-to-text backlog | Back bug T05; speech-to-text — P08 |
| 27 | Analytics нужен смысловой redesign, не cosmetic patch | Deferred: D02 |
| 28 | Profile нужен будущий «Мой путь», не точечный patch | Deferred: D03 |
| 29 | Onboarding нужно пересобрать по смыслу | Deferred: D04; safe token дополнительно затронут T04 |
| 30 | Возможна утечка Telegram/system accent, особенно «Далее» | Конкретный purple control не подтверждён; token bypass частично подтверждён: V03 |

## 2. Confirmed technical bug

### MXL-UX-T01 — Shell не скрывает Bottom Navigation во вложенных flow

- **Экран/сценарий:** Today → CheckIn/evening review; Today/Library → Theme Week; Practices → активный fullscreen stage.
- **Проблема:** navbar остаётся отрендеренным и может перекрывать flow, textarea, CTA и финал.
- **Ожидаемое поведение:** для CheckIn и Theme Week navbar скрыт от входа до возврата в parent screen; для practices действует утверждённая политика P02.
- **Актуальные компоненты/файлы:** `src/App.jsx`, `src/screens/Today.jsx`, `src/screens/Practices.jsx`, `src/screens/CheckIn.jsx`, `src/screens/ThemeScreen.jsx`, `src/components/BottomNavigation.jsx`.
- **Актуальная причина:** `App.jsx` скрывает navbar только при `tab === 'mentor' && mentorPersonaOpen`. Локальный `Today.sub` и `Practices.sub` не сообщаются shell. Content wrapper использует `animate-fade-in` с `transform`, создавая stacking context; локальный `z-[60]` fixed-screen не является надёжным глобальным escape над sibling navbar `z-50`.
- **Риск:** средний; ошибочный lifecycle может не вернуть navbar или вернуть его раньше.
- **Зависимости:** P02; не менять Today state machine и API.
- **Приоритет:** P0.
- **Batch:** A1 navigation correctness.
- **Acceptance:** на реальном iPhone пройти CheckIn, evening review и Theme Week из обоих entry points; navbar нигде внутри flow не виден, CTA не перекрыта, после единственного back/finish navbar возвращается без reload и без потери parent state.

### MXL-UX-T02 — CheckIn не учитывает visualViewport клавиатуры

- **Экран/сценарий:** CheckIn/evening review → note, три lesson textarea, три proud inputs.
- **Проблема:** focused field и CTA могут уйти под iOS keyboard; центральная композиция не гарантирует видимость.
- **Ожидаемое поведение:** высота/offset flow синхронизированы с `window.visualViewport`; один определённый scroll-region держит focused control и CTA доступными.
- **Актуальные компоненты/файлы:** `src/screens/CheckIn.jsx`; потенциальный небольшой общий viewport hook после согласования.
- **Актуальная причина:** CheckIn — `fixed inset-0 overflow-y-auto`; шаги используют `flex-1 ... justify-center`; отсутствуют visualViewport listeners, keyboard inset и focus scroll policy.
- **Риск:** высокий: двойной scroll, скачки при закрытии клавиатуры, конфликт Telegram viewport.
- **Зависимости:** T01, T04, T07; проверять frontend payload неизменным.
- **Приоритет:** P0.
- **Batch:** A2 keyboard and visualViewport.
- **Acceptance:** каждое поле проверено на минимальном поддерживаемом iPhone; caret, control и CTA видны; scroll только вертикальный; keyboard open/close не оставляет пустую область; сохранение и `review_completed_at` работают как до layout-изменения.

### MXL-UX-T03 — Theme Week не имеет keyboard-aware layout

- **Экран/сценарий:** Theme Week → reflection textarea → save; вход из Today и Courses.
- **Проблема:** keyboard сокращает viewport, но screen остаётся обычным document flow с `pb-40`; CTA может исчезнуть, header/карточка столкнуться с controls.
- **Ожидаемое поведение:** тот же проверенный viewport contract, что у CheckIn, без отдельного ad hoc fix.
- **Актуальные компоненты/файлы:** `src/screens/ThemeScreen.jsx`, `src/screens/Today.jsx`, `src/screens/Courses.jsx`.
- **Актуальная причина:** нет `visualViewport`, focus handling и shell flow state; textarea/CTA расположены после content card.
- **Риск:** высокий.
- **Зависимости:** T01, T07; два parent entry points.
- **Приоритет:** P0.
- **Batch:** A2.
- **Acceptance:** открыть Theme Week из Today и Library; проверить пустой/длинный ответ, все доступные дни, keyboard open/close; header и CTA остаются доступны, navbar скрыт до back.

### MXL-UX-T04 — CheckIn и Onboarding используют отсутствующий `--tg-top`

- **Экран/сценарий:** все CheckIn steps/finals; onboarding.
- **Проблема:** top padding фактически получает fallback `0px`, хотя канонический safe token существует.
- **Ожидаемое поведение:** fullscreen surfaces используют `--app-safe-top/right/bottom/left` ровно один раз.
- **Актуальные компоненты/файлы:** `src/screens/CheckIn.jsx`; позже отдельно `src/screens/Onboarding.jsx`; `src/index.css`, `src/lib/tgFullscreen.js` как source of truth.
- **Актуальная причина:** screens запрашивают `var(--tg-top, 0px)`, но код создаёт `--tg-safe-area-*`, `--tg-content-safe-area-*` и агрегированные `--app-safe-*`; `--tg-top` нигде не определяется.
- **Риск:** средний; при fix можно случайно удвоить shell padding.
- **Зависимости:** T01/A2; onboarding fix не смешивать с redesign D04.
- **Приоритет:** P0 для CheckIn, P2 для точечного onboarding safe-area fix.
- **Batch:** A2 для CheckIn; B для onboarding только как технический patch.
- **Acceptance:** fullscreen и expanded fallback; back/progress/close находятся ниже Telegram controls с постоянным safe gap; left/right/bottom insets корректны; web не получает лишний отступ.

### MXL-UX-T05 — AI Conversation back вызывает new-conversation state вместо picker back

- **Экран/сценарий:** Собеседник, Наставник, Следопыт → верхняя стрелка.
- **Проблема:** у `mayak`/`kompas` tap визуально ничего не меняет; у `dnevnik` открывается JournalStart вместо picker.
- **Ожидаемое поведение:** один tap возвращает к PersonaPicker; история не удаляется; navbar восстанавливается.
- **Актуальные компоненты/файлы:** `src/screens/Mentalix.jsx`, `src/screens/mentalix/Conversation.jsx`.
- **Актуальная причина:** `Conversation` получает только `onNewConversation` и вызывает его у стрелки; parent делает `setJournalOpen(true)`. Реальный `Chat.onBack` существует, но в `Conversation` не передан.
- **Риск:** низкий.
- **Зависимости:** сохранить раздельные histories, draft и journal start Следопыта.
- **Приоритет:** P0.
- **Batch:** A1.
- **Acceptance:** для всех трёх personas: picker → persona → один back → picker; navbar появляется; повторный вход восстанавливает историю; draft не очищается/не отправляется неожиданно.

### MXL-UX-T06 — В активных BrainTrainer games нет cancel/back

- **Экран/сценарий:** Practices → Нейротренажёр → любая из пяти игр.
- **Проблема:** hub имеет back, но при `active` заменяется game component, которому передан только `onFinish`.
- **Ожидаемое поведение:** явный exit возвращает в BrainTrainer hub без записи незавершённого результата; следующий back возвращает в Practices.
- **Актуальные компоненты/файлы:** `src/screens/BrainTrainer.jsx`, `src/screens/Practices.jsx`.
- **Актуальная причина:** `AttentionGame`, `MemoryGame`, `ReactionGame`, `PlasticityGame`, `GymnasticsGame` получают только `onFinish`; cancel transition отсутствует.
- **Риск:** средний: нельзя случайно вызвать `api.brain.logSession`.
- **Зависимости:** P02; backend не менять.
- **Приоритет:** P0.
- **Batch:** A1.
- **Acceptance:** exit доступен до окончания каждой игры, не закрывает Mini App, не логирует session, возвращает в hub; completed result продолжает логироваться как раньше.

### MXL-UX-T07 — 15 px form controls создают риск iOS input zoom

- **Экран/сценарий:** CheckIn note/lessons/proud; Theme Week reflection.
- **Проблема:** focus может непреднамеренно увеличить visual scale и усилить ощущение разного масштаба вкладок.
- **Ожидаемое поведение:** computed font-size form controls не менее 16 px либо иной локально доказанный iOS-safe приём без запрета accessibility zoom.
- **Актуальные компоненты/файлы:** `src/screens/CheckIn.jsx`, `src/screens/ThemeScreen.jsx`.
- **Актуальная причина:** controls явно используют `text-[15px]`; viewport meta разрешает zoom.
- **Риск:** низкий/средний: переносы, высота cards, CTA position.
- **Зависимости:** T02/T03.
- **Приоритет:** P0.
- **Batch:** A2.
- **Acceptance:** focus каждого control не меняет scale; текст и placeholder не обрезаются; keyboard flow и доступный user zoom проверены отдельно.

### MXL-UX-T08 — Telegram mode глобально блокирует zoom gestures

- **Экран/сценарий:** всё приложение в Telegram.
- **Проблема:** document-level handlers предотвращают pinch, multi-touch и double-tap.
- **Ожидаемое поведение:** input zoom исправляется локально; accessibility zoom не блокируется без отдельного подтверждённого platform requirement.
- **Актуальные компоненты/файлы:** `src/App.jsx`, form controls.
- **Актуальная причина:** non-passive `gesturestart/change/end`, `touchstart/move/end` listeners вызывают `preventDefault()`.
- **Риск:** средний; Telegram WebView quirks.
- **Зависимости:** сначала T07 и device test, затем отдельный diff; не смешивать с A2.
- **Приоритет:** P1.
- **Batch:** B.
- **Acceptance:** input focus не масштабирует UI; vertical gestures/controls работают; разрешённый платформой accessibility zoom не подавляется приложением; double tap CTA не создаёт accidental scale.

### MXL-UX-T09 — Quick Add использует отдельную safe-area модель и magic offsets

- **Экран/сценарий:** Today → Quick Add open/closed, navbar expanded/collapsed.
- **Проблема:** кнопка и actions позиционируются независимо от Telegram insets и фактической геометрии navbar.
- **Ожидаемое поведение:** позиция опирается на `--app-safe-bottom` и явный navbar/overlay contract.
- **Актуальные компоненты/файлы:** `src/components/QuickAdd.jsx`, `src/components/BottomNavigation.jsx`, `src/App.jsx`.
- **Актуальная причина:** Quick Add использует `env(safe-area-inset-bottom) + 88px/152px`; navbar — `--app-safe-bottom + 12px`.
- **Риск:** средний: overlay stacking, collapsed nav, small viewport.
- **Зависимости:** не смешивать с keyboard/theme.
- **Приоритет:** P1.
- **Batch:** B.
- **Acceptance:** fullscreen/expanded, portrait, nav expanded/collapsed; FAB и action stack не перекрывают navbar/content, backdrop и back закрывают overlay, все actions возвращают корректный parent state.

## 3. Confirmed UI inconsistency

### MXL-UX-U01 — Нет единого screen-header baseline

- **Экран/сценарий:** Today, Profile, Settings, AI picker, CheckIn, Theme Week, Practices.
- **Проблема:** safe gap и content start собираются разными `pt/mt`, а ownership header распределён между App и screens.
- **Ожидаемое поведение:** документированный baseline: Telegram controls → `--app-safe-top` → safe gap → header → content.
- **Актуальные файлы:** `src/App.jsx` и перечисленные screens.
- **Причина:** shell добавляет `--app-safe-top + 56px` только в fullscreen, screens добавляют собственные `pt-1/2/4/5`, `mt-4` или ничего.
- **Риск/зависимости:** высокий при глобальном сдвиге; сначала P09 и device measurements.
- **Приоритет/Batch:** P1, B.
- **Acceptance:** screenshot matrix одинаковой ширины; утверждённый header baseline выдержан, Telegram/web не получают лишний inset.

### MXL-UX-U02 — Today first viewport перегружен вертикальными резервами

- **Экран/сценарий:** cold open Today и возврат из flow.
- **Проблема:** greeting/tagline/WeekStrip/hero воспринимаются слишком низко; пользователь вручную прокручивал к более плотной позиции.
- **Ожидаемое поведение:** стабильная композиция при scrollY=0 без ручной коррекции.
- **Актуальные файлы:** `src/App.jsx`, `src/screens/Today.jsx`.
- **Причина:** fullscreen shell резервирует `safe top + 56px`, Today header добавляет `pt-4`, затем WeekStrip и hero `min-h-[54vh]`.
- **Риск/зависимости:** средний; U01, не менять `todayState`.
- **Приоритет/Batch:** P1, B.
- **Acceptance:** cold/return screenshots на малом и большом iPhone; header/WeekStrip/hero начинаются в утверждённой позиции без jump.

### MXL-UX-U03 — CheckIn header и centered content не образуют одну сетку

- **Экран/сценарий:** промежуточные и финальные steps.
- **Проблема:** между header row и вопросом возникает большая свободная зона; финал зависит от доступной высоты.
- **Ожидаемое поведение:** стабильный header, предсказуемый content start, visible primary action.
- **Актуальные файлы:** `src/screens/CheckIn.jsx`.
- **Причина:** header — отдельный `pt-5`; каждый step — `flex-1 justify-center py-8`; финал снова отдельный fullscreen `justify-center`.
- **Риск/зависимости:** средний; после A2 stabilization.
- **Приоритет/Batch:** P1, B.
- **Acceptance:** все steps и финалы при keyboard open/closed; header не двигается, question начинается выше, action не требует ручного scroll.

### MXL-UX-U04 — Profile и Settings имеют разные title alignment contracts

- **Экран/сценарий:** Today → Profile → Settings.
- **Проблема:** Profile title центрирован между двумя 40 px controls; Settings title расположен рядом с back.
- **Ожидаемое поведение:** один утверждённый header variant или явно документированные variants.
- **Актуальные файлы:** `src/App.jsx`, `src/screens/Settings.jsx`.
- **Причина:** Profile header живёт в App (`justify-between`), Settings создаёт собственный `flex gap-2`.
- **Риск/зависимости:** низкий; P09.
- **Приоритет/Batch:** P1, B.
- **Acceptance:** optical center проверен при разных side actions и длинном title; back target неизменен.

### MXL-UX-U05 — Bottom Navigation не следует light-theme tokens

- **Экран/сценарий:** пять вкладок в light/auto theme, expanded/collapsed nav.
- **Проблема:** navbar остаётся почти чёрным.
- **Ожидаемое поведение:** surface/border/active/inactive используют фактические tokens обеих тем.
- **Актуальные файлы:** `src/components/BottomNavigation.jsx`, при необходимости `src/index.css`.
- **Причина:** hardcoded `rgba(36/58,...)` и белые borders; расхождение прямо зафиксировано в актуальном `DESIGN_SYSTEM.md`.
- **Риск/зависимости:** низкий/средний; финальную light palette не нужно изобретать.
- **Приоритет/Batch:** P1, C.
- **Acceptance:** light/dark/auto × expanded/collapsed × все active tabs; contrast и blur читаемы, переключение не мерцает.

### MXL-UX-U06 — Один `reviewPending` hero получает art по `isEmpty`, а не по state

- **Экран/сценарий:** Today после `review_hour`, `review_completed_at` отсутствует, на empty и non-empty accounts.
- **Проблема:** одинаковый текст «Разобрать день?» показывает `ArtThread` либо `MazeLogo`.
- **Ожидаемое поведение:** canonical art определяется `todayState`; выбор канона требует design approval.
- **Актуальные файлы:** `src/screens/Today.jsx`, `src/components/Art.jsx`, `src/components/MazeLogo.jsx`.
- **Причина:** artwork branch выполняется по `isEmpty` до content branch по `todayState`.
- **Риск/зависимости:** низкий технически; не менять `todayState`/`review_completed_at`.
- **Приоритет/Batch:** P1, C.
- **Acceptance:** один `reviewPending` state на empty/non-empty fixtures имеет одинаковый утверждённый art; прочие states сохраняют mapping.

| Актуальный `todayState` | `isEmpty` | Текущий art | Текущий текст |
|---|---:|---|---|
| `checkinPending` | true | `ArtThread` | «Как ты?» |
| `checkinPending` | false | `MazeLogo` | «Как ты?» |
| `reviewPending` | true | `ArtThread` | «Разобрать день?» |
| `reviewPending` | false | `MazeLogo` | «Разобрать день?» |
| `dayInProgress` / `dayClosed` | true/false | зависит от `isEmpty` | state-specific copy |

### MXL-UX-U07 — Hero contract существует только как общий wrapper

- **Экран/сценарий:** все четыре актуальных Today states.
- **Проблема:** base card общая, но art sizes `150/168`, content blocks и CTA occupancy не формализованы по states.
- **Ожидаемое поведение:** единая base grid; меняются art/copy/action slots.
- **Актуальные файлы:** `src/screens/Today.jsx`.
- **Причина:** один большой conditional JSX без явного state → presentation mapping.
- **Риск/зависимости:** средний; U06; не превращать в state-machine refactor.
- **Приоритет/Batch:** P1, C.
- **Acceptance:** screenshot matrix `checkinPending/dayInProgress/reviewPending/dayClosed` × empty/non-empty; geometry стабильна, long copy не обрезается.

### MXL-UX-U08 — Page wrappers создают неодинаковую визуальную шкалу вкладок

- **Экран/сценарий:** Today, Practices, Library, Trends, AI picker/Profile.
- **Проблема:** контент ощущается разного масштаба.
- **Ожидаемое поведение:** согласованная mobile content grid при сохранении допустимых screen variants.
- **Актуальные файлы:** `src/screens/Today.jsx`, `Practices.jsx`, `Library.jsx`, `Analytics.jsx`, `mentalix/PersonaPicker.jsx`, `Profile.jsx`.
- **Причина:** смешаны `max-w-md/max-w-sm`, `px-4/5/6/14px`, titles `18–34px`; iOS input zoom T07 усиливает эффект.
- **Риск/зависимости:** высокий при массовой нормализации; сначала измерить, не делать global rewrite.
- **Приоритет/Batch:** P1 investigation, B.
- **Acceptance:** viewport screenshots до/после без input focus; утверждена grid matrix, horizontal scroll отсутствует, intentional variants документированы.

### MXL-UX-U09 — Article card не содержит желаемые cover и явный CTA

- **Экран/сценарий:** Library → Articles → Reader.
- **Проблема:** card имеет title/excerpt/time/date/tag/chevron, но нет cover и текстового affordance.
- **Ожидаемое поведение:** после P06 — Mentalix-native cover, metadata и ясный open action поверх существующего reader.
- **Актуальные файлы:** `src/screens/Articles.jsx`, `src/data/articles.js`, будущие assets.
- **Причина:** текущая local schema не содержит cover/category отдельно; вся card является button.
- **Риск/зависимости:** средний; P06/MXL-022.
- **Приоритет/Batch:** P2, E.
- **Acceptance:** long title/tag, missing cover fallback, tap/CTA open reader, back restores list/scroll; `/api/articles` не подключён без решения.

### MXL-UX-U10 — AI picker остаётся узким списком utility-cards

- **Экран/сценарий:** вкладка «Наставник» до выбора persona.
- **Проблема:** cards узкие/вертикальные, header left-aligned; не воспринимаются как крупные persona scenes.
- **Ожидаемое поведение:** только prototype после P07; понравившийся Conversation не redesign.
- **Актуальные файлы:** `src/screens/mentalix/PersonaPicker.jsx`, `src/screens/mentalix/personas.js`, persona art.
- **Причина:** `max-w-sm px-6`, `space-y-3`, cards `p-4`, header left.
- **Риск/зависимости:** высокий; gesture/accessibility/history previews.
- **Приоритет/Batch:** P2, F.
- **Acceptance:** prototype проверяет three personas, history/no-history, long copy, one-hand selection; Conversation и histories не меняются.

## 4. Product/design decision required

### MXL-UX-P01 — Нейтральное greeting Today

- **Текущее:** `App.jsx` имеет четыре time-based greeting и четыре tagline branches.
- **Решение:** утвердить «Привет, Имя.» / «Привет.» и отдельно судьбу tagline.
- **Риск/зависимости:** низкий technical, продуктовый tone; copy-only batch.
- **Acceptance:** четыре времени, имя/нет имени/невалидное имя, одна строка и корректная пунктуация.

### MXL-UX-P02 — Политика FlowLayout и navbar для practices

- **Текущее:** CheckIn, Theme, Conversation, BrainTrainer/Breathing/Focus по-разному решают fixed/scroll/safe-area/back; shell видит только AI persona.
- **Решение:** утвердить минимальный contract: safe area, header, scroll owner, keyboard mode, footer CTA, back target, navbar hidden/inherited. Отдельно решить, скрывать ли navbar в каждой practice.
- **Риск/зависимости:** высокий; не вводить router/state manager и не делать big-bang migration.
- **Acceptance:** matrix fullscreen/expanded, keyboard, back, CTA, vertical-only scroll на 320–430 px.

Рекомендуемая форма контракта, не обязательная реализация:

```text
FlowLayout
  safeArea = app
  header = { back, title, close, progress }
  navigation = hidden | inherited
  scroll = content | page
  keyboard = none | form | composer
  footer = optional CTA
  onBack = explicit parent transition
```

### MXL-UX-P03 — Coming-soon allowlist practices

- **Текущее:** Neuro/Breathing/Focus открывают функционал; Meditation только haptic; Rituals/Askesis активны.
- **Решение:** после E2E readiness определить, какие cards временно disabled/«Скоро». Наличие кода не доказывает готовность.
- **Риск/зависимости:** средний; отключение существующей поверхности.
- **Acceptance:** disabled semantics/a11y, card остаётся в grid, функция не удалена; Rituals/Askesis без регрессии.

### MXL-UX-P04 — Название и gating «Курсов»

- **Текущее:** active tab «Курсы» загружает, создаёт, удаляет и обновляет backend courses; Theme Week также открывается здесь.
- **Решение:** название («Пути» — гипотеза), временный gating и будущая модель `Путь → Блок → Неделя → День → Практика`.
- **Риск/зависимости:** высокий; нужны приватные backend schemas и data migration strategy.
- **Acceptance:** unfinished content не выглядит готовым; данные не удаляются; labels/back согласованы.

### MXL-UX-P05 — Canonical EmptyState

- **Текущее:** Rituals, Analytics, Path, Articles и Courses имеют разные empty layouts.
- **Решение:** compact card, same-size + useful block или editorial borderless state.
- **Риск/зависимости:** средний; сначала инвентаризация и prototype.
- **Acceptance:** 0/1/many data, понятный next action, без случайной массовой замены других states.

### MXL-UX-P06 — Article cover schema и publication source

- **Текущее:** `src/data/articles.js` — local source; reader работает; актуальный `TASKS.md` сохраняет MXL-022.
- **Решение:** cover/category/CTA schema отдельно от local-vs-backend publication architecture.
- **Риск/зависимости:** средний/высокий; не подключать `/api/articles` автоматически.
- **Acceptance:** local article/fallback/error-safe reader; approved source only.

### MXL-UX-P07 — AI picker prototype direction

- **Текущее:** vertical cards; fullscreen horizontal swipe — только гипотеза.
- **Решение:** prototype до production; проверить конфликт с Telegram/iOS back gestures.
- **Риск/зависимости:** высокий; accessibility, reduced motion, non-swipe alternative.
- **Acceptance:** swipe + tap alternative, persona indicator, no accidental close, previews remain readable.

### MXL-UX-P08 — Speech-to-text

- **Текущее:** composer Plus button haptic-only; speech feature отсутствует.
- **Решение:** отдельный functional scope с permissions, privacy, RU transcription, cancel/fallback.
- **Риск/зависимости:** высокий; platform/API support и, возможно, backend неизвестны.
- **Acceptance:** allow/deny, start/stop/cancel, draft preservation, no auto-send, keyboard coexistence.

### MXL-UX-P09 — Header optical-centering rule

- **Текущее:** Profile geometric balance, Settings inline-left, AI picker left, fullscreen headers custom.
- **Решение:** viewport center или center свободной области; допустимые variants.
- **Риск/зависимости:** средний; U01/U04.
- **Acceptance:** 0/1/2 side actions, long title, Telegram controls, VoiceOver labels.

## 5. Deferred redesign

### MXL-UX-D01 — AI picker fullscreen/swipe redesign

- **Scope:** research/prototype only after P07.
- **Файлы:** `PersonaPicker.jsx`, persona art.
- **Риск:** высокий; не включать в A1/A2.
- **Acceptance:** отдельный approved prototype.

### MXL-UX-D02 — Analytics как система смысловых выводов

- **Scope:** personal insights, patterns, dynamics, Pathfinder conclusions; charts secondary.
- **Файлы:** `src/screens/Analytics.jsx`, будущие approved data contracts.
- **Риск:** очень высокий; малая выборка/backend semantics.
- **Acceptance:** отдельная product/design spec; текущий functional screen не cosmetic-patch.

### MXL-UX-D03 — Profile «Мой путь»

- **Scope:** narrative history/progress/next milestones вместо точечного redesign stat cards.
- **Файлы:** `src/screens/Profile.jsx`, `Achievements.jsx`, Path/History.
- **Риск:** высокий; зависит от главной метрики Пути.
- **Acceptance:** отдельный design stage, не ближайший bugfix.

### MXL-UX-D04 — Onboarding content redesign

- **Scope:** value proposition первого экрана, причина возврата завтра, cards/final; не смешивать с точечным safe-area fix T04.
- **Файлы:** `src/screens/Onboarding.jsx`, settings persistence.
- **Риск:** высокий; activation, age/legal, notification promise.
- **Acceptance:** clean-storage flow, back/skip, age variants, save failure, final CTA, next-day proposition.

## 6. Developer tooling backlog

### MXL-UX-V01 — Dev reset/demo/state controls

- **Наблюдение:** `/dev-reset`, `/dev-onboarding`, `/dev-demo` и Today/loading/error/empty panel отсутствуют.
- **Актуальные файлы:** новых dev-only modules пока нет; backend scope неизвестен.
- **Риск/зависимости:** высокий при production exposure или reset неверного user; нужны environment/auth guards и приватный backend review.
- **Приоритет/Batch:** P3, отдельный tooling batch.
- **Acceptance:** dev-only; production not found; confirmation; только текущий test user; без production data mutation.

### MXL-UX-V02 — Runtime overflow diagnostics

- **Наблюдение:** Practices horizontal shift подтверждён пользователем, но актуальный static scan не выявил overwide child в grid: cards `w-full`, SVG constrained by wrapper/viewBox.
- **Подозреваемые места:** viewport-based BottomNavigation width, runtime Telegram side insets, `body min-width:320px`; это гипотезы, не root cause.
- **Риск/зависимости:** нельзя маскировать `overflow-x:hidden`.
- **Приоритет/Batch:** P1 diagnostic before B.
- **Acceptance:** на реальном iPhone зафиксировать `innerWidth`, root `scrollWidth` и точный element с right edge за viewport.

### MXL-UX-V03 — System accent/token-leak inspection

- **Наблюдение:** конкретный purple «Далее» актуальным JSX не подтверждается: onboarding «Далее» получает Mentalix classes.
- **Подтверждённое рядом:** BottomNavigation hardcodes; Analytics и ErrorBoundary содержат legacy hex/rgba; SVG art содержит прямые palette values.
- **Риск/зависимости:** массовая замена сломает семантику games/charts/art.
- **Приоритет/Batch:** inspection в C; Analytics остаётся D02.
- **Acceptance:** Web Inspector на устройстве показывает computed color и winning CSS rule конкретного purple control; исправляется только доказанный owner.

## 7. Общие root causes

### RC-1 — Shell не получает nested-flow state

Объединяет T01 и часть T05/T06. `App.jsx` знает `tab`, `overlay`, входной `practicesSub` и специальный `mentorPersonaOpen`, но не знает текущий `Today.sub`/локальный `Practices.sub`. Это достаточное основание для небольшого A1 contract, но не для нового router.

### RC-2 — Несколько viewport/safe-area моделей

Объединяет T02–T04, T07–T09:

- shell и navbar используют `--app-safe-*`;
- CheckIn/Onboarding используют отсутствующий `--tg-top`;
- ThemeScreen — document flow;
- Conversation отдельно реализует `visualViewport`;
- Quick Add/Breathing используют `env(safe-area-inset-bottom)`;
- BottomNavigation использует `100vw` и свои offsets.

### RC-3 — Header и hero presentation собираются вручную

Объединяет U01–U04, U06–U08, U10. Основание есть для правил и малых primitives, но не для миграции всех screens одним PR.

### RC-4 — Theme layer обходится локальными hardcodes

Объединяет U05 и V03. Исправлять только по подтверждённым owners; Analytics redesign не включать.

## 8. Что нельзя объединять

- Keyboard/visualViewport fixes — с theme changes.
- Навигационные bugs — с AI picker redesign.
- Feature gating — с удалением functions, screens или API.
- P0 fixes — с Analytics/Profile/Onboarding redesign.
- A1 — с Today state machine, `review_hour`, `review_completed_at` или check-in API payload.
- Article cards — с неутверждённым `/api/articles`.
- Overflow fix — с global `overflow-x:hidden` до нахождения offender.
- Accessibility zoom change — с A2 до стабилизации 15 px inputs и device test.
- Общий layout primitive — с большим рефакторингом `App.jsx` или внедрением router/state manager.

## 9. Безопасные implementation batches

### A1 — Navigation correctness

- shell-level visibility для CheckIn/Theme и утверждённых fullscreen practices;
- AI Conversation back → PersonaPicker;
- cancel/back для пяти active BrainTrainer games;
- без изменения Today/backend semantics.

### A2 — Keyboard and visualViewport

- один небольшой проверенный viewport primitive;
- CheckIn + Theme Week;
- form controls ≥16 px;
- `--app-safe-*`;
- iPhone Telegram acceptance.

### B — Safe areas, headers and overflow

- runtime overflow offender;
- Today/header baseline;
- Profile/Settings alignment после P09;
- Quick Add placement;
- onboarding safe token отдельно от redesign;
- accessibility zoom guard отдельным reviewable diff.

### C — Theme consistency

- BottomNavigation через фактические tokens;
- Today state → canonical art mapping после approval;
- доказанные system accent owners;
- без Analytics redesign.

### D — Coming-soon gating

- approved practice allowlist;
- Library gating;
- cards остаются, code/data не удаляются.

### E — Library cards

- approved cover schema;
- Mentalix-native cards;
- существующий reader;
- publication source не меняется без P06.

### F — AI picker prototype

- крупные cards/fullscreen/swipe hypothesis;
- production Conversation не меняется.

### G — Deferred redesign research

- Analytics;
- Profile;
- Onboarding;
- Library hierarchy;
- EmptyState system.

## 10. Самый маленький первый batch с максимальной пользой

Рекомендуется **A1 — navigation correctness**, в минимальном составе:

1. дать `Today` и `Practices` явный callback текущего nested flow только для navbar visibility;
2. скрывать navbar во всём CheckIn/Theme flow и в подтверждённых fullscreen practice stages;
3. передать реальный `onBack` в `Conversation`;
4. добавить локальный cancel в пять BrainTrainer games без вызова log API;
5. не создавать router/общий state manager/большой FlowLayout в A1.

Реальные вероятные файлы A1:

- `src/App.jsx`;
- `src/screens/Today.jsx`;
- `src/screens/Practices.jsx`;
- `src/screens/Mentalix.jsx`;
- `src/screens/mentalix/Conversation.jsx`;
- `src/screens/BrainTrainer.jsx`.

Что точно не меняется:

- `src/lib/api.js`;
- `todayState` и его четыре значения;
- `review_hour`;
- `review_completed_at`;
- `review_completed` payload;
- persona identities/history;
- theme tokens;
- backend.

Риск A1: потеря восстановления navbar или неверный parent target. Rollback полностью frontend-only: удалить callback props/cancel handlers и вернуть прежние transitions; data migration отсутствует.

## 11. Разница со старым аудитом

### Подтвердилось

- shell скрывает navbar только для AI persona, не для Today/Practices nested state;
- CheckIn/Theme не имеют общего keyboard-aware layout;
- `--tg-top` не существует;
- AI back подключён к `onNewConversation`;
- active BrainTrainer games не имеют cancel;
- 15 px controls, global zoom prevention, Quick Add safe-area mismatch;
- hardcoded dark BottomNavigation;
- header/wrapper/hero inconsistencies;
- product decisions и deferred redesign действительно нельзя смешивать с P0.

### Изменилось

- актуальный Today имеет явный `todayState`: `checkinPending`, `dayInProgress`, `reviewPending`, `dayClosed`;
- вечернее завершение определяется `review_completed_at`;
- CheckIn отправляет `review_completed: true` и проверяет ответ backend;
- hero mapping нужно анализировать по новому state machine, а не по прежнему `lessons/wins`;
- актуальные `AGENTS.md` и `QA.md` теперь существуют;
- `TASKS.md` фиксирует baseline iPhone smoke как пройденный, но детальные пользовательские observations всё равно требуют отдельной device acceptance.

### Оказалось неверным или недоказанным в старом checkout

- неверно было утверждение, что `review_completed_at` во frontend не найдено;
- устарел критерий «вечер завершён, если есть lessons или wins»;
- конкретный root cause Practices horizontal overflow не был найден и всё ещё не должен объявляться без runtime offender;
- конкретная purple/system окраска кнопки «Далее» кодом не подтверждена;
- старый документ не мог учитывать обязательные правила актуальных `AGENTS.md` и `QA.md`;
- старые counts не являются результатом текущего аудита.

## 12. Acceptance gate для будущей реализации

- `npm run build`;
- `git diff --check`;
- web smoke затронутого flow;
- Telegram fullscreen и expanded fallback;
- реальный iPhone: safe areas, keyboard, focus, vertical scroll, back/navbar restore;
- loading/error/empty/success, где применимо;
- light/dark/auto только для theme batch;
- подтверждение неизменности `todayState`, `review_hour`, `review_completed_at`, API payload и backend contract;
- результат фиксируется по формату `QA.md`: verified / not verified / blocked.

