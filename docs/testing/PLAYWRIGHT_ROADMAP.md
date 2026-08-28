# Mentalix Testing — Playwright Roadmap

Стратегический план развития локальной инфраструктуры Playwright UX Gate.

## Текущее состояние (22.08.2026)

**npm run ux:check** реализует первый pass-through gate:

- локальный web-маршрут Today → Check-in → Practices → Rituals → Ascezas → First Step → Library → Trends;
- детерминированные fixtures вместо production API;
- 16 скриншотов (390×844 и 320×568);
- базовые layout-проверки: overflow, границы, navbar overlap, runtime errors;
- отчёт в artifacts/ux-check/report.md.

Видео и trace отключены. Конфигурация: playwright.ux.config.mjs, тест: tests/ux/ux-check.spec.mjs.

---

## Развитие инфраструктуры

Развитие НЕ должно ломать существующий **npm run ux:check**.

### Этап 1: UX Gate v2 — States Coverage (Independent)

**Цель:** расширить базовый маршрут проверками разных состояний экрана.

**Что добавить:**

- новые наборы fixtures для состояний: loading, empty, filled, completed, error;
- отдельные fixtures-файлы для каждого экрана (`fixtures/today.js`, `fixtures/checkin.js` и т.д.);
- параметризованный тест-генератор для переключения состояний;
- скриншоты каждого состояния в подпапках (`artifacts/ux-check/today-loading/`, `artifacts/ux-check/today-empty/` и т.д.);
- ротированный report.md со сводкой по состояниям.

**Структура после:**

```
tests/ux/
  ux-check.spec.mjs              (остаётся основной)
  states-coverage.spec.mjs       (новый, параметризованный)

fixtures/
  shared.js                       (общие функции)
  today.js
  checkin.js
  practices.js
  rituals.js
  ascezas.js
  library.js
  trends.js
```

**Конфигурация:** остаётся одна (playwright.ux.config.mjs); фильтровать тесты через --grep.

**Команда:** `npm run ux:check` (базовый), `npm run ux:check:states` или `npm run ux:check -- --grep states` (новый).

---

### Этап 2: Visual Regression — Baseline Management (Parallel)

**Цель:** спроектировать хранение эталонных скриншотов и сравнение.

**Что добавить:**

- baseline directory: `artifacts/visual-baselines/` с версионированием (по commit SHA или тег);
- playwright --update-snapshots режим с гридом осторожности (требует явного флага);
- pixelmatch или пользовательский компаратор для выявления отличий;
- дельта-отчёт с highlight-разницей в HTML;
- GitHub workflow: при PR сравнить скриншоты PR с baseline, при merge обновить baseline.

**Структура:**

```
artifacts/
  visual-baselines/
    {baseline-version}/         # e.g., main-<verified-short-sha>
      390x844/
        01-today.png
        02-checkin.png
        ...
      320x568/
        ...
  ux-check/
    {run-timestamp}/
      390x844/
        01-today.png
        ...
      visual-diff.html          # delta report
```

**Дополнения к конфигурации:**

- флаг `--update-baseline` или env `PLAYWRIGHT_UPDATE_BASELINE=1`;
- встроенные снимки vs. файловые: для visual regression лучше файлы (меньше дата в репо);
- GitHub Actions job: checkout baseline ветка, fetch latest baseline версию, сравнить.

**Интеграция с Release Gate:**

- visual gate идёт ПОСЛЕ ux-check прохождения;
- допустимые отличия: определены вручную (e.g., ±5% пикселей, минор цветовые вариации);
- при значимых отличиях требуется ручное подтверждение код-ревью.

---

### Этап 3: Edge Cases Scenarios (Independent)

**Цель:** подготовить библиотеку сценариев для угловых случаев.

**Сценарии по категориям:**

**Text overflow:**

- очень длинный текст в карточке;
- очень длинное название ритуала/аскезы;
- многострочное название с переносом;
- символы высокой ширины (иероглифы, Emoji).

**Empty / Boundary:**

- 0 ритуалов (empty Today);
- 0 аскез;
- 0 практик;
- пустой профиль;
- пустая история чек-ина.

**Loaded / Excess:**

- много ритуалов (50+);
- много аскез (50+);
- много карточек в Library (1000+);
- длинный AI-диалог (50+ сообщений);
- очень длинная статья (5000+ символов).

**Error / Resilience:**

- offline (отключен сервис, network throttle);
- API error (500, 404, timeout);
- partial response (половина полей отсутствует);
- malformed JSON;
- slow response (>10s);
- out-of-order responses.

**State combos:**

- полный сценарий: вход → несколько чек-инов → завершение дня → повторный день;
- switching: быстрое чередование экранов;
- browser memory: открыто 5+ экранов в цепи.

**Структура:**

```
tests/ux/
  edge-cases/
    text-overflow.spec.mjs
    empty-boundary.spec.mjs
    loaded-excess.spec.mjs
    error-resilience.spec.mjs
    state-combos.spec.mjs

fixtures/
  edge-cases/
    {scenario-name}.js           # e.g., long-text-rituals.js
```

**Не изолировать как отдельный project.** Каждый edge-case использует ту же конфигурацию и веб-сервер.

**Команда:** `npm run ux:check:edge-cases` или `npm run ux:check -- --grep "edge-cases"`.

**Результат:** список сценариев в docs/testing/, используемый для manual gate и CI-тригеров.

---

### Этап 4: Performance Gate — Automated Checks (Dependent on Architecture)

**Цель:** спроектировать автоматические проверки производительности.

**Чем проверять:**

- **Timing:**
  - `navigationStart` → `loadEventEnd` (полная загрузка);
  - `domContentLoaded` → erste interactive (Time to Interactive);
  - `firstPaint`, `firstContentfulPaint` (visuals).

- **Network:**
  - количество fetch-запросов;
  - суммарный размер ответов;
  - максимальная задержка single request;
  - кешируемость (Cache-Control headers).

- **Runtime:**
  - количество console.error и console.warn;
  - total JavaScript execution time;
  - memory snapshots (before/after);
  - layout shifts (CLS).

- **Bundle:**
  - размер JS, CSS (из build);
  - gzip-size;
  - unused code (если есть код-сплиттинг).

**Структура:**

```
tests/ux/
  performance.spec.mjs           # тест с проверками

artifacts/
  performance/
    perf-report.json             # метрики в JSON
    perf-report.html             # граф в HTML
```

**Инструментарий:**

- Playwright `page.metrics()` и HAR-запись;
- пользовательский collector для User Timing API;
- собственный threshold-компаратор (baseline vs. текущий run);
- integration с CI для прерывания при деградации >10%.

**Интеграция с Release Gate:**

- performance gate идёт ПОСЛЕ visual прохождения;
- установить baseline после первого успешного release;
- деградация >10% блокирует merge без override.

---

### Этап 5: Contract Tests — API Validation (Dependent on Architecture)

**Цель:** спроектировать проверки соответствия API контрактам.

**Что проверять:**

- для каждого endpoint (`/api/rituals`, `/api/checkin`, `/api/analytics` и т.д.):
  - response status code;
  - наличие обязательных полей;
  - типы данных (string, number, array);
  - диапазоны значений (e.g., mood 1-5);
  - format validation (e.g., ISO date).

- вариации:
  - success path (200);
  - error paths (400, 401, 403, 404, 500);
  - partial response (неполный JSON);
  - delayed response (timeout).

**Структура:**

```
tests/contract/
  rituals.spec.mjs
  ascezas.spec.mjs
  checkin.spec.mjs
  analytics.spec.mjs
  articles.spec.mjs
  profile.spec.mjs
  themes.spec.mjs

fixtures/
  contracts/
    rituals.json                 # schema + examples
    ascezas.json
    ...
```

**Инструментарий:**

- JSON Schema для описания контрактов;
- ajv или zod для валидации;
- собственный генератор тестов из schema.

**Конфигурация:** отдельный `playwright.contract.config.mjs` (может цеплять production API, а не only fixtures).

**Команда:** `npm run test:contracts` или `npm run test:api`.

**Результат:** отчёт о conformance каждого endpoint.

---

## Рекомендуемый порядок реализации

1. **Этап 1: UX Gate v2 — States** (1–2 спринта)
   - Низкий риск, расширяет существующее.
   - Результат: полное покрытие состояний Today–Trends.

2. **Этап 3: Edge Cases Scenarios** (параллельно с 1–2)
   - Создание библиотеки без кода.
   - Результат: список сценариев в docs/.

3. **Этап 2: Visual Regression — Baseline** (после Этапа 1)
   - Зависит от уверенности в UI стабильности.
   - Риск: частые false positives, пока UI не стабилизирована.
   - Рекомендация: делать ПОСЛЕ первого production release.

4. **Этап 4: Performance Gate** (после Этапа 2)
   - Требует установки baseline после release.
   - Риск: шум от вариативности окружения.
   - Рекомендация: использовать GitHub Actions с изолированной машиной.

5. **Этап 5: Contract Tests** (параллельно с Performance)
   - Независим от локального gate.
   - Может цеплять staging API.
   - Рекомендация: перенести на backend repo, если контракт развивается там.

---

## Технические решения

### Конфигурация

- одна базовая `playwright.ux.config.mjs` для всех local gate;
- отдельные конфиги для contract (`playwright.contract.config.mjs`) и optional performance (`playwright.perf.config.mjs`);
- фильтрацию по тестам через CLI `--grep`, не через отдельные configs.

### Fixtures

- переместить из inline в `fixtures/` directory;
- организовать по экранам + shared helpers;
- экспортировать как модули для переиспользования.

### Reporting

- единый формат отчётов (JSON + Markdown);
- HTML-визуализация для скриншотов и дельт;
- CI-интеграция: upload artifacts в GitHub Actions.

### CI Integration

- локальный `npm run ux:check` для dev (fast, fixture-based);
- GitHub Actions workflow для PR:
  1. lint + build;
  2. ux:check (fixture-based, 2–3 мин);
  3. visual regression (если baseline существует);
  4. contract tests (если backend доступен).

---

## Метрики успеха

- **Этап 1:** 100% состояния для Today–Trends; add time <2 мин на ux:check.
- **Этап 2:** утверждённый baseline; false positives <5% per PR.
- **Этап 3:** документированные сценарии используются в manual gate; 80% edge cases покрыты.
- **Этап 4:** baseline performance установлен; деградация >10% блокирует merge.
- **Этап 5:** все контракты заточены; conformance 100% или задокументированы исключения.

---

## Риски и смягчение

| Риск                   | Причина                               | Смягчение                                           |
| ---------------------- | ------------------------------------- | --------------------------------------------------- |
| Slow test suite        | много состояний × много viewports     | parallelism (1 контекст на screen, не на full test) |
| Flaky screenshot diffs | вариативность рендера                 | pixel-diff threshold, ignore antialiasing           |
| Broken fixtures        | API меняется, fixtures не обновляются | автоматическая синхронизация schema в fixtures      |
| CI timeout             | production API медленный              | контракт-тесты используют только staging/mock       |
| False negatives        | edge-cases не покрыты                 | библиотека сценариев + manual gate checklist        |
