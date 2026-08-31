# MXL-SECURITY-AUDIT-001 — backend initData

## Статус

Backend-валидация Telegram Mini App `initData` реализована в `mentalix-bot/main` и зафиксирована здесь как отдельный актуальный контракт. Документ не меняет API и не переносит устаревшие исторические записи из `TASKS.md`.

## Реализация

Проверка выполняется через HMAC-алгоритм Telegram Mini Apps с использованием `BOT_TOKEN`. Backend извлекает заявленный Telegram user ID, проверяет подпись, допустимый возраст `auth_date`, отсутствие будущей даты и соответствие идентичности владельцу ресурса.

Защищённые пользовательские роутеры подключают зависимость `require_verified_identity`. Роутеры `auth.py` и `telegram_api.py` намеренно не оборачиваются этой зависимостью: первый является источником identity для email/link flows, второй принимает webhook-обновления от Telegram-сервера, а не пользовательские запросы Mini App.

Импорт `BOT_TOKEN` выполняется лениво внутри проверки подписи. Это сохраняет возможность импортировать backend-модули в тестовых окружениях, где корень репозитория не добавлен в `sys.path`.

## Проверки

В исходной security-ветке заявлены 33 backend-теста: валидная подпись, подмена payload, неверный bot token, просроченный и будущий `auth_date`, отсутствие заголовка и несовпадение user ID. На текущем этапе в этой frontend-репозитории фиксируется контракт и provenance; backend-код и backend-тесты находятся в отдельном репозитории `mentalix-bot`.

## Последующие действия

После следующего backend-релиза необходимо проверить production health, Telegram-клиент и web/email login, а также убедиться, что защищённые роуты отклоняют неподписанные или чужие запросы. Любые изменения backend-контрактов должны проходить отдельным PR в `mentalix-bot`.

## Post-release проверка 31.08.2026 (после `mentalix-bot` PR #36)

Проверка выполнена live-запросами к прод-backend (`https://mentalix-bot.onrender.com`) после `mentalix-bot` PR #36 (per-user progression для «Тема недели», смёржен 30.08.2026, затрагивал только `themes.py` — не `auth.py`/`telegram_auth.py`/`main.py`).

| Проверка                                                    | Запрос                                                                     | Ожидалось                      | Получено                                                          | Результат |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------- | --------- |
| Production health                                           | `GET /api/health`                                                          | `200 {"status":"ok"}`          | `200 {"status":"ok"}`                                             | ✅ PASS   |
| Запрос без подписи, positive `user_id`                      | `GET /api/rituals?user_id=<fake>` без `Authorization`                      | `401`                          | `401 {"detail":"missing_telegram_auth"}`                          | ✅ PASS   |
| Запрос с поддельной подписью                                | `GET /api/rituals?user_id=<fake>` c `Authorization: tma` и невалидным hash | `401`                          | `401 {"detail":"invalid_telegram_auth"}`                          | ✅ PASS   |
| Чужой `X-Web-User-ID` (не привязан к заявленному `user_id`) | `GET /api/rituals?user_id=<fake>` с `X-Web-User-ID: 1`                     | `401`                          | `401 {"detail":"missing_telegram_auth"}`                          | ✅ PASS   |
| Неподписанная запись (write-эндпоинт)                       | `POST /api/rituals` без подписи, `user_id=<fake>`                          | `401`, ритуал не создан        | `401 {"detail":"missing_telegram_auth"}`                          | ✅ PASS   |
| Web/email login: запрос кода                                | `POST /api/auth/email/request-code`                                        | `200`, без `dev_code` на проде | `200 {"ok":true,"expires_in_minutes":10}`, `dev_code` отсутствует | ✅ PASS   |
| Web/email login: неверный код отклоняется                   | `POST /api/auth/email/verify` с заведомо неверным кодом                    | `ok:false`, не логинит         | `200 {"ok":false,"error":"invalid_or_expired_code"}`              | ✅ PASS   |

**Не проверено (граница возможностей этой сессии):** полный успешный email OTP login (linked-web account) — требует получения реального кода на почту, к которой у сессии нет доступа. Все шаги ДО получения кода (создание OTP, отклонение неверного кода) подтверждены живыми запросами; сам финальный `verify` с правильным кодом не пройден.

**Вывод:** защищённые роуты (включая write-эндпоинты) корректно отклоняют неподписанные и поддельные запросы кодом `401`, а не `200`. Production health в норме. Web/email login flow работает на всех проверяемых без реального email-ящика шагах. Релиз `mentalix-bot` PR #36 не затронул auth-контракт (подтверждено и по diff, и живыми запросами).
