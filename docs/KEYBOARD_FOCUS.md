---
status: current
last_verified: 2026-10-13
---

# Карта полей ввода и клавиатуры (MXL-KEYBOARD-001)

**Статус:** действующий документ.
**Назначение:** единый перечень всех мест, где пользователь пишет текст, и поведения клавиатуры в каждом из них. Правило целиком — `DESIGN_SYSTEM.md` §«Клавиатура и фокус», единственная реализация — [`src/lib/useAutoFocusField.js`](../src/lib/useAutoFocusField.js).

## 1. Правило

Когда пользователь нажатием переходит на экран или шаг, основная задача которого — написать текст, основное поле получает фокус само: второго нажатия по полю не требуется. На экранах чтения, в каталогах, списках, настройках и в поиске клавиатура сама не открывается.

Контракт хука (полностью — `DESIGN_SYSTEM.md` §«Клавиатура и фокус»):

- фокус ставится только в момент активации поля (смена `activationKey`), а не на каждом рендере: курсор и выделение не сбрасываются;
- если пользователь уже пишет в другом поле, программный фокус не перехватывается;
- ручное закрытие клавиатуры (`blur`) — конец попытки: отложенные повторы (rAF и 120 мс) отменяются, поле не «забирает» фокус обратно; новый фокус возможен только при новом явном входе в шаг;
- отложенный повтор не фокусирует узел, если тот уже отключён от документа (смена шага, размонтирование);
- узел `afterFocus` вызывается только после фактической постановки фокуса.

## 2. Автофокус: карта полей

| Поверхность                      | Компонент                                               | Поле                           | `data-testid`                                                   | Ключ активации                      | Автопроверка                                                 |
| -------------------------------- | ------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| Чек-ин, утренний шаг записи      | `src/screens/CheckIn.jsx` → `JournalTextarea`           | «Что на уме?»                  | `checkin-text-input`                                            | `autoFocus` (монтажный ключ `auto`) | `keyboard-focus.spec.mjs`, сценарий 1                        |
| Чек-ин, вечерний «Разбор дня»    | `src/screens/CheckIn.jsx` → `JournalTextarea`           | вечерние вопросы шага записи   | `checkin-text-input`                                            | `autoFocus`                         | `keyboard-focus.spec.mjs`, сценарий 1                        |
| Чек-ин, превью утренней заметки  | `src/screens/CheckIn.jsx` → `JournalTextarea`           | краткая заметка                | `checkin-text-input`                                            | `autoFocus`                         | `keyboard-focus.spec.mjs`, сценарий 1                        |
| «Путь героя», шаг записи         | `src/screens/HeroJourneyMap.jsx` → `JournalTextarea`    | запись шага                    | `hero-<view>-input`                                             | `autoFocusKey={view}`               | `keyboard-focus.spec.mjs`, сценарий 2                        |
| Диалог с наставником             | `src/screens/mentalix/Conversation.jsx`                 | поле сообщения                 | `mentor-input`                                                  | persona                             | `keyboard-focus.spec.mjs`, сценарии 3 и 5                    |
| Дневник, шаг «поток»             | `src/screens/DailyJournal/DailyJournalFlow.jsx`         | «Выпиши всё из головы»         | `dj-stream-input`                                               | `stream`                            | `keyboard-focus.spec.mjs`, сценарий 4                        |
| Дневник, вопрос дня              | `src/screens/DailyJournal/DailyJournalFlow.jsx`         | ответ на вопрос дня            | `dj-question-input`                                             | `question`                          | `keyboard-focus.spec.mjs`, сценарий 4                        |
| Дневник, настройка (5 шагов)     | `src/screens/DailyJournal/DailyJournalSetup.jsx`        | первое поле шага               | `dj-setup-goal-0`, `dj-setup-vision-<key>`, `dj-setup-prompt-0` | `${stepIndex}:${visionSubStep}`     | косвенно: `typography-readable-scale.spec.mjs` проходит шаги |
| «Настроение», шаг контекста      | `src/screens/MoodPractice.jsx`                          | заметка о состоянии            | `mood-practice-note`                                            | `context`                           | —                                                            |
| Аскезы: комментарий к срыву      | `src/screens/Ascezas.jsx` → `PracticeWritingCanvas`     | «Хочешь добавить пару слов?»   | нет (aria-label)                                                | `autoFocus`                         | —                                                            |
| Практики: свои поля шага         | `src/components/practices/PracticeFieldFlow.jsx`        | поле текущего шага             | `practice-own-input-<step>`                                     | step                                | —                                                            |
| AlterEgo: имя                    | `src/screens/AlterEgo.jsx`                              | «Например, Командир»           | `alter-ego-name`                                                | `alter-ego-name`                    | —                                                            |
| AlterEgo: переписать             | `src/screens/AlterEgo.jsx` → `JournalTextarea`          | «Начни писать…»                | `alter-ego-text-input`                                          | `autoFocus`                         | —                                                            |
| Стартовый набор: правка названия | `src/components/StarterSetPicker.jsx`                   | название ритуала               | нет (без testid)                                                | `starter-set-name` (режим правки)   | —                                                            |
| Даймон: запрос                   | `src/screens/Daimon/DaimonFlow.jsx`                     | поле запроса                   | `daimon-request-input`                                          | `request`                           | —                                                            |
| Даймон: отклик на вывод          | `src/screens/Daimon/DaimonFlow.jsx`                     | «Одной фразой»                 | `daimon-insight-input`                                          | `insight` (когда задан вопрос)      | —                                                            |
| «Сегодня»: выгрузка дел          | `src/screens/TodayFocusFlow.jsx` → `JournalTextarea`    | «Дела, которые тянут внимание» | нет (aria-label)                                                | `autoFocus`                         | —                                                            |
| «Сегодня»: первый шаг            | `src/screens/TodayFocusFlow.jsx` → `JournalTextarea`    | «Первый шаг»                   | нет (aria-label)                                                | `autoFocus`                         | —                                                            |
| Мысль дня: запись                | `src/screens/DailyThoughtInput.jsx` → `JournalTextarea` | поле записи                    | `daily-thought-input-field`                                     | `autoFocus`                         | —                                                            |
| Направленный поток «Шагов»       | `src/screens/GuidedJournals.jsx` → `JournalTextarea`    | шаг записи шаблона             | нет (aria-label)                                                | `autoFocus`                         | —                                                            |

Карта фиксирует фактическое применение `useAutoFocusField` в коде. Часть поверхностей доступна только в отдельных режимах или за флагами; сама карта от этого не меняется.

## 3. Поля без автофокуса (осознанно)

Клавиатура не должна открываться сама там, где основная задача экрана — чтение, поиск или настройка:

| Поле                     | Где                                                      | Почему без автофокуса              |
| ------------------------ | -------------------------------------------------------- | ---------------------------------- |
| `history-search-input`   | «Прогресс» → поиск по истории (`HistorySearchSheet.jsx`) | поиск, а не запись                 |
| поиск по журналам        | `src/screens/JourneySearch.jsx`                          | поиск по каталогу                  |
| поиск по библиотеке      | `src/screens/Articles.jsx`                               | каталог                            |
| `profile-birthday-input` | `src/screens/Profile.jsx`                                | настройки профиля                  |
| `theme-text-input`       | `src/screens/ThemeScreen.jsx`                            | размышление по теме: фокус вручную |
| `daimon-chat-input`      | `src/screens/Daimon/DaimonFlow.jsx`                      | продолжение диалога по желанию     |
| поля демо-панели         | `src/components/DemoPanel.jsx`                           | служебные поля                     |

## 4. Автоматизированная регрессия

**Клавиатура и автофокус.** `tests/ux/keyboard-focus.spec.mjs`, конфиг `playwright.keyboard.config.mjs`, команда в web-контейнере:

```bash
npm run ux:keyboard
```

Сценарии: (1) текстовый шаг чек-ина забирает фокус, кнопка продолжения доступна, закрытие клавиатуры не возвращает фокус, текст и переход работают; (2) шаг записи курса «Путь героя»; (3) поле сообщения наставника; (4) шаги дневника «поток» и «вопрос дня», черновик в `localStorage`, доступность «Далее»; (5) регрессия отложенного повтора: закрытие клавиатуры сразу после входа в шаг отменяет повторный захват, автофокус срабатывает ровно один раз.

**Читаемая шкала.** `tests/ux/typography-readable-scale.spec.mjs`, конфиг `playwright.typography.config.mjs`:

```bash
npm run ux:typography
node scripts/typography-compare.mjs --check
```

Тест проверяет computed-размеры ролей и отсутствие горизонтального выхода на 393×852 и 360×640, снимает кадры в `qa-evidence/typography-readable/<фаза>/<вьюпорт>/` и пишет измерения `measure-<вьюпорт>.json`; сравнение «до/после» собирается в `qa-evidence/typography-readable/REPORT.md`.

**Правило evidence.** Кадр снимается только после завершения анимации входа полноэкранного слоя и при наличии уникального признака текущего экрана; пустой кадр и кадр, совпавший с другим состоянием, — ошибка прогона, а не «особенность рендера». Поэтому набор кадров фаз `before` и `after` состоит из уникальных непустых кадров, а расхождение видно в логе теста.

CI: шаги «Run read-scale typography contract gate» и «Run keyboard focus contract gate» в job «Playwright Chromium smoke».

## 5. Ручной gate: iPhone в Telegram (NOT RUN)

Реальная клавиатура Telegram/iPhone автопроверкой не покрывается: Playwright меняет высоту вьюпорта, но не поднимает системную клавиатуру. До прохождения владельцем эти пункты — **NOT RUN**, а не PASS.

- [ ] Поле шага записи получает фокус без нажатия: утренний и вечерний чек-ин, «поток» и «вопрос дня» дневника, шаг курса, наставник.
- [ ] Клавиатура открывается сразу, одним нажатием по переходу, без второго нажатия по полю.
- [ ] Закрытая пользователем клавиатура не открывается повторно сама.
- [ ] Клавиатура не закрывает поле и кнопку продолжения шага.
- [ ] Шкала читается на реальном экране: 16px основной текст и поля, 14px пояснения, 13px подписи, 24px главный вопрос и заголовки.
- [ ] Формы практик не смещаются при переходе между полями.

## 6. Известные ограничения

- Программный фокус в iOS WebView не всегда открывает клавиатуру с первого раза — поэтому хук делает повторы; на реальном устройстве это проверяется вручную (см. §5).
- `MXL-PRACTICES-KEYBOARD-POSTRELEASE-001`: на 4–5 поле формы создания ритуала/аскезы iOS WebView может визуально смещать форму. Функциональность не нарушается, поведение перенесено на пострелизный этап.
