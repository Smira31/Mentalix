# MXL-RETURN-FLOW-001: контракт утреннего Telegram return flow

## Статус

**Тип:** contract/design note для PR 1
**Связанные задачи:** [Mentalix #123](https://github.com/Smira31/Mentalix/issues/123), закрытая архитектурная Issue [#121](https://github.com/Smira31/Mentalix/issues/121)
**Следующий этап:** PR 2 — backend/bot foundation в приватном репозитории `Smira31/mentalix-bot`
**P0-сценарий:** утренний контакт → Today → одно полезное действие

Этот документ фиксирует минимальный контракт до начала backend, bot и frontend реализации. Он не является доказательством end-to-end готовности: Telegram/iPhone manual gate выполняется отдельно.

## 1. Цель

Mentalix должен возвращать пользователя не в абстрактное приложение, а в конкретное полезное продолжение. Утреннее сообщение Bot должно открыть Mini App в контексте Today, показать одно ближайшее действие и после completion определить следующий шаг.

Целевая цепочка:

```text
утренний trigger
→ сообщение Bot
→ CTA
→ Telegram Mini App deep link
→ Today / morning context
→ одно действие
→ completion
→ следующий шаг
```

## 2. Scope PR 1

В этот contract/design note входит:

- один P0-сценарий `morning_v1`;
- формат Telegram deep link;
- правила разбора контекста на frontend;
- backend/bot responsibilities;
- completion и idempotency expectations;
- timezone, quiet hours и consent boundaries;
- fallback, expiry и error behavior;
- security boundaries;
- acceptance criteria и план PR 2.

## 3. Out of scope

В этот срез не входят:

- вечерний разбор, пропущенный ритуал, выпадение из ритма и недельный digest;
- новая основная вкладка или новый router;
- изменение Telegram auth или способа идентификации пользователя;
- восстановление streak задним числом;
- Journal cloud sync, tags и history-by-day;
- персональные данные или текст Journal в URL;
- массовая миграция state management;
- автоматическое закрытие Issue #123 без end-to-end проверки.

## 4. Канонический P0 flow

| Шаг | Событие                                        | Владелец         | Результат                                        |
| --- | ---------------------------------------------- | ---------------- | ------------------------------------------------ |
| 1   | Наступило локальное утреннее окно пользователя | backend/jobs     | Пользователь eligible для одного morning message |
| 2   | Bot отправил сообщение                         | bot              | Сообщение содержит одну contextual CTA           |
| 3   | Пользователь нажал CTA                         | Telegram         | Открывается Mini App direct link                 |
| 4   | Mini App получил `morning_v1`                  | frontend         | Открывается Today с утренним контекстом          |
| 5   | Пользователь начал действие                    | frontend         | Отображается одно ближайшее действие             |
| 6   | Пользователь завершил действие                 | frontend/backend | Completion фиксируется один раз                  |
| 7   | Сформирован следующий шаг                      | backend/frontend | Пользователь видит понятное продолжение          |

## 5. Telegram deep-link contract

Канонический формат для direct-link Mini App:

```text
https://t.me/<bot_username>/<app_name>?startapp=morning_v1
```

`morning_v1` — короткий allowlisted идентификатор сценария. Telegram передаёт его Mini App как `start_param` и как `tgWebAppStartParam` в GET-параметрах [официальная документация Telegram](https://core.telegram.org/bots/webapps).

Разрешённые значения должны храниться в коде как явный allowlist. На первом этапе разрешается только:

```text
morning_v1
```

Будущие значения (`evening_review_v1`, `missed_ritual_v1`, `weekly_review_v1`) не входят в PR 2 и не должны приниматься до отдельного contract review.

### Запрещено передавать в ссылке

- Telegram `user_id` как способ авторизации;
- raw `initData`;
- текст Journal, ответы пользователя и персональные данные;
- database IDs, если они не защищены отдельным одноразовым серверным механизмом;
- bot token, API keys или deployment secrets.

`startapp` определяет намерение открыть сценарий, но не подтверждает личность. Идентичность и ownership определяются только по проверенному Telegram `initData` на backend.

## 6. Frontend contract

### 6.1 Разбор параметра

Frontend при старте Mini App:

1. читает `start_param` из Telegram WebApp context;
2. использует `tgWebAppStartParam` только как технический fallback;
3. принимает только значения из allowlist;
4. преобразует `morning_v1` во внутреннее состояние Today;
5. игнорирует неизвестные, пустые и истёкшие значения;
6. не использует параметр для авторизации или выбора пользователя.

Предлагаемая внутренняя модель:

```js
{
  flow: 'morning_v1',
  destination: 'today',
  context: 'morning',
  source: 'telegram_direct_link'
}
```

Это внутренняя модель, а не публичный API. Названия полей можно изменить в PR 3, если сохранится описанное поведение.

### 6.2 Поведение Today

При `morning_v1` пользователь попадает на существующий Today, но получает contextual entry state:

- один primary action;
- короткое объяснение, почему этот шаг актуален;
- отсутствие конкурирующих CTA;
- после completion — понятный следующий шаг;
- обычный Today fallback, если контекст отсутствует или неизвестен.

Новая основная вкладка для flow не создаётся.

### 6.3 Повторный вход и ошибки

| Ситуация                            | Обязательное поведение                                                     |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Первый вход по свежему `morning_v1` | Показать утренний контекст Today                                           |
| Действие уже завершено              | Показать completion и следующий шаг, не создавать дубликат                 |
| Повторное открытие той же ссылки    | Идемпотентно восстановить контекст                                         |
| Старый/истёкший flow                | Открыть обычный Today или актуальный безопасный fallback                   |
| Неизвестный `startapp`              | Открыть обычный Today                                                      |
| Нет Telegram auth                   | Не открывать защищённые пользовательские данные; использовать web fallback |
| Ошибка backend                      | Показать явную ошибку и retry, не пустой экран                             |

## 7. Backend/bot contract

### 7.1 Eligibility

Backend/jobs отвечает за:

- включён ли у пользователя morning contact;
- локальную timezone пользователя;
- quiet hours;
- отсутствие дубликата за локальную дату;
- наличие необходимого consent;
- retry policy при временной ошибке Telegram.

На первом этапе не вводить новый персональный scheduler, если существующий hourly jobs tick может безопасно выполнить эту работу.

### 7.2 Сообщение

Bot отправляет одно сообщение с одной contextual CTA. Текст и кнопка должны быть локализуемыми, но минимальный русский вариант:

```text
Доброе утро. Выбери один небольшой шаг, с которого начнётся сегодняшний день.
```

CTA:

```text
Открыть сегодняшний шаг
```

CTA ведёт на canonical Mini App deep link с `startapp=morning_v1`, а не на корень приложения.

### 7.3 Completion

Completion не равен открытию ссылки. Он наступает после успешного пользовательского действия в Mini App.

Минимальная семантика событий:

```text
morning_flow_opened
morning_action_started
morning_action_completed
morning_flow_skipped
```

Backend должен принимать повторную доставку безопасно: одинаковый flow/event не создаёт второй completion и не меняет чужие данные.

Точный endpoint, schema и storage выбираются в PR 2 после проверки существующих `events`, rituals и Telegram auth модулей. До этого frontend не должен выдумывать URL или payload.

## 8. Security и privacy

- Каждый приватный endpoint требует verified Telegram-backed identity.
- `startapp` — routing hint, не credential.
- Ownership проверяется на backend по аутентифицированной личности.
- Не логировать raw `initData`, Telegram token, Journal text и полный пользовательский payload.
- Не принимать client-supplied `user_id` как достаточное доказательство доступа.
- События completion должны быть scoped к authenticated user и конкретному flow.
- Не использовать необратительные действия без отдельного подтверждения пользователя.

## 9. Acceptance criteria первого flow

- [ ] Contract согласован между frontend, backend и bot.
- [ ] Bot отправляет сообщение только eligible пользователю в его локальном утреннем окне.
- [ ] За одну локальную дату нет повторной отправки того же morning flow.
- [ ] CTA ведёт на canonical direct link с `startapp=morning_v1`.
- [ ] Frontend распознаёт `morning_v1` и открывает существующий Today в утреннем контексте.
- [ ] Неизвестный/старый параметр безопасно открывает обычный Today.
- [ ] Пользователь выполняет одно действие без конкурирующей primary CTA.
- [ ] Completion фиксируется один раз.
- [ ] Повторное открытие не создаёт дубликата.
- [ ] После completion показан следующий шаг.
- [ ] Ошибка backend имеет видимый retry/fallback.
- [ ] Unit и integration tests backend/bot/frontend проходят.
- [ ] Полный сценарий проверен в Telegram на реальном iPhone.

## 10. План PR 2 — backend/bot foundation

PR 2 раскладывается на отдельные Issues в `Smira31/mentalix-bot`:

1. backend contract и allowlisted morning deep link;
2. morning eligibility, timezone, quiet hours и idempotency;
3. Bot message и contextual CTA;
4. flow events и completion contract;
5. tests, observability, rollout и manual evidence.

Issues должны идти последовательно: contract → scheduler → message → events → integration/manual gate. Ни одна Issue не закрывает #123 сама по себе.

## 11. Checks и rollback

### Checks

- unit tests для deep-link builder и allowlist;
- unit tests для timezone/quiet-hours/idempotency;
- bot handler/keyboard tests;
- API auth/ownership/event tests;
- integration test с fake Telegram delivery;
- redacted logs и отсутствие secrets/PII;
- frontend unit/UX tests в PR 3;
- реальный Telegram/iPhone gate после объединения.

### Rollback

- отключить morning flow feature flag или `reminder_enabled`-ветку;
- прекратить отправку новых morning messages;
- сохранить обычный `/start` и обычный Mini App launch;
- не удалять пользовательские completion events без отдельной процедуры;
- откатить только contextual routing, не auth и не существующие ritual endpoints.

## 12. Решение для PR 1

PR 1 принимает контракт и границы, но **не утверждает**, что flow реализован. После merge PR 1 backend владелец может брать Issues PR 2, а frontend владелец — подготовить отдельный PR 3 только против согласованных `start_param` и completion contracts.
