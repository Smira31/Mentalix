# Journal follow-up: тесты, миграция и юридический review

**Статус:** рабочий материал для PR #224, MXL-JOURNAL-HISTORY-001 и MXL-JOURNAL-PRIVACY-001. Тест-кейсы можно автоматизировать; migration и legal sections являются проектными drafts и не заменяют backend или юридическое решение.

## 1. Автоматизируемые тест-кейсы local-first journal draft

### 1.1 Test harness

Тесты должны запускать `JournalHome` с контролируемым `localStorage`, стабильной датой и mock platform adapter. Нельзя использовать реальные Telegram API, production backend или данные пользователя. Каждый тест должен очищать `mx-journal-v2` и legacy `mx-journal-prototype-v1` перед стартом. Для UI-тестов нужны viewport 390×844 и 320×568; для unit-тестов достаточно DOM harness с контролем поля и кнопок.

### 1.2 Основной набор

| ID | Сценарий | Действия | Ожидаемый результат | Тип |
|---|---|---|---|---|
| JD-001 | Чистый старт | Очистить оба storage key, открыть Journal Home | Отображается первый шаг «Идея», пустое поле, CTA disabled | Unit/UI |
| JD-002 | Draft при вводе | Ввести текст в «Идея», не нажимать CTA, перечитать storage | Текст присутствует в `cycle.idea.text`, статус `draft` | Unit |
| JD-003 | Переход вперёд | Ввести непустой текст, нажать «Продолжить» | Открывается «Действие», текст идеи не изменился | UI |
| JD-004 | Back без потери | Заполнить «Идея» и «Действие», вернуться на «Идею» | Оба текста сохранены, активна выбранная фаза | UI |
| JD-005 | Четыре фазы | Заполнить все четыре фазы по очереди | Каждая запись лежит в своём ключе; нет перезаписи соседней фазы | Unit/UI |
| JD-006 | Финализация | На «Новом шаге» ввести текст и нажать финальную CTA | `cycle.newStep.status === 'final'`, текст доступен при повторном чтении | Unit/UI |
| JD-007 | Пустая CTA | Оставить поле пустым и нажать «Продолжить» | Перехода нет, исключения нет, storage не получает ложный final | UI |
| JD-008 | Перезапуск WebView | Заполнить draft, размонтировать компонент, смонтировать снова | Draft восстановлен; приложение не показывает cloud-saved без cloud source | Integration/UI |
| JD-009 | Legacy migration | Записать старый `mx-journal-prototype-v1` с `date` и `drafts`, открыть экран | Данные перенесены в v2, фазы сопоставлены, текст не потерян | Unit |
| JD-010 | Повторная migration | Прочитать migrated store дважды | Данные не дублируются и не перезаписываются пустым значением | Unit |
| JD-011 | Повреждённый JSON | Записать невалидный JSON в v2 и legacy key | Открывается пустой безопасный entry; UI не падает | Unit |
| JD-012 | Неполная схема | Записать object без `entries`, `cycle` или с неизвестными полями | Нормализатор возвращает безопасные defaults и сохраняет известные данные | Unit |
| JD-013 | Неверная фаза | Вызвать `saveJournalPhase` с неизвестным phase | Получено контролируемое исключение; существующий storage не повреждён | Unit |
| JD-014 | Невалидные типы | Передать нестроковый text/status и странный updatedAt | Text нормализуется безопасно, status ограничен `draft/final` | Unit |
| JD-015 | Ошибка quota | Mock `setItem` с `QuotaExceededError` | Экран остаётся usable; ошибка не превращается в потерю текущего React state | Unit/UI |
| JD-016 | Локальная дата | Подменить timezone/границу полуночи | Ключ дня соответствует согласованной local-time policy, запись не прыгает между днями | Unit |
| JD-017 | Спецсимволы | Ввести Markdown, переносы, кавычки и длинный текст | Текст читается после round-trip JSON, HTML не исполняется | Unit/UI |
| JD-018 | Двойное нажатие | Быстро нажать CTA несколько раз | Нет двойного перехода, дублей или повреждения phase state | UI |
| JD-019 | Независимость backend | Отключить fetch/network mock | Local draft открывается без ложного API error и без обращения к backend | Integration |
| JD-020 | Очистка | Сохранить entry, вызвать `clearJournalStore`, перечитать | v2 удалён; следующий запуск создаёт пустой безопасный store | Unit |

### 1.3 CI-критерии

Минимальный обязательный набор для PR #224 — JD-001–JD-009, JD-011, JD-015, JD-017 и JD-019. Для PR #232 и дальнейшего History — весь набор JD-001–JD-020. В CI нельзя считать успешным тест, который проверяет только наличие ключа: нужно проверять round-trip текста, фазу, статус и восстановление после remount.

## 2. План миграции local storage к cloud sync

### Этап 0 — инвентаризация и freeze

Зафиксировать версии `mx-journal-prototype-v1` и `mx-journal-v2`, все поля, legacy keys, максимальный размер записи и timezone policy. На этом этапе не менять данные и не удалять legacy key. Добавить migration telemetry только в обезличенном виде: версия мигратора, результат и код ошибки, без journal text.

### Этап 1 — подтверждение серверного контракта

До кода согласовать с backend владельцем candidate contract: ownership по Telegram initData, идентификатор записи, date/timezone, phase keys, draft/final semantics, `createdAt`/`updatedAt`, idempotency key, pagination, delete/export, retention, error codes и conflict policy. Пока contract не подтверждён, cloud sync не включать.

### Этап 2 — локальная нормализация

Прочитать v2, прогнать нормализатор, удалить неизвестные поля из отправляемого payload, присвоить стабильный client entry id и сохранить migration marker. Legacy migration должна быть идемпотентной: повторный запуск не создаёт новую запись и не затирает более свежий draft.

### Этап 3 — dry-run reconciliation

Сравнить локальные entries с cloud records только по метаданным и hashes, если backend это поддерживает. Для каждого entry классифицировать состояние: `local-only`, `cloud-only`, `equal`, `local-newer`, `cloud-newer`, `conflict`, `invalid`. Не удалять local data и не отправлять текст при dry-run.

### Этап 4 — opt-in upload

Первый cloud sync должен быть явным opt-in после disclosure. Отправлять минимальный payload, батчировать по ограниченному числу записей и использовать idempotency key. UI показывает отдельные состояния «подготовлено», «синхронизировано», «частично синхронизировано», «ошибка»; надпись «сохранено» не должна означать cloud success без ответа сервера.

### Этап 5 — conflict resolution

Если local draft и cloud final расходятся, не выбирать сторону молча. Показать пользователю дату изменений, источник и безопасные действия: оставить локальную версию, оставить cloud-версию или сохранить обе как отдельные revisions, если это поддерживает backend. До решения конфликтная запись не должна считаться синхронизированной.

### Этап 6 — cutover и legacy retention

После успешной выборочной миграции включить cloud read-after-write для opt-in пользователей. Legacy key хранить в read-only grace period до подтверждения cloud round-trip и возможности rollback. Удаление legacy storage выполнять только отдельным действием/политикой, после export/delete review и с понятным recovery поведением.

### Этап 7 — rollback

При росте ошибок отключить cloud writes feature flag, оставить локальное чтение v2 и показать pending sync без потери текста. Не откатывать schema destructive-операцией. Сохранить диагностический код ошибки без содержимого записи и дать пользователю возможность повторить sync позже.

## 3. Критические юридические вопросы для review

> Этот список предназначен для юриста; он не является юридическим заключением. Юрист должен проверить фактические юрисдикции, договоры и инфраструктуру Mentalix.

### Роли и применимое право

1. Кто является data controller/обработчиком для Telegram identity, check-in и journal content?
2. Какие юрисдикции и категории пользователей охватываются продуктом?
3. Какие age limits, parental consent и правила для несовершеннолетних применяются?
4. Есть ли особые требования к данным о здоровье, психическом состоянии, религии, сексуальности или кризисных сообщениях?
5. Является ли Mentalix wellness/reflection tool или может его copy создать impression medical/therapy service?

### Основание и прозрачность

6. Какое правовое основание используется отдельно для core storage, cloud sync, AI-deepen, analytics, reminders и export/delete?
7. Достаточно ли notice, или требуется explicit consent для каждой цели?
8. Как зафиксировать версию disclosure, timestamp, scope, channel и отзыв согласия?
9. Как пользователь узнает, что запись local-only, cloud-synced, pending или failed?
10. Нужно ли поддерживать несколько языков policy и disclosure для целевых рынков?

### AI и третьи стороны

11. Какой фактический AI provider получает выбранный текст, в какой стране обрабатывает данные и на каком основании?
12. Использует ли provider prompts/responses для обучения, safety review, abuse detection или иных целей?
13. Каков точный retention period для request, response, logs, backups и human review?
14. Можно ли гарантировать удаление provider-side данных после отзыва или delete request?
15. Кто отвечает за subprocessors, international transfers, DPA/SCC и уведомление об их изменении?
16. Является ли AI output automated decision-making или profiling, требующим дополнительного disclosure/rights?
17. Как исключить отправку всего дневника, draft, Telegram initData и лишних полей вместо выбранного пользователем фрагмента?

### Права пользователя и lifecycle

18. Как реализуются access, correction, portability, restriction, objection и deletion requests?
19. Что именно удаляется при delete: local storage, cloud rows, caches, backups, logs, AI provider copies и exports?
20. Какие данные могут законно остаться после удаления и как это объясняется пользователю?
21. Как обрабатываются local/cloud conflicts, duplicate accounts и смена Telegram identity?
22. Какой retention period нужен для draft, final entry, audit record, consent ledger и security logs?
23. Требуется ли data export до удаления и в каком формате?

### Безопасность и breach response

24. Как защищаются journal content при передаче, хранении, backups и support access?
25. Кто имеет административный доступ к production DB, logs и AI provider dashboard?
26. Содержат ли error reports, analytics или Vercel/Render logs текст записи или идентификаторы пользователя?
27. Каков incident/breach response plan, сроки уведомления и перечень ответственных лиц?
28. Нужны ли DPIA/PIA, records of processing activities и vendor security reviews?

### Product safety

29. Какие формулировки запрещены, чтобы не создавать diagnosis, treatment или guaranteed-effect claims?
30. Какой crisis/safety flow разрешён и какие ограничения есть у Mentalix как не-кризисного сервиса?
31. Можно ли строить insights или reminders из journal content, и какое отдельное основание для этого требуется?
32. Как пользователь отключает AI, insights, reminders и non-essential telemetry независимо друг от друга?
33. Кто утверждает финальный copy, incident escalation и release gate перед production?

## 4. Решения, которые нельзя считать закрытыми этим документом

Этот материал не подтверждает legal basis, controller/processor roles, age regime, AI provider retention, cross-border transfer, cloud schema, export/delete guarantee, encryption claims или medical/wellness classification. До ответа юриста и backend владельца эти пункты должны оставаться `needs-owner`/`backend-dependent`.
