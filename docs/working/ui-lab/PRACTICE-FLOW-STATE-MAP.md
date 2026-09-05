# PracticeFlow «Без вины» — карта состояний

| Production step/state      | UI Lab screen                                          | Transition / fixture contract                                                                                            |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `intro`                    | Вход: «Вернись к делу без давления»                    | CTA «Снять лишнее давление» → `task`; `SemanticGlyph` `no-blame` с one-shot flight                                       |
| `task`                     | Ввод задачи: «Что откладываешь?»                       | Свободный editor, одна круглая галочка → `feeling`; fixture сохраняет `task` локально                                    |
| `feeling`                  | Выбор чувства: «Что в этом неприятного?»               | Production options: «Скучно», «Тревожно», «Боюсь сделать плохо», «Просто не хочется», «Не знаю почему»; pick → `release` |
| `release`                  | Осмысление: «Здесь не за что себя винить»              | Production release copy; круглая стрелка → `plan`                                                                        |
| `plan` without distraction | Выбор отвлечения: «Что обычно отвлекает вместо этого?» | Production options: «Телефон», «Соцсети», «Другие дела», «Уборка», «Своё»; pick → agreement branch                       |
| `plan` with distraction    | Договор с собой: «Договорись с собой»                  | Production copy; CTA «Начать две минуты» → `run`                                                                         |
| `run`                      | Таймер: «Только эти две минуты»                        | 120 seconds from `Date.now()`; «Остановить» or expiry → `outcome`                                                        |
| `outcome`                  | Итог: «Как прошло?»                                    | Production options: «Начал(а)», «Не начал(а)», «Остановился — было небезопасно»`; pick → `complete`                      |
| `complete`                 | Завершение                                             | Production completion copy, «Помогло сейчас?» (`Нет` / `Немного` / `Да`); fixture-only finish                            |

The route is Preview-only and does not call the production save path, API, Telegram bot, or production router. `JournalTextarea` was inspected as the ownership reference: its production floating toolbar is controlled by `floatingToolbar`; this UI Lab fixture intentionally keeps only the editor-owned check action and does not render `+`, `Aa`, formatting, or AI deepening actions.
