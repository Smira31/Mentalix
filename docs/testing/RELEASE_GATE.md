# Release Gate — Pre-Release Testing Sequence

Последовательность автоматических и ручных проверок перед releasе.

---

## Автоматические проверки (CI/CD)

### 1. Lint & Format

```bash
npm run lint
npm run format  # --check mode in CI
```

**Блокер:** не проходит → блокирует merge.

---

### 2. Build

```bash
npm run build
```

**Блокер:** ошибки сборки → блокирует merge.

---

### 3. UX Gate (Automated)

```bash
npm run ux:check
```

**Проверяет:** layout, overflow, navbar overlap, runtime errors.

**Блокер:** fail state → блокирует merge.

---

### 4. Visual Regression (After baseline established)

```bash
npm run ux:check:visual
```

**Проверяет:** pixel-by-pixel соответствие baseline для каждого экрана.

**Допуски:** ±5% пикселей, игнорировать antialiasing.

**Блокер:** >допуска → требуется manual override через PR комментарий.

**Когда вводить:** после первого успешного production release.

---

### 5. Performance Gate (After baseline established)

```bash
npm run test:performance
```

**Проверяет:**

- Time to Interactive <2s (baseline на локальной машине);
- bundle size gzip <150KB;
- console errors == 0;
- network requests <10 (за исключением pre-load).

**Блокер:** деградация >10% от baseline → требуется override.

**Когда вводить:** после 2–3 production cycles.

---

### 6. Contract Tests (Backend-dependent)

```bash
npm run test:contracts
```

**Проверяет:** API responses соответствуют schema для всех endpoints.

**Блокер:** fail → требуется fix или update schema.

**Когда вводить:** после определения API contracts в backend.

---

## Ручные проверки (iPhone / Telegram)

### Telegram/iPhone Gate (Critical)

**Требуется:** реальный iPhone + Telegram app.

**Маршрут:**

```
Profile → /start → onboarding → Today → Check-in → Practice → Rituals → AI → Analytics
```

**Чек-лист:**

- [ ] App не крашится при открытии;
- [ ] Telegram safe-area соблюдается (контент не перекрывает notch/home indicator);
- [ ] BottomNavigation не перекрывает контент;
- [ ] iOS keyboard не прерывает текст ввода (Practices, AI);
- [ ] Swipe-назад (back gesture) не ломает навигацию;
- [ ] Fullscreen Telegram (main button) работает;
- [ ] MainButton обновляется синхронно;
- [ ] Animations smooth (no jank);
- [ ] Performance приемлемая (<2s load Today).

**Экран:** iPhone 14 Pro (standard), можно также SE2 (legacy).

**Pass criteria:** владелец подтверждает ручной check-off.

---

### Accessibility Gate (Manual, Optional)

- [ ] Text readable (contrast, font size);
- [ ] Colors not primary way to distinguish actions;
- [ ] Buttons 16px+, tappable (44×44px iOS standard);
- [ ] No auto-playing audio/video;
- [ ] Focus indicators visible.

---

### Content Gate (Manual, Product)

- [ ] Русский текст корректен, нет опечаток;
- [ ] Translations complete (если applies);
- [ ] Images load and display correctly;
- [ ] No placeholder/debug text visible;
- [ ] Links work and don't 404.

---

## Полная последовательность перед merge в main

```
PR opened
  ↓
GitHub Actions (lint, build, ux:check, optional: visual, performance, contracts)
  ↓
Manual code review (AI_RULES.md, architecture, no unrelated changes)
  ↓
Local test: npm run preview (if changes are significant)
  ↓
Optional: Manual Telegram/iPhone verification (critical features)
  ↓
Approve & merge → main
  ↓
GitHub Actions (same suite) runs on main commit
  ↓
Deploy to Vercel (automatic)
  ↓
Post-deploy: Manual smoke test (production URL, iPhone Telegram)
  ↓
RELEASE ✓
```

---

## Определение "Production Ready"

Коммит в `main` считается Production Ready, если:

- [x] `npm run lint` passes;
- [x] `npm run build` succeeds;
- [x] `npm run ux:check` passes all states;
- [x] Visual regression passes (or no baseline exists yet);
- [x] Performance baseline maintained (or first baseline established);
- [x] Manual code review approved;
- [x] Manual Telegram/iPhone gate passed (product owner);
- [x] Deployment to Vercel successful.

---

## Отслеживание релизов

**Команда:** `git tag v{MAJOR}.{MINOR}.{PATCH}` на production commit.

**Примеры:**

- `v1.0.0` — first release (today);
- `v1.0.1` — patch (bug fix, no new features);
- `v1.1.0` — minor (new feature, backward compatible);
- `v2.0.0` — major (breaking changes).

**Tagging workflow:**

```bash
# After merge to main and successful Vercel deploy
git tag -a v1.0.0 -m "Release v1.0.0: today, practices, check-in, ai, analytics"
git push origin v1.0.0
```

---

## Release Notes Template

```markdown
# Mentalix v{VERSION}

**Release date:** YYYY-MM-DD

## What's new

- [feature] Brief description
- [feature] Another feature

## Bug fixes

- Fixed: issue description
- Fixed: another issue

## Known issues

- Issue title: workaround or timeline
- Another known issue

## Migration guide (if applicable)

## Special thanks
```

---

## Emergency Rollback Procedure

If production breaks:

1. **Identify:** What broke? (Telegram report, health check, user issue)
2. **Assess:** Can it wait? (Critical: <1 hour, patch; non-critical: next release)
3. **Rollback:**
   - Vercel: redeploy previous git commit via Vercel dashboard or `git revert HEAD && git push`;
   - Tag: create rollback tag `v{VERSION}-rollback`;
   - Notify: team and users via Telegram bot.
4. **Fix:** Create hotfix branch, debug locally, test, merge as separate PR.
5. **Release:** New patch version after fix verified.

---

## Metrics & Monitoring

**Post-release:**

- [ ] Vercel deployment successful (green check);
- [ ] Production URL accessible (HTTP 200);
- [ ] Backend health: GET /api/health returns 200 OK;
- [ ] No frontend errors in Sentry (if integrated);
- [ ] Key user flows don't timeout;
- [ ] Initial cohort (5–10 users) validates happy path.
