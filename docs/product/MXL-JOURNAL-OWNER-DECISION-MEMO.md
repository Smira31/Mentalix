# Mentalix Journal — owner-ready decision memo

**Дата аудита:** 29 августа 2026 г.
**База фактов:** `Smira31/Mentalix`, `origin/main` на commit `29f156180941d5dc326f3e965124c42c2f6e1f3d` (`fix: устранить race condition в useFullscreenSurface`, PR #327).
**Ограничение:** этот memo не меняет код, не обращается к `Smira31/mentalix-bot` и не превращает discovery-документы в утверждённые решения.

## Executive decision

**Рекомендация:** ближайший публичный Journal-релиз должен быть **local-first Journal v1**: четыре короткие фазы «Идея → Действие → Анализ → Новый шаг», возможность сохранить черновик, продолжить незавершённый цикл, завершить его и открыть локальную историю с явной маркировкой «сохранено на этом устройстве». Это уже фактически реализовано в `origin/main`; перед окончательным production-обещанием остаётся ручной Telegram/iPhone gate.

**Cloud sync, unified cloud History, AI-deepen по тексту Journal, media, reminders, tags/search/favorites и monetization не должны входить в ближайший публичный scope.** Для cloud и AI сначала нужны отдельные owner/privacy/backend решения; отсутствие backend contract нельзя трактовать как готовность.

## 1. Фактическая граница готовности

| Класс | Фактическое состояние | Вывод для релиза |
|---|---|---|
| **Реализовано в `origin/main`** | `JournalFlow` с четырьмя фазами; drafts/final; user-scoped `localStorage` `mx-journal-v2:user:<id>`; opt-in миграция старого browser-wide ключа; обработка storage failure; `readJournalHistory`; local Journal block в `History.jsx`.[1][2] | Это минимальная ценность v1: личная запись, завершение и возврат к прошлым локальным дням. |
| **Реализовано только в feature/open PR** | Открытые PR #303 (`MXL-INSIGHTS-001`) и #306 (`MXL-WTP-001`) — docs/research-only, оба открыты и заблокированы проверками. Они не являются частью `origin/main` и не принимают продуктовых решений.[6][7] | Не включать их выводы как shipped scope или approval. |
| **Discovery/draft** | `journalEntryContract.js` и `journalEntryAdapter.js` — frontend-only pure/read-only слой; unified History architecture и privacy/AI-consent document явно имеют draft/discovery status.[3][4][5] | Использовать как список вопросов и ограничений, не как backend contract. |
| **Заблокировано backend-контрактом** | Cloud journal, межустройственная синхронизация, единая cloud chronology, conflict policy, server-authoritative timezone, retention, export/delete, consent ledger и AI provider disclosure.[3][4][5] | Не обещать и не реализовывать по предположению. |
| **Продуктовая гипотеза** | Guided journals, personalization/cadence, descriptive insights как следующий измеряемый слой, willingness-to-pay, paid insights и outcome plans.[6][7][8] | Нужны owner decision и evidence; не считать принятым решением. |

Важно: текущий `History.jsx` не является единой Journal-историей. Основная датированная лента строится из backend check-in/activity, а Journal добавлен отдельным блоком «Локальный журнал» с копирайтом о хранении только на устройстве и в профиле.[2] Frontend entry adapter не подключён к UI и всегда выставляет `sync_status: local_only`.[3]

## 2. Решения по пяти вопросам

### Решение 1 — минимальная пользовательская ценность Journal v1/v1.1

**Recommended option.** Выпустить Journal v1 как спокойный, необязательный инструмент ежедневной рефлексии: пользователь открывает Journal из «Практик», пишет четыре короткие части, может закрыть приложение и продолжить, видит, что сохранено, завершает цикл и позднее перечитывает локальные записи. Для v1.1 допустим только безопасный frontend refinement: более ясный local-history browsing и CTA «Продолжить сегодня» при сохранении текущей локальной модели; это не должно создавать впечатление cloud sync.

| Поле решения | Содержание |
|---|---|
| **Rejected alternatives** | Пустой free-form editor без структуры; обязательная серия дней/streak; утренний/вечерний scheduler; AI-терапевтическая «сессия»; новый главный раздел или шестая вкладка. |
| **Rationale** | Четырёхфазный flow уже реализован и соответствует core loop «заметить → выбрать → осмыслить → продолжить», не требует нового backend и не создаёт ложного обещания терапии. |
| **User risk** | Пользователь может ожидать доступ с другого устройства или принять `final` за объективный/медицинский вывод. Риск снимается явным local-only copy и нейтральным языком. |
| **Technical dependency** | Ручная проверка Telegram/iPhone; сохранение browser storage; существующие local history/read-model. |
| **Owner decision required** | Подтвердить: «local-first Journal v1 считается допустимой публичной ценностью без cloud sync». Отдельно подтвердить, нужен ли CTA «Продолжить сегодня» в v1.1. |
| **Measurable acceptance signal** | В ручном gate пользователь проходит start → 4 phases → completion → reopen без потери текста; smoke-проверки проходят на 390×844 и 320×568; доля успешных завершений Journal и доля продолженных незавершённых циклов измеряются без передачи текста. |

### Решение 2 — достаточно ли local-first history

**Recommended option.** Да, **local-first history достаточно для первого публичного Journal-релиза**, если релиз обещает только хранение на текущем устройстве/в текущем профиле. Cloud sync не должен быть precondition v1; он является отдельным продуктом и privacy/backend gate.

| Поле решения | Содержание |
|---|---|
| **Rejected alternatives** | Делать вид, что localStorage — account history; silently sync drafts; запускать cloud path по frontend-предложению; откладывать публичный Journal до полноценной облачной платформы без доказанной потребности. |
| **Rationale** | Local-first slice уже имеет user-scoped key, versioning, migration consent, draft/final и видимый локальный History block. Документы прямо запрещают считать это cloud source или полной историей аккаунта.[1][2][4] |
| **User risk** | Потеря данных при очистке браузера/смене устройства и неверное ожидание восстановления. Это должно быть прямо сказано до/при сохранении; нельзя обещать backup. |
| **Technical dependency** | Storage failure handling, migration UX, отсутствие текста в telemetry; cloud не требуется. |
| **Owner decision required** | Подтвердить release promise: «Записи доступны только на этом устройстве и в этом профиле; cross-device recovery сейчас не обещается». |
| **Measurable acceptance signal** | 100% локальных операций показывают корректный статус; при недоступном storage пользователь не может пройти дальше с ложным «сохранено»; в UX smoke проверены повторный вход, legacy migration и keyboard/safe area. |

### Решение 3 — какие данные требуют отдельного consent

**Recommended option.** Разделить **сохранение** и **передачу/новую цель обработки**. Journal text по умолчанию можно хранить локально как draft/final, но передавать полный или выбранный текст в AI или cloud нужно только после отдельного, конкретного и отзывного consent. Check-in уже имеет отдельный AI-context control; это нельзя автоматически расширять на Journal.[2][5]

| Данные/действие | Default | Отдельный consent |
|---|---|---|
| `idea`, `action`, `analysis`, `newStep`, free write | local-only draft/final | Да, перед AI или cloud sync |
| Check-in metrics/text | текущий заявленный сценарий | Да, если появляется новая цель обработки |
| Выбранный фрагмент Journal + persona/prompt context | не отправлять | Всегда явное подтверждение с disclosure |
| Фото, видео, аудио и иные attachments | не включать | Да, после отдельного storage/privacy contract |
| Account identity/signed auth | только ownership/auth | Не отдельный для базовой работы, но нужен notice |
| Technical telemetry | минимум, без текста Journal | opt-out/настройка для non-essential telemetry |

**Rejected alternatives.** Общая галочка «согласен со всем»; бессрочное согласие на весь будущий Journal; AI-анализ при открытии Journal; отправка полного дневника; reminders/insights по содержанию без notice.

**Rationale.** Privacy draft определяет Journal content как личное содержимое и запрещает его передачу в AI/backend/analytics/Telegram без отдельного действия. AI disclosure должен показывать, какой текст, какой провайдер, цель, retention и последствия отказа.[5]

**User risk.** Случайная передача чувствительного текста, ложное ощущение private/local режима или невозможность честно отозвать уже переданные данные.

**Technical dependency.** Реальный provider/backend inventory, consent state/ledger, disclosure versioning, revocation semantics, отсутствие текста в logs/analytics, фактический export/delete.

**Owner decision required.** Выбрать scope consent: на каждую запись, на сессию или иной явно описанный scope; определить, нужен ли cloud opt-in или opt-out; утвердить юридическую и safety-проверку disclosure.

**Measurable acceptance signal.** Без consent нет network payload с Journal text; UI показывает точный выбранный текст и destination до отправки; revoke блокирует новые AI requests; automated tests подтверждают отсутствие Journal text в telemetry.

### Решение 4 — backend/storage вопросы до cloud implementation

**Recommended option.** Сначала закрыть короткий signed backend/storage contract review, затем делать только read/write slice с явным sync status. Следующие пункты являются **обязательными gates**, а не предположениями о `mentalix-bot`:

| Gate | Что должно быть подтверждено |
|---|---|
| Identity/ownership | Авторизация по проверенному Telegram initData, user ownership, запрет доступа по одному `user_id` из URL. |
| Schema | Финальные `entry_id`, entry type/source, `schema_version`, timestamps, draft/final semantics и совместимость с существующими check-in/activity доменами. |
| Idempotency | Upsert/retry policy; защита от двойного submit и повторной доставки. |
| Date/timezone | Canonical calendar day или timestamp + подтверждённая timezone policy; не третья копия browser `getTimezoneOffset()`. |
| Sync/conflict | Local-only → pending → synced/error/conflict states; policy для local newer/cloud newer и явного merge/conflict UI. |
| Offline/retry | Поведение offline, очередь, retry, duplicate protection и что видит пользователь. |
| Pagination/read model | Newest-first, page limits, partial failure, bounded payload; не загружать полный текст всех дней заранее. |
| Privacy/retention | Где хранятся local/cloud/cache/log/AI данные, срок retention, export scope, delete scope и legal/security exceptions. |
| Consent | AI/cloud consent model, disclosure version, scope, accepted/declined/revoked, provider and training policy. |
| Operations | Backup/restore, incident response, deletion verification и observability без Journal text. |

**Rejected alternatives.** Выводить backend contract из frontend API; считать существующие check-in endpoints подходящими для Journal; использовать client `user_id` как авторизацию; объявлять cloud «готовым» после появления одного endpoint.

**Rationale.** Архитектурные документы прямо называют эти вопросы contract gate и отмечают, что backend в текущем аудите не проверялся.[3][4]

**User risk.** Утечка между аккаунтами/устройствами, неверная дата, потеря или дублирование записей, невозможность удалить или экспортировать данные.

**Technical dependency.** Отдельный review владельца и backend-владельца; затем frontend integration PR. Сейчас этот dependency не закрыт.

**Owner decision required.** Утвердить порядок gates и минимальный cloud scope: sync только final entries или также drafts; cloud opt-in или иной режим; нужен ли export/delete в первой cloud-версии.

**Measurable acceptance signal.** Contract tests покрывают ownership, retry/idempotency, timezone, conflict, partial failure, delete/export и отсутствие текста в telemetry; ручной Telegram/iPhone test подтверждает межустройственную семантику без user leakage.

### Решение 5 — что отложить и когда возвращаться

**Recommended option.** Отложить функции, которые увеличивают поверхность хранения, обработки, давления или monetization, до доказательства базовой ценности local-first Journal и закрытия соответствующих контрактов.

| Функция | Решение сейчас | Критерий возвращения |
|---|---|---|
| Tags/search/favorites | **Deferred**; требует schema/indexing и UX поиска. | Достаточная повторная локальная история и evidence, что пользователи не находят записи; сначала owner-approved local-only experiment, затем cloud implications. |
| Memories/media | **Deferred**; не включать attachments. | Подтверждены storage limits, upload/access control, malware/content handling, delete/export/retention и privacy review. |
| Reminders | **Deferred**; не добавлять scheduler/cadence. | Подтверждены opt-in, quiet hours, mute/opt-out, frequency cap, timezone, scheduler ownership и safety copy; не использовать content-based pressure. |
| Payment | **Deferred**; не строить checkout/paywall и не монетизировать streak. | Только после evidence повторяемого outcome, owner-approved value proposition, privacy-safe concept test и отдельного payment/backend contract. PR #306 — research-only menu, не решение.[7] |
| Paid insights | **Deferred**; не ставить paywall на текущие descriptive insights. | Сначала измерить perceived usefulness/return intent текущего бесплатного descriptive слоя; затем доказать новую ценность без diagnostic/therapeutic claims и без ухудшения бесплатного baseline. PR #303 — discovery-only.[6] |
| AI-deepen/guided reflection | **Deferred** для Journal v1. | Отдельный AI consent, provider/retention disclosure, safety review, bounded session и ручной gate; не называть терапией и не делать тревожных/диагностических выводов. |

**Rejected alternatives.** «Сначала монетизация, потом ценность»; streak/paywall как retention hook; платные диагнозы/pattern claims; media как default capture; reminders по чувствительному тексту.

**User risk.** Давление на ежедневность, финансовая эксплуатация тревоги, усиление ложного авторитета AI и расширение хранения без понятного удаления.

**Owner decision required.** Зафиксировать порядок: local-first Journal → evidence → privacy/backend contract → selective experiments. Утвердить, что бесплатный baseline descriptive insights не урезается как forcing function.

**Measurable acceptance signal.** До возврата к monetization есть количественный signal completion/return/usefulness и качественный safety/consent review; отсутствуют diagnostic, causal или therapeutic claims; retention и opt-out не ухудшаются.

## Release promise

> **Mentalix Journal помогает спокойно разобрать сегодняшний опыт на четыре коротких шага и сохранить его на этом устройстве в текущем профиле.** Можно вернуться к незавершённому циклу и перечитать локальную историю; **синхронизация между устройствами и передача текста в AI сейчас не обещаются и не происходят по умолчанию**.

Этот promise честно соответствует фактическому `origin/main`: Journal Flow и локальная история уже есть, а cloud/backend/AI расширения остаются отдельными gates.[1][2][3][5]

## Вопросы владельцу: ответить одним вариантом

1. **Публичный scope:** `A — local-first Journal v1 сейчас` / `B — отложить публичный Journal до cloud sync`.
2. **Local data promise:** `A — явно «только это устройство/профиль»` / `B — другой текст, предоставить формулировку владельца`.
3. **Cloud drafts:** `A — cloud только после отдельного opt-in и только final` / `B — cloud также drafts после отдельного opt-in` / `C — cloud пока не планировать`.
4. **AI consent:** `A — каждое действие/фрагмент` / `B — сессия с явным scope и сроком` / `C — AI-deepen не входит в ближайший релиз`.
5. **Unified History:** `A — v1 оставляет local Journal отдельным блоком` / `B — v1.1 только local read-model refinement` / `C — ждать cloud contract`.
6. **Export/delete:** `A — обязательны до cloud launch` / `B — разрешить cloud только после owner-approved interim policy` / `C — cloud не запускать до готового export/delete`.
7. **Reminders:** `A — не входят в ближайший релиз` / `B — отдельный opt-in prototype после scheduler contract`.
8. **Paid value:** `A — никаких payment hooks в Journal v1/v1.1` / `B — только research/fake-door после approval` / `C — другой owner-defined experiment`.
9. **Paid insights:** `A — не монетизировать текущий free descriptive layer` / `B — исследовать новую ценность отдельно, без урезания baseline`.
10. **Safety/legal gate:** `A — owner подтверждает отдельный privacy/safety review до AI/media/cloud` / `B — предоставить иной gate и ответственного владельца`.

## References

[1]: https://github.com/Smira31/Mentalix/blob/main/src/screens/JournalFlow.jsx "JournalFlow.jsx — four-phase Journal Flow"
[2]: https://github.com/Smira31/Mentalix/blob/main/src/screens/History.jsx "History.jsx — backend feed and local Journal block"
[3]: https://github.com/Smira31/Mentalix/blob/main/src/lib/journalEntryContract.js "journalEntryContract.js — frontend-only contract helpers"
[4]: https://github.com/Smira31/Mentalix/blob/main/docs/architecture/MXL-JOURNAL-HISTORY-001_ARCHITECTURE.md "MXL-JOURNAL-HISTORY-001 architecture draft"
[5]: https://github.com/Smira31/Mentalix/blob/main/docs/product/MXL-JOURNAL-PRIVACY-001_PRIVACY_AND_AI_CONSENT_DRAFT.md "MXL-JOURNAL-PRIVACY-001 privacy and AI consent draft"
[6]: https://github.com/Smira31/Mentalix/pull/303 "PR #303 — MXL-INSIGHTS-001 discovery"
[7]: https://github.com/Smira31/Mentalix/pull/306 "PR #306 — MXL-WTP-001 discovery"
[8]: https://github.com/Smira31/Mentalix/issues/320 "Issue #320 — product strategy hypotheses"
