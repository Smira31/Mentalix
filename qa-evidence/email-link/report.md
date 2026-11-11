# «Почта для входа» (#1189) — доказательства

Целевой набор: `tests/ux/email-link.spec.mjs`, конфиг `playwright.email-link.config.mjs`
(Chromium, свой dev-сервер на 127.0.0.1:4184 с `VITE_EMAIL_LINK_ENABLED=true`).
Демо-режим `?demo=1` + `TelegramWebviewProxy` дают платформу Telegram и ответы
`/auth/email-link` без backend: код `123456`, адрес `taken@example.com` → 409 `email_in_use`.

## Кадры

| Состояние | 393×852 | 360×640 |
| --- | --- | --- |
| Строка без почты («Добавить») | `393x852-1-empty.png` | `360x640-1-empty.png` |
| Экран ввода адреса | `393x852-2-email.png` | `360x640-2-email.png` |
| Экран ввода кода | `393x852-3-code.png` | `360x640-3-code.png` |
| Почта привязана (адрес + «Отвязать») | `393x852-4-linked.png` | `360x640-4-linked.png` |
| Ошибка 409 `email_in_use` | `393x852-5-in-use.png` | `360x640-5-in-use.png` |

Каждый кадр снят с `animations: 'disabled'` после того, как состояние отрисовано
(ожидание `data-testid`, без `waitForTimeout`).

## Проверено набором

- добавить → код из письма → привязана → отвязать с подтверждением (оба вьюпорта);
- ветка 409 `email_in_use`: ошибка «Эта почта уже используется. Укажи другую.», шага кода нет;
- неверный код: «Код не подошёл. Проверь письмо.», экран остаётся на шаге кода;
- не Telegram: строки нет и «Почта для входа» не упоминается на экране «твои данные.»;
- атрибуты полей: `type="email"`, `inputmode="numeric"`, `autocomplete="one-time-code"`;
  кнопка «Отправить код ещё раз» сразу после отправки недоступна (отсчёт от метки времени).

## Команды

```bash
node --test tests/unit/email-link.test.mjs
npx playwright test --config=playwright.email-link.config.mjs
```

Полный `ux:check` и WebKit — в CI; ручная проверка на iPhone в Telegram — gate владельца.
