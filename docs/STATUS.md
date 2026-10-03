# Mentalix — короткий статус

Сверено 27.09.2026 с `main` `767a3b55` (merged PR #904) и GitHub Issues. Это указатель, **не параллельный backlog**: актуальные задачи и их gates — в [`TASK_INDEX.md`](TASK_INDEX.md), release-факты — в [`PROJECT_STATE.md`](../PROJECT_STATE.md).

Web/PWA уже имеет server-backed guest (#847), bearer session (#861), автоматический гостевой вход (#863) и напоминание сохранить записи (#883). Открытые #615/#789 содержат прежний local-only scope и вопросы о дальнейшем контракте; оставшиеся решения требуют отдельной сверки с владельцем, но нельзя описывать весь guest-flow как «ожидающий решения».

Следующий release gate: проверить Web/PWA гостевой сценарий, восстановление сессии и сохранение после входа; известный production HTTP 500 при `pinned_practices` с отрицательным guest id остаётся блокером разрешённых гостевых функций. Статус проверки — [`docs/testing/RELEASE_GATE.md`](testing/RELEASE_GATE.md), не объявлять пройденным без evidence.

Активная работа: T12 (ветка `today-card-height-2`) — карточки дня на «Сегодня» всегда 260 px, до и после прохождения (решение владельца 28.09.2026, отменяет эталон «260/233»); тест высоты обновлён 233 → 260, анимация нажатия не тронута.

Скролл-перфоманс и «Диалог» (ветка `telegram-scroll-fix`, base = `main` `c82fad01`, merge без rebase): backdrop-filter убран из прокручиваемого контента (сплошной `--mx-glass-bg` 0.92; «стекло» осталось только на панели вкладок — `--mx-nav-glass-bg`), сворачивание панели вкладок переведено на transform/opacity (scale-морфинг влево, без width/height/border-radius), верхний отступ «Диалога» считается той же формулой App.jsx, что у «Сегодня»/«Шагов» (спец-кейс mentor удалён), заголовок «Продолжить разговор» без Lora. contain: paint не добавлен (у корня прокрутки есть fixed-потомки). Проверка: check:core + dialog-screen 8/8 (Chromium); полный ux:check и WebKit — в CI.

Починено (ветка `fix-bugs-analysis`): баг 2 — шторка «Твои практики» закрывается до навигации (`setSheet(null)` перед `onOpenPractice` в PinnedPractices.jsx); баг 1 — гонка `useBackButton` устранена единым обработчиком на уровне PracticeListFlow, `registerSystemBack` убран из RoundBackButton экранов, `systemBack={false}` от PracticeListFlow к PracticeDetail/PracticeFieldFlow/PracticeSignScreen. check:core 842/0, telegram-p0-check 16/0.
