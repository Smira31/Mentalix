# Telegram/iPhone Gate — Manual Testing Checklist

Обязательный ручной checklist для проверки Mentalix на реальном iPhone внутри Telegram Mini App.

---

## Требуемый setup

**Device:** iPhone 14 Pro (стандарт) или iPhone SE 2 (legacy 320×568).

**App:** Telegram app (latest version, iOS App Store).

**Bot:** @mentalix_bot (production) или @mentalix_staging_bot (staging).

**Test user:** зарегистрированный аккаунт с несколькими днями истории (не fresh install).

---

## Этап 1: App Launch & Safe Area

- [ ] Bot /start → Telegram WebView opens;
- [ ] App не крашится при загрузке;
- [ ] Safe area соблюдается: контент не перекрывает notch (iPhone 14 Pro) или home indicator;
- [ ] BottomNavigation не обрезана, видна полностью;
- [ ] Текст читается, не обрезается по краям.

**Экран для проверки:** Today.

---

## Этап 2: Telegram Integration

### Fullscreen & MainButton

- [ ] Telegram MainButton (CTA) видна и кликабельна;
- [ ] При клике на MainButton приложение выполняет ожидаемое действие (e.g., submit check-in);
- [ ] MainButton текст обновляется при смене экрана;
- [ ] Кнопка "Закрыть" (или back) закрывает WebView без крашей.

**Проверить на:** Check-in, Practices (при создании ритуала/аскезы).

### Safe Area Integration

- [ ] Контент не видно перекрывает notch (iPhone 14 Pro) или Dynamic Island;
- [ ] Padding вверху достаточен для Telegram chrome;
- [ ] Padding внизу достаточен для home indicator / safe area инset;
- [ ] BottomNavigation находится ВЫШЕ safe area (видна полностью, не обрезана).

**Экраны для проверки:** Today, Library, Trends (много контента внизу).

---

## Этап 3: Keyboard & Text Input

### iOS Keyboard Behavior

- [ ] Когда фокус на input field, keyboard поднимается автоматически;
- [ ] Текст в input visible (не скрыт клавиатурой);
- [ ] После введения текста, можно нажать "Return" или dismiss keyboard;
- [ ] Фокус остаётся на поле или правильно переходит на next field.

**Проверить на:** Check-in (4 input fields), Practices → Create Ritual/Asceza (text fields).

**Known issue:** (MXL-PRACTICES-KEYBOARD-POSTRELEASE-001) На 4–5 поле форма может автоматически сместиться. Функциональность не нарушается, это визуальное поведение iOS WebView. Перенесено на пост-release.

### Text Overflow

- [ ] Длинный текст в карточке переносится, не обрезается;
- [ ] Названия ритуалов/аскез обрезаются с "…" если слишком длинные;
- [ ] Никакой текст не выходит за границы экрана.

**Проверить на:** Rituals (длинные названия), AI Dialog (длинные ответы).

---

## Этап 4: Navigation & Gestures

### Tab Navigation (BottomNavigation)

- [ ] Клик на каждую вкладку переходит на правильный экран (Today, Practices, AI, Library, Trends);
- [ ] Текущая вкладка выделена (active state видна);
- [ ] Переход между вкладками плавный, без lag;
- [ ] Содержимое вкладки загружается (или из cache) за <1 сек.

**Экраны для проверки:** все пять вкладок.

### Back Gesture (Swipe from left edge)

- [ ] Swipe left edge закрывает модалы (Check-in, AI Dialog, Settings);
- [ ] Swipe left edge НЕ должна ломать основную навигацию;
- [ ] На главных экранах (Today, Library) back gesture игнорируется или минимальна.

**Проверить на:** Check-in modal (open → swipe left → should close).

### Scroll & Content Navigation

- [ ] Вертикальный скролл работает плавно (Today, Library, Trends);
- [ ] При скролле нет jank или stuck moments;
- [ ] BottomNavigation остаётся видной при скролле (не disappears);
- [ ] Горизонтальный scroll НЕ происходит случайно (edge-swipe не должна скроллить боком).

---

## Этап 5: Animations & Performance

### Motion

- [ ] Page transitions smooth (no flash/flicker);
- [ ] Button press feedback (highlight или opacity change) видна;
- [ ] Loading states show spinner или skeleton, не freezes;
- [ ] Dismiss animation (close modal) плавная.

**Проверить на:** Today → Check-in (transition), Library → Article (open), modal closes.

### Performance & Responsiveness

- [ ] Today loads в <2 сек с первого открытия (или из cache);
- [ ] Клики на кнопки срабатывают сразу, без задержки;
- [ ] Нет visible lag при скролле;
- [ ] App не видимо греется / сильно не нагревает телефон;
- [ ] Memory не растёт при переключении между экранами.

**Метрики:** используй Devtools если доступны; на production Telegram это сложно, полагаться на субъективное ощущение.

---

## Этап 6: Feature Flows (Critical Paths)

### Check-in Flow

- [ ] Open Today → "Пройти чек-ин" button visible;
- [ ] Click → Check-in modal opens with 4 questions;
- [ ] Fill all 4 fields (mood, energy, anxiety, focus);
- [ ] Press "Готово" (или MainButton) → modal closes;
- [ ] Today обновляется: показывает "Чек-ин выполнен";
- [ ] Нет errors в консоли (если console accessible).

### Ritual / Asceza Creation

- [ ] Practices tab → "Создать ритуал" button;
- [ ] Click → Create form opens;
- [ ] Fill name, description, frequency;
- [ ] Press MainButton → ritual created, form closes;
- [ ] Rituals tab → новый ритуал видна в списке.

### AI Dialog

- [ ] Today → "Первый шаг" (AI mentor) button;
- [ ] Click → open AI dialog screen with initial persona message;
- [ ] Type message in input field;
- [ ] Press send → message appears, spinner shows, response arrives;
- [ ] Long responses (3+ messages) scroll properly without layout shift;
- [ ] Back/close → returns to Today.

### Analytics (Trends)

- [ ] Trends tab → charts visible;
- [ ] Charts display data (bars, lines) without visual artifacts;
- [ ] No console errors from recharts library.

---

## Этап 7: Special Cases

### Dynamic Island (iPhone 14+ Pro only)

- [ ] App does not hide content behind Dynamic Island;
- [ ] Top padding sufficient to clear it;
- [ ] Notifications (if any) do not overlap app content.

### Notch (iPhone 12–14)

- [ ] Safe area respected;
- [ ] Content left/right of notch does not overflow.

### Home Indicator (All modern iPhones)

- [ ] Bottom safe area respected;
- [ ] BottomNavigation does not overlap indicator;
- [ ] Swipe-up gesture (to open Control Center) does not interfere with app.

---

## Этап 8: Error Handling & Edge Cases

### Network Issues

- [ ] Kill WiFi / use 2G → app shows loading spinner, doesn't crash;
- [ ] Resume network → data loads or shows retry button;
- [ ] No unhandled promise rejections.

### Offline

- [ ] Disconnect network completely;
- [ ] Open cached screens (Today, Library) → should work from cache;
- [ ] Try to fetch new data → error state or "Offline" message;
- [ ] Resume network → data refreshes.

### Long Dialogs & Lists

- [ ] AI Dialog with 50+ messages → scroll smooth, no lag;
- [ ] Library with 100+ articles → infinite scroll or pagination works;
- [ ] Rituals/Ascezas list with 50+ items → no freeze.

---

## Final Sign-Off

After all checks pass:

- [ ] Screenshot evidence (optional but recommended): notch area, keyboard test, modal animations;
- [ ] Owner signature/confirmation: "Telegram/iPhone gate passed on iPhone 14 Pro, version X.Y.Z";
- [ ] Notes: any visual quirks, edge cases, or workarounds noted;
- [ ] Green light for production deploy.

---

## Known Limitations (Document before release)

- [ ] MXL-PRACTICES-KEYBOARD-POSTRELEASE-001: Form field shift on 4–5 fields (visual, non-blocking);
- [ ] [Add any others as they surface].

---

## Regression Checklist Template

For every release, use this template:

```
## v{VERSION} Telegram/iPhone Gate

Device: iPhone 14 Pro
Telegram version: X.XX
OS: iOS X.X
Date: YYYY-MM-DD

- [ ] Safe area / notch
- [ ] Keyboard & text input
- [ ] Tab navigation
- [ ] Back gesture
- [ ] Check-in flow
- [ ] Ritual creation
- [ ] AI dialog
- [ ] Analytics view
- [ ] No crashes
- [ ] Performance acceptable

Status: ✅ PASS / ❌ FAIL

Notes:
...

Signed: @owner
```
