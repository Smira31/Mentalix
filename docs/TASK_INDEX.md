---
status: current
last_verified: 2026-11-10
---

# Mentalix — активный task index

Единственный источник задач — GitHub Issues и Milestone «Telegram v1.0». Здесь только реально открытые Issues: на 10.11.2026 их 12, проверено фильтром `is:issue is:open`. Открытая Issue не означает, что работа начата или разрешена; приоритеты и подтверждённое состояние продукта — в [`PROJECT_STATE.md`](../PROJECT_STATE.md). `TASKS.md` и `docs/STATUS.md` не являются backlog.

| Issue                                                     | О чём                                                                                             | Следующий шаг                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [#1185](https://github.com/Smira31/Mentalix/issues/1185)   | Актуализировать `PROJECT_STATE.md` и этот файл на 10.11.2026                                      | Закрывается обновлением документации от 10.11.2026                            |
| [#1184](https://github.com/Smira31/Mentalix/issues/1184)   | P3: «Пульс» на «Сегодня» при нуле не должен показывать «отмечают 0 человек»                       | Текст строки только при `activeToday > 0`; iPhone не нужен                    |
| [#1183](https://github.com/Smira31/Mentalix/issues/1183)   | P1: шкала концентрации в чек-ине — нейтральные подписи в одной константе                          | «Шумно / Плыву / Держусь / Собранно / Ясно»; ручная проверка 1 шага на iPhone  |
| [#1129](https://github.com/Smira31/Mentalix/issues/1129)   | Mentalix Motion Lab: master brief, референсы, типографика, первый motion-тест                      | 5-секундный визуальный proof of concept                                       |
| [#1116](https://github.com/Smira31/Mentalix/issues/1116)   | Позиционирование Mentalix одинаково в Telegram, GitHub, приложении и Pro                           | Сверить формулировки с владельцем                                            |
| [#1096](https://github.com/Smira31/Mentalix/issues/1096)   | QA INDEX аудита владельца 19.10.2026: 43 замечания, 21 задача, непройденные тесты                  | Разбирать по пунктам, статусы — в самой Issue                                  |
| [#1094](https://github.com/Smira31/Mentalix/issues/1094)   | Идея: голосовой ввод у «Спутника» — удержание и отправка                                           | Решение владельца о старте                                                    |
| [#1092](https://github.com/Smira31/Mentalix/issues/1092)   | Backlog: авторское наполнение «Темы недели» — курсы, книги, мысль дня                              | Позже, отдельное решение владельца                                            |
| [#1085](https://github.com/Smira31/Mentalix/issues/1085)   | Идея: облегчить свободное письмо в журнале через диктовку                                          | Решение владельца о старте                                                    |
| [#910](https://github.com/Smira31/Mentalix/issues/910)     | Behavioral Core: Insight → Intention → Action → Follow-up                                          | Согласовать scope с владельцем                                                |
| [#851](https://github.com/Smira31/Mentalix/issues/851)     | Исследование вовлечённости: чтобы возвращаться и оставаться                                        | Рассмотреть результаты исследования с владельцем                              |
| [#771](https://github.com/Smira31/Mentalix/issues/771)     | Миграция на Tailwind CSS 4                                                                          | План миграции и визуальный gate перед началом                                 |

Ранее перечисленные здесь [#615](https://github.com/Smira31/Mentalix/issues/615), [#789](https://github.com/Smira31/Mentalix/issues/789), [#683](https://github.com/Smira31/Mentalix/issues/683), [#582](https://github.com/Smira31/Mentalix/issues/582), [#516](https://github.com/Smira31/Mentalix/issues/516), [#766](https://github.com/Smira31/Mentalix/issues/766), [#767](https://github.com/Smira31/Mentalix/issues/767) закрыты и в активных не числятся; состояние задач всегда проверяется в GitHub, а не по этому файлу.

Публикация — только из `main` после зелёного CI. Зелёная сборка не заменяет ручной iPhone/Telegram gate: safe-area, клавиатура и Telegram WebView без отдельного прогона считаются непроверенными.
