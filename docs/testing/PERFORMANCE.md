# Performance Gate — Automated Performance Monitoring

Спецификация автоматических проверок производительности Mentalix.

---

## Цель

Гарантировать, что Mentalix остаётся быстрым и не деградирует между releases.

**Целевые метрики:**

- Time to Interactive (TTI): <2000ms;
- First Contentful Paint (FCP): <1000ms;
- Bundle size (gzip): <150 KB;
- Network requests: <10 (except pre-load);
- Console errors: 0;
- Memory leak: не растёт при навигации.

---

## Метрики для отслеживания

### 1. Page Load Timing (Playwright)

**Метрики:**

- `navigationStart`: начало загрузки;
- `domContentLoaded`: DOM готов;
- `loadEventEnd`: все ресурсы загружены;
- `firstPaint`: первый пиксель нарисован;
- `firstContentfulPaint`: первый контент видна.

**Реализация:**

```javascript
const timing = await page.evaluate(() => {
  const t = performance.getEntriesByType('navigation')[0]
  return {
    tti: t.loadEventEnd - t.navigationStart,
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    domReady: t.domContentLoadedEventEnd - t.navigationStart,
  }
})

expect(timing.tti).toBeLessThan(2000) // 2 seconds
expect(timing.fcp).toBeLessThan(1000) // 1 second
```

**Baseline:** устанавливается после первого production release, измеренной на GitHub Actions runner.

---

### 2. Network Performance

**Метрики:**

- Количество fetch запросов;
- Размер каждого ответа (в байтах);
- Время ответа (latency);
- Cache-Control headers.

**Реализация:**

```javascript
const requests = []

await page.on('request', request => {
  requests.push({
    url: request.url(),
    method: request.method(),
    postData: request.postData(),
  })
})

await page.on('response', response => {
  const index = requests.findIndex(r => r.url === response.url())
  if (index >= 0) {
    requests[index].status = response.status()
    requests[index].size = response.headers()['content-length']
    requests[index].timing = response.timing()
  }
})

const totalSize = requests.reduce((sum, r) => sum + (r.size || 0), 0)
const apiRequests = requests.filter(r => r.url.includes('/api'))

expect(apiRequests.length).toBeLessThan(10)
expect(totalSize).toBeLessThan(1024 * 1024) // 1 MB
```

---

### 3. Bundle Size (Build time)

**Метрики:**

- Размер dist/assets/index.*.js (gzip);
- Размер dist/assets/index.*.css (gzip);
- Все вместе <150 KB gzip.

**Реализация:**

```javascript
// In npm run build post-step
const fs = require('fs')
const gzip = require('gzip-size')

const jsFile = fs.readdirSync('dist/assets').find(f => f.startsWith('index-') && f.endsWith('.js'))
const cssFile = fs
  .readdirSync('dist/assets')
  .find(f => f.startsWith('index-') && f.endsWith('.css'))

const jsSize = gzip.sync(fs.readFileSync(`dist/assets/${jsFile}`))
const cssSize = gzip.sync(fs.readFileSync(`dist/assets/${cssFile}`))
const totalSize = jsSize + cssSize

console.log(`JS: ${(jsSize / 1024).toFixed(2)} KB`)
console.log(`CSS: ${(cssSize / 1024).toFixed(2)} KB`)
console.log(`Total: ${(totalSize / 1024).toFixed(2)} KB`)

if (totalSize > 150 * 1024) {
  throw new Error(`Bundle size exceeded: ${(totalSize / 1024).toFixed(2)} KB > 150 KB`)
}
```

---

### 4. Runtime Performance (Core Web Vitals)

**Метрики:**

- **CLS (Cumulative Layout Shift):** <0.1 (no unexpected jumps);
- **FID (First Input Delay):** <100ms (button click response);
- **LCP (Largest Contentful Paint):** <2500ms (main content visible).

**Реализация:**

```javascript
const vitals = await page.evaluate(() => {
  return new Promise(resolve => {
    const metrics = {}

    const clsObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          metrics.cls = (metrics.cls || 0) + entry.value
        }
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })

    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries()
      metrics.lcp = entries[entries.length - 1].renderTime || entries[entries.length - 1].loadTime
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

    setTimeout(() => {
      clsObserver.disconnect()
      lcpObserver.disconnect()
      resolve(metrics)
    }, 5000)
  })
})

expect(vitals.cls).toBeLessThan(0.1)
expect(vitals.lcp).toBeLessThan(2500)
```

---

### 5. Console Errors & Warnings

**Метрики:**

- Количество console.error: должно быть 0;
- Количество console.warn: документировать;
- Исключение: известные трети-стороны (CloudStorage SDK warning).

**Реализация:**

```javascript
const consoleErrors = []
const consoleWarnings = []

page.on('console', msg => {
  if (msg.type() === 'error') {
    if (!msg.text().includes('CloudStorage is not supported')) {
      consoleErrors.push(msg.text())
    }
  } else if (msg.type() === 'warning') {
    consoleWarnings.push(msg.text())
  }
})

// After page load
expect(consoleErrors).toEqual([])
if (consoleWarnings.length > 0) {
  console.warn('Warnings:', consoleWarnings)
}
```

---

### 6. Memory Profiling (Optional)

**Метрики:**

- Начальный heap size;
- Конечный heap size после навигации (50 transitions);
- Growth rate: <5% per 100 transitions.

**Реализация:**

```javascript
const memoryBefore = await page.evaluate(() => {
  return performance.memory
})

for (let i = 0; i < 50; i++) {
  await navigateTo(screens[i % screens.length])
}

const memoryAfter = await page.evaluate(() => {
  return performance.memory
})

const heapGrowth =
  (memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize) / memoryBefore.usedJSHeapSize

expect(heapGrowth).toBeLessThan(0.05) // <5% growth
```

**Сложность:** требует специальной setup на CI; можно пропустить на первых итерациях.

---

## Baseline Management

**Когда установить baseline:**

- После первого успешного production release;
- На GitHub Actions runner (stable, isolated machine);
- С детерминированными fixtures (не зависит от production API).

**Команда:**

```bash
npm run perf:baseline
# Сохраняет metrics в artifacts/performance/baseline.json
```

**Структура baseline:**

```json
{
  "version": "1.0.0",
  "timestamp": "2026-08-22T19:00:00Z",
  "metrics": {
    "tti": 1200,
    "fcp": 800,
    "bundleSize": 145000,
    "apiRequests": 8,
    "cls": 0.05
  },
  "thresholds": {
    "tti_increase": 0.1, // 10% допустимого увеличения
    "bundleSize_increase": 0.05
  }
}
```

---

## PR & CI Integration

**На каждый PR:**

```bash
npm run perf:check
# Сравнивает текущие метрики с baseline
# Выводит: OK / DEGRADED / IMPROVED
```

**Результаты:**

- OK: все метрики в пределах threshold (±10%);
- DEGRADED: одна или больше метрик хуже на >10% → требуется investigation или override;
- IMPROVED: метрики лучше baseline → обновить baseline на merge.

**GitHub Actions output:**

```
✅ Performance Gate
  Time to Interactive: 1180ms (baseline: 1200ms) ✓
  First Contentful Paint: 780ms (baseline: 800ms) ✓
  Bundle Size: 147KB (baseline: 145KB) ⚠️ +1.4% (within 5% threshold)
  API Requests: 8 (baseline: 8) ✓
  Console Errors: 0 ✓

Result: PASS
```

---

## Manual Performance Testing (iPhone)

**На реальном iPhone перед release:**

- [ ] Today loads in <2 seconds (subjective, first feel);
- [ ] No noticeable lag when switching tabs;
- [ ] Scroll is smooth (60 fps, no jank);
- [ ] AI dialog with 50+ messages scrolls smoothly;
- [ ] No app freezes or crashes;
- [ ] Battery drain reasonable (app runs 30+ min without stress).

**Measurement:** Xcode Instruments (if available) or simulator profile.

---

## Roadmap

### Phase 1 (After first release)

- [x] Basic load timing (TTI, FCP);
- [x] Bundle size tracking;
- [x] Console errors.

### Phase 2 (2–3 releases in)

- [ ] Core Web Vitals (CLS, LCP, FID);
- [ ] Network waterfall analysis;
- [ ] Cache optimization validation.

### Phase 3 (Post-MVP)

- [ ] Memory profiling (leak detection);
- [ ] Lighthouse CI integration;
- [ ] Real User Monitoring (RUM) with Sentry.

---

## Handling Performance Regressions

**If performance degrades:**

1. **Identify:** Which metric? (TTI, bundle, network)
2. **Root cause:**
   - New dependency added?
   - More API calls?
   - Worse rendering?
3. **Options:**
   - Optimize: fix the issue;
   - Accept: document and increase threshold (rare);
   - Defer: move feature to post-MVP.
4. **Verify:** Re-run `npm run perf:check` after fix.

---

## Metrics Report Template

```markdown
# Performance Report — v{VERSION}

**Date:** YYYY-MM-DD  
**Baseline:** {VERSION-1}  
**Runner:** GitHub Actions (Ubuntu-latest)

## Summary

| Metric         | Baseline | Current | Change | Status |
| -------------- | -------- | ------- | ------ | ------ |
| TTI            | 1200ms   | 1180ms  | -1.7%  | ✅     |
| FCP            | 800ms    | 820ms   | +2.5%  | ✅     |
| Bundle (gzip)  | 145KB    | 147KB   | +1.4%  | ✅     |
| API Requests   | 8        | 8       | 0%     | ✅     |
| Console Errors | 0        | 0       | 0%     | ✅     |

**Overall:** PASS

## Details

### Improvements

- FCP optimized via lazy-load of Recharts (Library/Trends)

### No Regressions

## Recommendations

- Continue monitoring bundle size; next opportunity: code-split AI dialog.
```
