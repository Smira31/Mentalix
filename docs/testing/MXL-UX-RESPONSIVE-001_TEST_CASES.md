# MXL-UX-RESPONSIVE-001 — детальные тест-кейсы

Задача выбрана владельцем как **приоритетная для v1.1.0**. Документ описывает проверку и возможное точечное исправление responsive UI; он не расширяет scope на backend, API, данные, core loop или новый дизайн.

## Тестовая матрица

| Профиль             | Viewport / устройство                    | Цель                                                              |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Узкий legacy        | iPhone SE 2, 320×568 CSS px              | Выявить overflow, обрезание CTA и конфликт нижнего dock           |
| Узкий современный   | iPhone 13 mini или аналог, около 375×812 | Проверить переносы и keyboard layout                              |
| Базовый             | iPhone 14/15/16, около 390×844           | Сравнить с текущим UX smoke baseline                              |
| Большой высокий     | iPhone Pro Max, около 430×932            | Проверить header offset, свободное пространство и fixed controls  |
| Контрольный Android | Реальное Android-устройство в Telegram   | Не является частью этой задачи; используется только через MXL-012 |

## Подготовка

Открыть production или согласованный Preview внутри Telegram WebView. Записать commit/URL, модель устройства, ОС, версию Telegram, дату и состояние тестового пользователя. Не использовать Safari/Chrome как замену Telegram gate и не менять production-данные ради теста.

Если дефект найден, приложить screenshot или screen recording и указать повторяемость. Статичный кадр, на котором элемент выглядит подозрительно, фиксировать как observation; layout jump считать подтверждённым только после воспроизведения действия.

## Тест-кейсы

| ID      | Сценарий и шаги                                                                       | Ожидаемый результат                                                                                              | Evidence / blocker                                         |
| ------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| UX-R-01 | Открыть Mini App из Telegram, дождаться Today, закрыть и открыть повторно             | Нет белого экрана, краша или неожиданного изменения масштаба; повторный запуск стабилен                          | Видео или 2 screenshots; краш — blocker                    |
| UX-R-02 | На Today проверить верх страницы при initial load и после scroll-to-top               | Header, первый заголовок и первая строка не перекрыты Telegram chrome; контент начинается с одинакового baseline | Screenshot top state; скрытая первая строка — major        |
| UX-R-03 | На Today прокрутить вниз и вернуть вверх три раза                                     | Нет скачка scroll position, мерцания или самопроизвольного горизонтального scroll                                | Screen recording; повторяемый jump — major                 |
| UX-R-04 | Перейти Today → Practices → Mentor → Library → Trends и вернуться в Today             | Каждая вкладка открывается, active state правильный, переход не меняет ширину viewport и не обрезает dock        | Таблица PASS/FAIL; краш или неверная вкладка — blocker     |
| UX-R-05 | На каждом экране прокрутить до конца                                                  | Последняя строка/карточка доступна; fixed dock не скрывает контент и Home Indicator                              | Screenshot bottom state; недоступная последняя CTA — major |
| UX-R-06 | В Check-in открыть первое поле и ввести короткий текст                                | Keyboard не скрывает поле; caret и кнопка действия доступны; layout не прыгает                                   | Screenshot keyboard state; недоступный input — blocker     |
| UX-R-07 | В Check-in ввести длинный русский текст и закрыть keyboard                            | Перенос вертикальный, горизонтального overflow нет, текст не теряется, viewport возвращается предсказуемо        | Screenshot до/после; loss/overflow — blocker/major         |
| UX-R-08 | В Writing Canvas открыть keyboard, нажать Return/dismiss, снова открыть               | Нижний dock не перекрывает активное поле или CTA; высота surface корректно пересчитывается                       | Video; перекрытие CTA — major                              |
| UX-R-09 | В AI Dialog отправить длинное сообщение и получить длинный ответ                      | Пузыри/текст переносятся, ответ не выходит за viewport, input и send control доступны                            | Screenshot long response; horizontal overflow — major      |
| UX-R-10 | Открыть модальный Check-in/AI, выполнить back gesture с левого края и закрыть кнопкой | Модалка закрывается один раз, основной экран не ломается, scroll state не становится случайным                   | Video; stuck modal или navigation loss — major             |
| UX-R-11 | Проверить Dynamic Island/notch и Home Indicator на соответствующем iPhone             | Контент не попадает в системные зоны; dock и CTA имеют безопасный отступ                                         | Top/bottom screenshots; overlap — blocker                  |
| UX-R-12 | Проверить floating control у правого края на всех профилях                            | Control полностью виден, не обрезан, hit area не уходит за viewport и не закрывает текст                         | Screenshot + tap result; недоступный control — major       |
| UX-R-13 | Проверить заголовки, подписи, карточки и длинные названия ритуалов                    | Нет обрезания без предусмотренного ellipsis; нет горизонтального scroll; перенос сохраняет иерархию              | Screenshot narrow profile; overflow — major                |
| UX-R-14 | Быстро переключить вкладки и открыть/закрыть Library article                          | Нет flash/flicker, content shift не меняет размер tap target, loading state не зависает                          | Video; повторяемый flicker/shift — major                   |
| UX-R-15 | Переключить light/dark системную тему, если поддерживается, и проверить контраст      | Вторичные подписи и controls читаемы; контраст не делает действие незаметным                                     | Screenshot; нечитаемый critical action — major             |
| UX-R-16 | На каждом профиле повторить core path Today → Check-in → сохранение → Today           | Responsive изменения не ломают core loop и не меняют сохранённый результат                                       | Gate report; loss of state — blocker                       |

## Критерии завершения

Задача может считаться визуально готовой, если все обязательные кейсы UX-R-01–UX-R-13 и UX-R-16 имеют PASS на согласованных профилях, нет blocker/major дефектов, а minor/polish замечания занесены отдельно. UX-R-14 и UX-R-15 обязательны для задач, которые изменяют motion или цвета.

После реализации требуются `npm run test:unit`, `npm run lint`, `npm run build`, `npm run docs:check`, `git diff --check` и `npm run ux:check`. Затем владелец проходит Telegram/iPhone gate минимум на узком и базовом профилях; Pro Max и SE используются для regression evidence.

## Шаблон результата

```text
Задача: MXL-UX-RESPONSIVE-001
Дата / commit / URL:
Устройство / ОС / Telegram:
Viewport:

UX-R-01: PASS/FAIL/NOT TESTED
UX-R-02: PASS/FAIL/NOT TESTED
UX-R-03: PASS/FAIL/NOT TESTED
UX-R-04: PASS/FAIL/NOT TESTED
UX-R-05: PASS/FAIL/NOT TESTED
UX-R-06: PASS/FAIL/NOT TESTED
UX-R-07: PASS/FAIL/NOT TESTED
UX-R-08: PASS/FAIL/NOT TESTED
UX-R-09: PASS/FAIL/NOT TESTED
UX-R-10: PASS/FAIL/NOT TESTED
UX-R-11: PASS/FAIL/NOT TESTED
UX-R-12: PASS/FAIL/NOT TESTED
UX-R-13: PASS/FAIL/NOT TESTED
UX-R-14: PASS/FAIL/NOT TESTED
UX-R-15: PASS/FAIL/NOT TESTED
UX-R-16: PASS/FAIL/NOT TESTED

Дефекты и повторяемость:
Evidence:
Итог:
Подтверждение владельца:
```

## References

1. [`UI_RESPONSIVE_CHECK.md`](UI_RESPONSIVE_CHECK.md) — общая матрица viewport и критерии responsive UI.
2. [`TELEGRAM_GATE.md`](TELEGRAM_GATE.md) — базовый Telegram/iPhone gate Mentalix.
3. [`QA.md`](../../QA.md) — общие Given/When/Then и регрессионные проверки.
