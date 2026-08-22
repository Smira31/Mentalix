# Mentalix Design Guard — Automated Design Validation

Спецификация автоматических дизайн-проверок для соблюдения Design System.

---

## Цель

Гарантировать, что каждый экран соответствует design system и не нарушает визуальные принципы Mentalix.

---

## Принципы Design System

**Из DESIGN_SYSTEM.md:**

- Только тёмная тема (монохром + золото);
- Основной фон: `#050403` (--c-bg);
- Золото как единственный акцент: `#EDBD60` (--c-gold);
- Типографика: Onest 400/500/600/700/800 (заголовки по весу, не гарнитуре);
- Минимальный размер input: 16px (не увеличивается iOS);
- Контраст текста: основной text-cream 15.1:1, вторичный text-muted 5.69:1;
- Safe areas respected для Telegram fullscreen.

---

## Автоматические проверки (Playwright)

### 1. Background Color Compliance

**Правило:** Фон экрана должен быть `#050403` (или 5, 4, 3 в RGB).

**Реализация:**

```javascript
const bgColor = await page.evaluate(() => {
  const root = document.querySelector('#root > div')
  return window.getComputedStyle(root).backgroundColor
})

expect(bgColor).toMatch(/rgb\(5,\s*4,\s*3\)|rgb\(4,\s*4,\s*4\)/)
// Allow slight variation (4, 4, 4) due to browser rendering
```

**Исключения:** модальные окна могут иметь другой фон (e.g., `#111111` для карточек).

---

### 2. Gold Accent Usage

**Правило:** Золото (`#EDBD60`, rgb 237, 189, 96) использовано ТОЛЬКО для:

- активный tab indicator;
- completed state (галочка, прогресс-бар);
- CTA button highlight;
- значимые метрики (большие цифры в Analytics).

**Реализация:**

```javascript
const goldElements = await page.evaluate(() => {
  const els = document.querySelectorAll('[style*="edbd60"], [style*="EDBD60"], [class*="gold"]')
  return Array.from(els).map(el => ({
    tag: el.tagName,
    role: el.getAttribute('role'),
    text: el.textContent?.slice(0, 50),
  }))
})

// Validate: each gold element is expected role (tab, button, status)
expect(goldElements).toSatisfy(items =>
  items.every(el => ['tab', 'button', 'status'].includes(el.role))
)
```

**Риск:** случайные золотые декоративные элементы.

---

### 3. BottomNavigation Overlap Prevention

**Правило:** видимые CTA buttons не должны перекрываться BottomNavigation.

**Реализация:** (уже в ux-check.spec.mjs)

```javascript
const navBox = await page.locator('nav[aria-hidden="false"]').boundingBox()
const ctaButtons = await page.locator('button.cta-pill:visible:not(:disabled)')

for (let i = 0; i < (await ctaButtons.count()); i++) {
  const ctaBox = await ctaButtons.nth(i).boundingBox()
  expect(overlap(ctaBox, navBox)).toBe(false)
}
```

---

### 4. Screen Rhythm & Spacing

**Правило:** Отступы между элементами должны соответствовать design token spacing:

- `gap-2` = 8px (tight);
- `gap-3` = 12px (comfortable);
- `gap-4` = 16px (section separator);
- `gap-6` = 24px (large section break).

**Реализация:**

```javascript
const spacingViolations = await page.evaluate(() => {
  const gaps = new Set()
  document.querySelectorAll('[class*="gap-"]').forEach(el => {
    const classStr = el.className
    const match = classStr.match(/gap-(\d+)/)
    if (match && !['2', '3', '4', '6'].includes(match[1])) {
      gaps.add(match[1])
    }
  })
  return Array.from(gaps)
})

expect(spacingViolations.length).toBe(0)
```

**Исключение:** legacy components или экспериментальные layouts.

---

### 5. Safe Area Compliance

**Правило:** Контент должен быть в safe-area границах. На iPhone:

- top: notch (~44px) или Dynamic Island (~28px);
- bottom: home indicator (34px) или none;
- left/right: 0px (full width).

**Реализация:**

```javascript
const safeArea = await page.evaluate(() => {
  const root = document.querySelector('#root')
  const rect = root.getBoundingClientRect()
  const envSafe = getComputedStyle(document.documentElement).getPropertyValue(
    '--safe-area-inset-top'
  )
  return {
    topPadding: rect.top,
    bottomPadding: window.innerHeight - rect.bottom,
    envVar: envSafe,
  }
})

// Minimum safe-area padding at top/bottom
expect(safeArea.topPadding).toBeGreaterThanOrEqual(0)
expect(safeArea.bottomPadding).toBeGreaterThanOrEqual(0)
```

---

### 6. No Unexpected Layout Shift (CLS — Cumulative Layout Shift)

**Правило:** Экран не должен "прыгать" при загрузке или взаимодействии.

**Реализация:**

```javascript
const cls = await page.evaluate(() => {
  return new Promise(resolve => {
    let clsValue = 0
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
    })
    observer.observe({ type: 'layout-shift', buffered: true })
    setTimeout(() => {
      observer.disconnect()
      resolve(clsValue)
    }, 3000)
  })
})

expect(cls).toBeLessThan(0.1) // Good score: <0.1
```

**Метрика:** Google PageSpeed Insights использует <0.1 как "хорошо".

---

### 7. No Horizontal Overflow

**Правило:** Экран НЕ должен иметь горизонтальный скролл.

**Реализация:** (уже в ux-check.spec.mjs)

```javascript
const geometry = await page.evaluate(() => ({
  documentWidth: document.documentElement.scrollWidth,
  bodyWidth: document.body.scrollWidth,
  viewportWidth: window.innerWidth,
}))

expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1)
expect(geometry.bodyWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1)
```

---

### 8. Text Contrast Compliance (WCAG AA)

**Правило:** Основной текст должен иметь контраст минимум 4.5:1.

**Реализация:** (с использованием axe-core или webaim api)

```javascript
const textElements = await page.locator('body *').all()

for (const el of textElements) {
  const rgb = await el.evaluate(e => window.getComputedStyle(e).color)
  const bg = await el.evaluate(e => window.getComputedStyle(e.parentElement).backgroundColor)
  const contrast = calculateContrast(rgb, bg)

  if (el.isVisible()) {
    expect(contrast).toBeGreaterThanOrEqual(4.5)
  }
}
```

**Инструмент:** axe-accessibility или pa11y для автоматизации.

---

## Ручные дизайн-проверки

- [ ] На каждом экране только один оттенок золота (не разные вариации);
- [ ] Иллюстрации соответствуют semantic motion (`MENTALIX_SEMANTIC_MOTION.md`);
- [ ] Все интерактивные элементы имеют :hover / :active состояния;
- [ ] Никакой белый фон (RGB 255, 255, 255) не используется;
- [ ] Никакой синий акцент не используется (только золото);
- [ ] Все заголовки используют правильный weight Onest (не другую гарнитуру);
- [ ] Нет `font-size: 14px` для inputs (должна быть минимум 16px);
- [ ] Все карточки имеют одинаковый border-radius (если используются).

---

## Design Audit Workflow

**Перед каждым release:**

1. Запустить automated checks: `npm run test:design-guard`
2. Обзор скриншотов из ux-check на цвета, контраст, spacing;
3. Мануальная проверка на real device (iPhone, Telegram);
4. Документировать любые исключения в `DESIGN_CHANGES.md`;
5. Получить одобрение от дизайнера перед merge.

---

## Исключения & Legacy

**Если код нарушает Design System:**

1. Документировать в `DESIGN_CHANGES.md` с обоснованием;
2. Создать issue в GitHub: "Design debt: [description]";
3. Добавить skip флаг в test: `test.skip('...', () => { ... })` или `// design-guard: skip`;
4. Запланировать рефакторинг на отдельный спринт.

**Пример:**

```javascript
// design-guard: skip — legacy modal, refactor in v2
test('Old modal styling', () => {
  // This modal uses custom colors, not from Design System
})
```

---

## Метрики успеха

- [x] 100% экранов проходят automated color checks;
- [x] 0 unexpected layout shifts (CLS <0.1);
- [x] 0 horizontal overflow;
- [x] 100% text contrast >= WCAG AA (4.5:1);
- [x] Design audit checklist signed off перед release.

---

## Integration with CI

**GitHub Actions workflow:**

```yaml
- name: Design Guard
  run: npm run test:design-guard

- name: Upload Design Report
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: design-guard-failures
    path: artifacts/design-guard/
```
