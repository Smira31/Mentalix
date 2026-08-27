# MXL-012 — Android Telegram gate

`MXL-012` — контрольная проверка Mentalix на реальном Android-устройстве внутри Telegram. Это отдельный manual gate; desktop, Chrome Android без Telegram WebView и зелёный CI его не заменяют.

## Цель и границы

Проверить, что production или согласованный Preview Mini App запускается в Telegram WebView на Android, корректно обрабатывает system insets, keyboard, back gesture и основной daily cycle. Backend, API, данные, навигация и визуальный scope не меняются в рамках gate.

Android gate не должен использоваться для утверждения совместимости со всеми моделями Android. Результат относится только к фактически указанным устройствам, версиям Android и Telegram.

## Матрица устройств

| Профиль     | Рекомендуемый пример                                            | Что выявляет                                          |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| Компактный  | Android 6–6.5", 360×800 или близкий viewport                    | Узкие карточки, нижний dock, длинные CTA              |
| Базовый     | Android 6.4–6.7", 390×844 или близкий viewport                  | Основной Telegram WebView и keyboard flow             |
| Большой     | Android 6.7–7.2", 412×915 или близкий viewport                  | Header/footer insets, scroll и свободное пространство |
| Контрольный | Android с жестовой навигацией и отдельный с 3-button navigation | Различия bottom inset и Back behavior                 |

Записать модель, производителя, Android version, security patch если известен, Telegram version, viewport, URL/commit, сеть и дату. Один успешно проверенный Android не означает, что gate пройден для неизвестных профилей.

## Подготовка

1. Обновить Telegram из Google Play или использовать согласованную стабильную версию.
2. Войти в тестовый Telegram-аккаунт; не использовать чужие приватные записи.
3. Открыть `@mentalix_bot` и запустить Mini App через `/start` или CTA.
4. Убедиться, что тестируется Telegram WebView, а не внешний браузер.
5. Включить запись экрана только при отсутствии приватных данных; перед отправкой evidence проверить, что токены, личные сообщения и персональные записи не попали в кадр.
6. При необходимости выполнить чистый запуск и отдельно повторное открытие; production-данные не удалять.

## Android-кейсы

| ID     | Шаги                                                                                  | Ожидаемый результат                                                                                           | Blocker                                                           |
| ------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| AND-01 | Открыть Mini App из Telegram и дождаться Today                                        | Нет белого экрана, краша, бесконечного spinner или неожиданного external browser                              | Краш/невозможность загрузки                                       |
| AND-02 | Проверить верхний inset на экране Today при status bar и Telegram header              | Контент не скрыт под status bar/Telegram chrome; title и первая строка полностью видны                        | Любое перекрытие критичного контента                              |
| AND-03 | Прокрутить Today, Library и Trends сверху вниз и обратно                              | Scroll плавный, верх и низ доступны, горизонтальный scroll не появляется                                      | Stuck scroll, потеря контента или overflow                        |
| AND-04 | Дойти до нижнего края каждого из трёх экранов                                         | BottomNavigation/CTA не перекрываются navigation bar или gesture inset; последняя карточка доступна           | Недоступная CTA или скрытый контент                               |
| AND-05 | Открыть все пять вкладок и вернуться в Today                                          | Today, Practices, Mentor, Library, Trends открываются с правильным active state                               | Неверный экран, краш или сломанная навигация                      |
| AND-06 | Открыть Check-in и пройти все вопросы                                                 | Поля, progress, кнопка продолжения и keyboard доступны; введённый текст сохраняется между шагами              | Потеря ввода, недоступная кнопка или краш                         |
| AND-07 | Открыть Android keyboard в Check-in и Writing Canvas                                  | Поле остаётся видимым, resize/pan не скрывает CTA, dock не перекрывает keyboard или active field              | Невозможно ввести/отправить текст                                 |
| AND-08 | Ввести длинный русский и латинский текст, закрыть keyboard                            | Переносится вертикально; нет horizontal overflow; viewport возвращается без резкого jump                      | Overflow, потеря текста, повторяемый jump                         |
| AND-09 | Отправить сообщение в Mentor/AI и дождаться ответа                                    | User message, loading state и ответ видимы; длинный ответ прокручивается                                      | Нет ответа при доступном backend, spinner forever или layout loss |
| AND-10 | Открыть Practices и создать тестовый ritual/asceza, если flow доступен                | Форма, keyboard и CTA работают; после сохранения item появляется согласно согласованному контракту            | Запись не сохраняется или UI ломается                             |
| AND-11 | Использовать системную кнопку Back в модалке Check-in/AI/Practice                     | Сначала закрывается ожидаемый modal/surface; приложение не выходит из Mini App преждевременно                 | Back закрывает весь flow, краш или потеря данных                  |
| AND-12 | Использовать edge swipe или gesture navigation, если включена                         | Жест не ломает горизонтальный layout и не вызывает случайный переход                                          | Повторяемая навигационная ошибка                                  |
| AND-13 | Нажать Telegram/Mini App Close, затем снова открыть бота                              | WebView закрывается без краша; повторное открытие загружает корректное состояние                              | Краш, зависание или corrupted state                               |
| AND-14 | Включить/выключить system font scaling в согласованном диапазоне и повторить Today/AI | При поддерживаемом масштабе нет критичного обрезания; если диапазон не поддержан, ограничение документировано | Потеря CTA, overlap или нечитаемый текст                          |
| AND-15 | Переключить portrait/landscape, если устройство и Telegram позволяют                  | Portrait остаётся основным поддержанным режимом; при rotation нет permanent overflow или сломанного back      | Permanent layout break                                            |
| AND-16 | Повторить запуск при нестабильной сети, затем восстановить сеть                       | Показывается понятный loading/error/retry state; восстановление не дублирует данные                           | Краш, silent failure или duplication                              |

## Порядок выполнения

Сначала выполнить AND-01–AND-05 на каждом согласованном профиле. Затем на базовом устройстве выполнить AND-06–AND-13. AND-14–AND-16 выполнять только если они входят в согласованный scope и могут быть проверены без изменения production-данных.

Для каждого FAIL сохранить шаги воспроизведения, expected/actual, повторяемость, severity, screenshot/video и сетевое состояние. Не прикладывать секреты, Telegram user ID, токены, database URL или содержимое приватных дневников.

## PASS/FAIL

Android gate имеет статус `PASS`, если все обязательные AND-01–AND-13 пройдены на согласованном базовом устройстве, а на дополнительных профилях нет blocker/major дефектов. `PASS with notes` возможен только для явно документированного non-blocking polish. `NOT TESTED` нельзя трактовать как PASS.

Итог подписывает владелец с указанием фактического устройства. Если Android-устройство не предоставлено, задача остаётся `manual-gate`, даже при успешном iPhone gate.

## Шаблон отчёта

```text
Задача: MXL-012
Дата:
URL / commit:
Устройство / производитель:
Android:
Telegram:
Viewport:
Навигация: gesture / 3-button
Сеть: Wi-Fi / cellular / offline recovery

AND-01: PASS/FAIL/NOT TESTED
AND-02: PASS/FAIL/NOT TESTED
AND-03: PASS/FAIL/NOT TESTED
AND-04: PASS/FAIL/NOT TESTED
AND-05: PASS/FAIL/NOT TESTED
AND-06: PASS/FAIL/NOT TESTED
AND-07: PASS/FAIL/NOT TESTED
AND-08: PASS/FAIL/NOT TESTED
AND-09: PASS/FAIL/NOT TESTED
AND-10: PASS/FAIL/NOT TESTED
AND-11: PASS/FAIL/NOT TESTED
AND-12: PASS/FAIL/NOT TESTED
AND-13: PASS/FAIL/NOT TESTED
AND-14: PASS/FAIL/NOT TESTED
AND-15: PASS/FAIL/NOT TESTED
AND-16: PASS/FAIL/NOT TESTED

Дефекты и evidence:
Итог: PASS / PASS WITH NOTES / FAIL
Подтверждение владельца:
```

## References

1. [`TELEGRAM_GATE.md`](TELEGRAM_GATE.md) — базовый Telegram/iPhone gate.
2. [`UI_RESPONSIVE_CHECK.md`](UI_RESPONSIVE_CHECK.md) — общая responsive UI матрица.
3. [`QA_BASELINE.md`](QA_BASELINE.md) — общие правила smoke и регрессии.
