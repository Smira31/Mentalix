# UX Gate — Automated Testing for Mentalix

Спецификация локального UX gate на Playwright.

## Цель

Гарантировать, что каждый коммит в `main` не ломает критический UX:

- нет горизонтального overflow;
- нет пустых экранов;
- нет пересечений кнопок и навигации;
- все интерактивные элементы доступны;
- нет runtime errors в консоли.

---

## Текущая реализация

**Команда:** `npm run ux:check`

**Маршрут:**

```
Today (fresh load)
  → Check-in (button click)
  → Practices (button click, verify disabled "Нейротренажёр")
  → Rituals (tab)
  → Ascezas (tab)
  → First Step (tab)
  → Library (tab, verify disabled "Практикумы")
  → Trends (tab)
```

**Viewport:**

- 390×844 (iPhone 14–15, Telegram standard)
- 320×568 (iPhone SE 2, legacy)

**Fixtures:** детерминированные данные, вместо production API.

```javascript
// today.js
export const todayEmpty = { quote, checkin: null, rituals: [], ascezas: [] }
export const todayFilled = { quote, checkin: null, rituals: [ritual1, ritual2], ascezas: [asceza1] }
export const todayCompleted = { quote, checkin: { mood: 3, energy: 3 }, rituals: [], ascezas: [] }
```

**Проверки:**

1. **Layout:**
   - no horizontal overflow (document.scrollWidth <= window.innerWidth + 1);
   - content bounded within viewport;
   - navbar does not overlap visible CTA button.

2. **Interactivity:**
   - expected button/link exists and is visible;
   - disabled buttons marked :disabled;
   - "Скоро" controls cannot be clicked.

3. **Errors:**
   - page.on('pageerror') collected;
   - console.error filtered (skip CloudStorage SDK warning);
   - throw if any errors found.

4. **Content:**
   - body text length > 20 characters (non-empty).

**Отчёт:** artifacts/ux-check/report.md с таблицей pass/fail и скриншотами.

---

## Расширение: States Coverage (v2)

Для каждого экрана (Today, Check-in, Practices, Rituals, Ascezas, Library, Trends) добавить варианты:

### Today

```
today-empty        # No rituals, no ascezas, no check-in
today-filled       # Multiple rituals, ascezas, no check-in
today-checked      # Check-in completed
today-loading      # Skeleton state
today-error        # API error message
```

### Check-in

```
checkin-initial    # First time, all fields empty
checkin-partial    # Some fields filled
checkin-all        # All 4 fields filled
checkin-submit     # Post-submit state (disabled)
checkin-error      # Network error
```

### Practices

```
practices-loading  # Spinner
practices-no-rituals  # 0 rituals, 0 ascezas
practices-with-rituals # 3+ rituals
practices-disabled # Neurtrainer disabled ("Скоро")
```

### Rituals

```
rituals-empty      # 0 rituals
rituals-few        # 2–3 rituals
rituals-many       # 50+ rituals (scroll test)
rituals-loading
rituals-error
```

### Ascezas

```
ascezas-empty
ascezas-few
ascezas-many
ascezas-loading
ascezas-error
```

### Library

```
library-empty      # 0 articles
library-few        # 1–3 articles
library-many       # 100+ articles
library-loading
library-error
library-disabled   # Workshops disabled
```

### Trends

```
trends-empty       # 0 data points
trends-week        # Full week of data
trends-error
```

**Структура кода:**

```javascript
// tests/ux/states-coverage.spec.mjs
const STATES = {
  today: [
    { name: 'empty', fixture: fixtures.today.empty },
    { name: 'filled', fixture: fixtures.today.filled },
    { name: 'checked', fixture: fixtures.today.checked },
    { name: 'loading', fixture: fixtures.today.loading },
    { name: 'error', fixture: fixtures.today.error },
  ],
  checkin: [...],
  // ...
};

test.describe('UX Gate v2 — States Coverage', () => {
  for (const [screen, states] of Object.entries(STATES)) {
    for (const state of states) {
      test(`${screen}/${state.name}`, async ({ page }) => {
        // navigate, load fixtures, assert
      });
    }
  }
});
```

**Результат:** ~40–50 новых тестов, каждый со скриншотом.

---

## Accessibility Checks (Future)

- ARIA labels exist for critical buttons;
- color contrast meets WCAG AA (4.5:1 for text);
- keyboard navigation works (Tab through controls);
- screen reader announces headings correctly.

**Инструмент:** axe-core или pa11y.

---

## Integration with CI

**GitHub Actions workflow (`.github/workflows/mentalix-ci.yml`):**

```yaml
- name: Lint
  run: npm run lint

- name: Build
  run: npm run build

- name: UX Gate
  run: npm run ux:check

- name: Upload UX Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: ux-check-report
    path: artifacts/ux-check/
```

---

## Definition of Done for UX Gate

- [ ] All routes pass (Today–Trends);
- [ ] Both viewports pass (390×844, 320×568);
- [ ] Report shows 0 failures;
- [ ] Screenshots checked for visual regression (manual review);
- [ ] Report uploaded as GitHub Actions artifact.

If any state fails:

- [ ] Fix the bug;
- [ ] Re-run `npm run ux:check`;
- [ ] Verify report is clean before commit.
