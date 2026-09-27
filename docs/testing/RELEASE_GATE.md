---
status: current
last_verified: 2026-09-27
---

# Release Gate — Pre-Release Testing Sequence

Последовательность автоматических и ручных проверок. Решение владельца 27.09.2026 после #905: v1.0 — **только Telegram Mini App**, Web/PWA gate ниже — после v1.0, **не блокер**. Никакие чекбоксы здесь не подтверждают фактический PASS без evidence.

## Telegram v1.0 — релизный чек-лист владельца

- [ ] Визуал «как Stoic» проверен по референсам: Шаги/Explore (засечки только в заголовках разделов), поток записи, значки, профиль, низ «Сегодня» (карточки 260/233 и анимация сжатия — эталон).
- [ ] Мягкая серия реализована и проверена: любая завершённая активность (чек-ин, журнал, ритуал, аскеза, «Настроение», направленная запись), один пропуск в календарную неделю не рвёт серию, «Верни серию» за вчера. A (`mentalix-bot`, `feat/soft-streak`) работает над backend; «Canonical streak v1» (только чек-ин/журнал, строго подряд) **заменено решением 27.09**.
- [ ] Privacy Policy v1.0 опубликована **в приложении**.
- [ ] PrivacyNotice/Settings не обещают больше, чем реально умеет сервер; проверены реальные сценарии и тексты.
- [ ] Финальный QA владельца на реальном iPhone в Telegram пройден.
- [ ] Нет открытых P0/P1 для Telegram v1.0.

Один оркестратор — Claude; A в `mentalix-bot`, B и C в `Mentalix`. Приоритет — сначала визуал, затем релиз; 18+ сохраняется. **Проверить с юристом до публичного запуска:** 152-ФЗ, данные о настроении/психсостоянии как особая категория, согласие, уведомление РКН. Это отдельная юридическая проверка, не утверждение о соответствии.

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

## Web/PWA gate (после Telegram-only v1.0; не блокер v1.0)

Прежнее «перед публичным релизом» **заменено решением 27.09** применительно к Telegram v1.0. Перед отдельным Web/PWA-релизом проверить сценарии ниже в реальном браузере/PWA с доступным API. Это checklist, **не свидетельство прохождения**:

- [ ] Новый браузер без сессии открывает приложение → автоматический гостевой вход → доступен основной экран; при ошибке входа доступен явный retry/email/Telegram вход.
- [ ] Перезагрузка и повторное открытие PWA восстанавливают гостевую bearer session и данные того же гостя, не создавая новый аккаунт.
- [ ] Гость с записью видит предложение сохранить; вход через email OTP переносит гостевые записи (guest → email), а затем повторный вход показывает их без потери или смешения чужих данных. Telegram Login проверить отдельно, если настроен.
- [ ] Разрешённые гостю функции, включая закреплённые практики, не дают fatal HTTP 5xx; проверять network/runtime, а не только наличие UI. Известный production defect: отрицательный guest id и `pinned_practices` → HTTP 500, gate пока не пройден.

Merge/зелёный CI не равны Web/PWA PASS. Backend-fix и проверка production требуют отдельной работы и evidence; этот документ ничего не меняет в backend.

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

**Pass criteria:** владелец подтверждает ручной check-off; для Telegram v1.0 это обязательный, а не optional gate.

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
Mandatory: финальный QA владельца на iPhone в Telegram для v1.0
  ↓
Approve & merge → main
  ↓
GitHub Actions (same suite) runs on main commit
  ↓
Deploy to Firebase Hosting Live channel (automatic from main)
  ↓
Post-deploy: Manual smoke test (production URL, iPhone Telegram)
  ↓
RELEASE ✓
```

---

## Определение "Production Ready"

Этот исторический общий шаблон **заменён решением 27.09** для Telegram v1.0: checklist выше — действующий критерий. До evidence ни одна проверка не отмечена пройденной. Для каждого кандидата отдельно подтвердить lint, build, UX-проверку, review, Telegram/iPhone QA владельца и успешный deployment; Web/PWA gate проверяется отдельно после v1.0.

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
# After merge to main and successful Firebase Hosting deploy
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
   - Firebase Hosting: use the verified Firebase rollback procedure or `git revert HEAD && git push`;
   - Tag: create rollback tag `v{VERSION}-rollback`;
   - Notify: team and users via Telegram bot.
4. **Fix:** Create hotfix branch, debug locally, test, merge as separate PR.
5. **Release:** New patch version after fix verified.

---

## Metrics & Monitoring

**Post-release:**

- [ ] Firebase Hosting Production deployment successful (green workflow);
- [ ] Production URL accessible (HTTP 200);
- [ ] Backend health: GET /api/health returns 200 OK;
- [ ] No frontend errors in Sentry (if integrated);
- [ ] Key user flows don't timeout;
- [ ] Initial cohort (5–10 users) validates happy path.
