# MentalX / Mentalix — handoff для чистого агента

**Дата:** 14 сентября 2026 года  
**Назначение:** этот документ передаётся новому агенту, чтобы он продолжил работу с тем же контекстом, правилами и уровнем проверки, что и предыдущий агент.  
**Репозиторий:** `/home/ubuntu/Mentalix`  
**Ветка:** `feat/mentor-mvp-kompas-ux`  
**PR:** [#565](https://github.com/Smira31/Mentalix/pull/565)  
**Последний подтверждённый baseline:** `8d29eb10`  
**Текущий подтверждённый HEAD на момент handoff:** `cf94b804`  
**Production:** не изменять без отдельного поручения.

> Начни не с реализации, а с проверки Git, актуального Preview и документов. Не доверяй предыдущему отчёту без прямой проверки репозитория, тестов и интерфейса.

---

## 1. Роль и стиль работы

Работай как senior product/UX engineer и проверяй результат как независимый QA:

1. Сначала сформулируй scope и перечисли, что нельзя менять.
2. Перед изменениями прочитай актуальные project rules, architecture, product и design документы.
3. Перед визуальной правкой открой текущий Demo Preview или локальный Preview.
4. Делай небольшие обратимые изменения только в рамках поставленной задачи.
5. После каждого изменения проверяй реальный UI, а не только код.
6. Не считай задачу выполненной только по словам исполнителя или по успешной сборке.
7. Перед отчётом повторно выполни `git fetch origin --prune`, проверь commit, status, diff и результаты gate.
8. Не публикуй production и не меняй `main` в рамках этой линии без отдельного owner-поручения.

Рабочий язык с владельцем — русский. Отчёт должен содержать: что изменено, что проверено, какие ограничения остались и что является следующим шагом.

---

## 2. Обязательные документы перед работой

Прочитай в таком порядке:

```text
/home/ubuntu/Mentalix/AI_RULES.md
/home/ubuntu/Mentalix/PRODUCT.md
/home/ubuntu/Mentalix/DESIGN_SYSTEM.md
/home/ubuntu/Mentalix/ARCHITECTURE.md
/home/ubuntu/Mentalix/ROADMAP.md
/home/ubuntu/Mentalix/PROJECT_STATE.md
/home/ubuntu/Mentalix/docs/TASK_INDEX.md
/home/ubuntu/projects/m-59af656f/Для других агентов Как работал с клодом.md
```

Для Mentor и текущего Demo дополнительно:

```text
/home/ubuntu/Mentalix/docs/core/MXL-435_MENTOR_PERSONA_PICKER_REDESIGN_ADR.md
/home/ubuntu/Mentalix/docs/research/MENTOR_PERSONA_PICKER_REDESIGN_DIRECTIONS.md
/home/ubuntu/Mentalix/docs/qa/MXL-LOOP-001_CURRENT_PREVIEW.md
/home/ubuntu/mentalix-preview-evidence-2026-09-14.md
/home/ubuntu/mentalix-responsive-audit-2026-09-14.md
```

Для keyboard/FPS аудита:

```text
/home/ubuntu/mentalix-keyboard-fps-audit-2026-09-14.md
/home/ubuntu/mentalix-keyboard-fps-audit-results.json
/home/ubuntu/mentalix-keyboard-fps-summary.json
/home/ubuntu/mentalix-keyboard-fps-audit.mjs
```

Эти внешние audit-файлы могут находиться вне репозитория и не должны считаться production-документацией, пока не принято отдельное решение добавить их в repo.

---

## 3. Skills и инструменты

### Обязательные skills

Перед соответствующей задачей прочитай skill-файл:

```text
/home/ubuntu/skills/mentalix-safe-release-workflow/SKILL.md
```

Для автоматизации, Playwright, Telegram WebApp и background-процессов:

```text
/home/ubuntu/skills/automation-and-scheduling/SKILL.md
```

Для технических Markdown-документов:

```text
/home/ubuntu/skills/technical-writing/SKILL.md
```

Для исследования внешних UX/UI references:

```text
/home/ubuntu/skills/deep-research/SKILL.md
/home/ubuntu/skills/workflow-composer/SKILL.md
```

Не загружай все skills без необходимости. Подключай skill по типу задачи до планирования реализации.

### Инструменты

Используй:

- `git`, `gh` — состояние ветки, PR и GitHub; GitHub CLI уже авторизован;
- Playwright — UX-gate и мобильная матрица;
- `npm run test:unit` — unit tests;
- `npm run build` — production build check;
- `npm run lint` — lint;
- `npm run ux:check` — существующий UX gate;
- `manus-tools` browser — проверка Preview и реального интерактивного UI;
- `functions.read/write/edit/exec` — чтение, безопасное редактирование, запуск команд;
- `manus-render-diagram` — только если нужна диаграмма;
- `manus-md-to-pdf` — только если нужен PDF, не для обычного handoff.

Не используй browser для GitHub, если задачу можно выполнить через `gh`.

---

## 4. Первый обязательный Git-протокол

Выполни буквально:

```bash
cd /home/ubuntu/Mentalix
git fetch origin --prune
git status --short --branch
git log -8 --oneline --decorate
git diff origin/main...HEAD --stat
git diff origin/main...HEAD --check
git rev-parse HEAD
```

Ожидаемая ветка:

```text
feat/mentor-mvp-kompas-ux
```

Текущий HEAD, подтверждённый предыдущей сессией:

```text
cf94b804 feat: усилить нажатия в Demo звуком и вибрацией
```

Если HEAD, remote или рабочее дерево отличаются — сначала опиши расхождение. Не сбрасывай и не переписывай чужие изменения молча.

---

## 5. Продуктовый контекст и уже принятые решения

MentalX — Telegram Mini App про осознанность, journaling, практики и Mentor flow.

Текущая работа идёт только в **Demo Preview** вокруг PR #565. Основной фокус — MVP Mentor и mobile UX.

Уже принято и нельзя пересматривать без нового решения владельца:

- Demo использует iPhone 16 Pro Max frame; поддерживается переключатель iPhone 16 Pro.
- Fullscreen flow должен оставаться внутри Demo frame, а не выходить поверх Preview shell.
- В Demo используется production Library v2.
- Mood glyphs должны быть единообразными.
- Demo визуально имитирует Telegram chrome.
- В Telegram native BackButton заменяет локальную кнопку «Закрыть» и получает контекстное действие «Назад».
- В браузерном Preview локальная кнопка BackButton скрыта для Demo, чтобы не показывать дубликат Telegram-кнопки.
- Основные разделы: Today, Practices, Mentor, Library, Trends.
- Today — главный вход.
- Production публикуется только из защищённого `main`.
- Preview-only изменения не должны незаметно менять production parity.

---

## 6. Что уже сделано в этой линии

Цепочка последних подтверждённых коммитов:

```text
8d29eb10 fix: удерживать fullscreen flow внутри Demo frame
80489ef9 fix: включить production библиотеку в Demo
bc8ac39f fix: синхронизировать Demo copy Наставника
65721d95 fix: синхронизировать Telegram Back в Demo
829846a4 feat: добавить гибкие точки входа в Demo
15610f33 feat: добавить анимации переходов в Demo
2e94f712 feat: добавить тактильный микроотклик в Demo
cf94b804 feat: усилить нажатия в Demo звуком и вибрацией
```

В Demo уже есть:

1. Mentor persona picker и conversation flow.
2. Контекстный Telegram-style Back для Mentor, Today и Practices nested flows.
3. Stoic-inspired flexible entry points в Today/Practices.
4. Demo-only screen transitions.
5. Demo-only tactile button feedback через CSS, Web Vibration API где поддерживается и безопасный Web Audio fallback.
6. Responsive frame matrix для 320×568, 375×812, 390×844 и 430×932.
7. Keyboard proxy/FPS audit для JournalFlow и LilaWriteScreen.

Последний keyboard/FPS audit дал:

- 8/8 keyboard cases PASS;
- shell, dock, body lock и textarea focus проходят на всех 4 viewport;
- средний frame interval около 16.41ms;
- max P95 около 16.80ms;
- sampled frames выше 20ms: 0.

Это browser simulation, а не доказательство реального iPhone Telegram WebView FPS.

---

## 7. Текущий незавершённый блок: Telegram P0 automation

Создана Playwright-заготовка:

```text
/home/ubuntu/Mentalix/tests/ux/telegram-p0-check.spec.mjs
/home/ubuntu/Mentalix/playwright.telegram-p0.config.mjs
```

Она проверяет:

1. Mentor conversation → native BackButton → picker.
2. Journal keyboard resize, dock geometry, body lock и focus.
3. Profile → Settings → Today через native BackButton.
4. Изоляцию Journal storage keys для разных пользователей.

Запуск:

```bash
cd /home/ubuntu/Mentalix
MENTALIX_TELEGRAM_P0_URL='http://127.0.0.1:4173/?demo=1&toolbar=1&device=pro-max&tab=today' \
  npx playwright test --config=playwright.telegram-p0.config.mjs
```

Последний завершённый прогон старой версии дал **4 passed / 4 failed**. После этого в скрипте были исправлены selectors и readiness assertion, но последующий прогон был прерван контекстным переключением; результат нужно проверить первым делом.

Не объявляй P0 automation зелёным, пока не получишь новый полный результат.

Вероятные причины старых падений:

- fake Telegram BackButton readiness проверялась слишком рано;
- selector профиля выбирал кнопку Demo toolbar, а не карточку «Профиль и мой путь»;
- test harness имитирует Telegram WebApp, но не заменяет реальный Telegram iOS WebView.

После исправления запусти только этот файл, затем при необходимости поправь harness. Не ослабляй assertions до простого «страница открылась».

---

## 8. Telegram BackButton: текущая реализация и желаемый принцип

Файлы:

```text
src/platform/telegram.hooks.js
src/components/BackButton.jsx
src/App.jsx
```

Сейчас `useBackButton` использует module-level stack:

- screen регистрирует handler;
- handler помещается в stack;
- Telegram BackButton показывает/скрывает себя по длине stack;
- верхний handler считается текущим Back;
- cleanup удаляет entry.

`App.jsx` также держит Demo-level `demoBackAction` для overlay/tab/nested flow.

При дальнейшей доработке соблюдай правила:

- не регистрируй один и тот же handler на каждом render;
- используй stable entry + `ref.current` для актуального callback;
- cleanup должен удалять ровно собственную entry;
- BackButton должен быть подписан ровно один раз;
- при отсутствии stack Telegram BackButton должен скрываться;
- при смене nested screen внутренний flow должен иметь приоритет над tab-level back;
- системный Back не должен закрывать Mini App, если внутри есть screen history;
- browser Demo должен иметь тот же semantic action, но не дублировать Telegram chrome;
- все platform calls должны быть capability-safe для старых Telegram clients.

Если потребуется синхронизация с history router, сначала зафиксируй контракт:

```text
inner flow history → current tab history → overlay history → close Mini App
```

Не используй одновременно независимый module stack, `window.history.back()` и локальные `onClose` без единого owner: это создаёт double-pop и stale handler race.

---

## 9. Journal drafts: текущая реализация

Файл:

```text
src/lib/journalStorage.js
```

Текущий user-scoped key:

```text
mx-journal-v2:user:<encodeURIComponent(normalizedUserId)>
```

Legacy keys:

```text
mx-journal-v2
mx-journal-prototype-v1
```

Уже есть:

- `normalizeUserId` для string/number IDs;
- `readJournalStore(userId)`;
- `readJournalEntry(date, userId)`;
- `saveJournalPhase({ date, phase, text, status, userId })`;
- `clearJournalStore(userId)`;
- opt-in migration legacy → current user key;
- safe JSON read/write с обработкой storage failure;
- phase normalization и version 2.

### Правильная retention policy

Не очищай draft при каждом закрытии экрана: это уничтожит незавершённый текст. Рекомендуемая политика:

- draft хранится локально сразу после изменения или с debounce 250–500ms;
- final entry не удаляется автоочисткой draft policy;
- draft без изменений старше 30 дней удаляется при следующем чтении конкретного user store;
- весь user store старше 90 дней можно compact-ить, оставляя final entries;
- автоочистка запускается только после `readJournalStore(userId)` и только для текущего user key;
- удаление должно быть deterministic по ISO `updatedAt`;
- corrupted JSON не должен ломать приложение;
- storage quota failure должен показать fallback/error, а не тихо потерять данные;
- logout/account switch должен очищать только in-memory state текущего пользователя, а не storage другого пользователя;
- не использовать общий fallback key для авторизованного user кроме явно подтверждаемой legacy migration.

Псевдоконтракт автоочистки:

```js
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000

function pruneDrafts(store, now = Date.now()) {
  for (const entry of Object.values(store.entries)) {
    for (const phase of Object.values(entry.cycle)) {
      if (phase.status !== 'draft') continue
      const updated = Date.parse(phase.updatedAt || '')
      if (Number.isFinite(updated) && now - updated > DRAFT_TTL_MS) {
        phase.text = ''
        phase.updatedAt = null
      }
    }
    entry.freeWrites = entry.freeWrites.filter(item => {
      if (item.status === 'final') return true
      const updated = Date.parse(item.updatedAt || '')
      return !Number.isFinite(updated) || now - updated <= DRAFT_TTL_MS
    })
  }
  return store
}
```

Перед внесением такой политики добавь unit tests на:

1. user A не читает user B;
2. user B не читает user A;
3. draft младше TTL сохраняется;
4. draft старше TTL очищается;
5. final phase сохраняется независимо от TTL;
6. malformed timestamp не удаляет текст молча;
7. legacy migration не переносится автоматически между аккаунтами;
8. `clearJournalStore(userA)` не удаляет user B.

---

## 10. P0 release gate

До релиза Demo в Telegram обязательны:

1. реальная клавиатура на iPhone 16 Pro;
2. реальная клавиатура на iPhone 16 Pro Max;
3. Journal → next phase при открытой клавиатуре;
4. Lila write при открытой клавиатуре;
5. native Telegram BackButton из Mentor conversation;
6. native Telegram BackButton из nested Journal/Lila flow;
7. Profile → Settings → Today;
8. fullscreen on/off и safe-area;
9. background/foreground во время ввода;
10. быстрый double-tap по CTA;
11. Telegram iOS WebView manual check;
12. Android Telegram smoke check.

Browser Playwright tests не заменяют ручной iPhone/Telegram gate.

---

## 11. Стандартный цикл продолжения

```bash
cd /home/ubuntu/Mentalix

git fetch origin --prune
git status --short --branch
git log -8 --oneline --decorate

npm run test:unit
npm run build
npm run lint
npm run ux:check

git diff --check
```

Для локального Preview:

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Открыть:

```text
https://5173-i2wxes23at5jg18ck28js-07e66150.us1.manus.computer/?demo=1&toolbar=1&device=pro-max&tab=mentor
```

Owner QA Preview:

```text
https://mentalix-preview.vercel.app/?demo=1&toolbar=1&device=pro-max&tab=mentor
```

Перед изменениями открой Preview. После изменений проверь минимум тот flow, которого коснулось изменение, затем unit/build/lint/UX gate.

---

## 12. Что сделать первым после handoff

1. Прочитать этот файл и перечисленные обязательные документы.
2. Выполнить Git-протокол из раздела 4.
3. Проверить результат последнего `telegram-p0-check.spec.mjs` прогона; если его нет, запустить заново.
4. Исправить только реальные проблемы P0 harness или приложения.
5. Не добавлять production-изменения под видом Demo-фикса.
6. Проверить `git diff origin/main...HEAD`, unit, build, lint и UX gate.
7. Отдельно записать, что всё ещё требует ручного iPhone/Telegram gate.
8. В следующем сообщении владельцу дать короткий статус: HEAD, изменённые файлы, tests, Preview URL, остаточные риски.

---

## 13. Формат финального отчёта владельцу

```text
Готово:
- ...

Изменения:
- файл — зачем изменён

Проверки:
- git HEAD:
- unit:
- build:
- lint:
- ux:check:
- Telegram P0:
- manual iPhone/Telegram:

Preview:
- ссылка

Осталось:
- ...

Production:
- не изменялся / изменён только по отдельному поручению
```

Если какой-либо gate не выполнен, напиши это прямо. Не называй Preview «готовым к релизу», если не пройден обязательный manual Telegram gate.
