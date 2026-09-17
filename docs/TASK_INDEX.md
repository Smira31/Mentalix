---
status: current
last_verified: 2026-09-16
---

# Mentalix — активный task index

Этот файл — единственный активный backlog. GitHub Issue/PR являются первичными карточками работы; этот индекс задаёт только порядок и границы. `TASKS.md` и `CHANGES.md` не являются backlog.

## Каноническая очередь

| Порядок | Трек                                                                                                | Состояние                    | Следующий gate                                                                        |
| ------: | --------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
|       1 | [Issue #623](https://github.com/Smira31/Mentalix/issues/623) — Today Hero pixel contract            | Активная визуальная задача   | Сверить реализацию с видео-референсом и провести owner Telegram/iPhone gate           |
|       2 | [Issue #620](https://github.com/Smira31/Mentalix/issues/620) — Daily Check-In + Practices contract  | Активная reference-задача    | Зафиксировать измеримый контракт и границы реализации до изменения Production         |
|       3 | [Issue #618](https://github.com/Smira31/Mentalix/issues/618) — Demo Preview по PNG-референсам       | Активная Demo Preview задача | Подготовить exact-SHA Cloudflare Demo и получить owner Telegram/iPhone PASS             |
|       4 | [Issue #615](https://github.com/Smira31/Mentalix/issues/615) — guest onboarding и deferred web auth | Активная продуктовая задача  | Проверить scope Issue, auth-сценарии и обязательные web/Telegram gates                 |
|       5 | [Issue #612](https://github.com/Smira31/Mentalix/issues/612) — мониторинг Progress                  | Post-release наблюдение      | Записать evidence; закрывать только по отдельному решению владельца                     |

## Операционные gates

Эти карточки не являются новыми продуктовым backlog-треками, но должны оставаться видимыми рядом с очередью, пока не закрыты:

| Issue | Назначение | Следующий gate |
| ---: | --- | --- |
| [#631](https://github.com/Smira31/Mentalix/issues/631) | Keyboard и нижний CTA в Guided Writing | Owner iPhone/Telegram QA для PR #642 |
| [#644](https://github.com/Smira31/Mentalix/issues/644) | Очистка неиспользуемых GitHub environments | Проверка владельцем старых production/preview secrets и deployments |

## Отложено

|                                                  Issue | Причина                                                                   |
| -----------------------------------------------------: | ------------------------------------------------------------------------- |
| [#600](https://github.com/Smira31/Mentalix/issues/600) | Координационный evaluator–optimizer трек; не заменяет продуктовую очередь |
| [#582](https://github.com/Smira31/Mentalix/issues/582) | Preview-only Library UI Lab; не начинать production-монетизацию           |
| [#516](https://github.com/Smira31/Mentalix/issues/516) | Preview-only illustration system                                          |
| [#480](https://github.com/Smira31/Mentalix/issues/480) | Backend-dependent AI handoff                                              |

## Закрытые текущие треки

Dialog role flow по Issue #515 выполнен и опубликован из `main` через PR #613. PR #608 и #609 закрыты, их ветки удалены. Новую работу по Dialog не начинать без новой Issue и отдельного owner-решения.

## Автономная очередь

Сейчас очередь `autonomous` пуста. Новая автономная задача появляется только после явной записи с однозначным scope и owner-решением.

## Правила готовности

**Ready:** определены цель, scope, то, что не меняется, проверки, rollback и manual gate. **Done:** проверки зелёные, evidence сохранён, а обязательный manual gate пройден. Production публикуется только из `main`.

## Product decision register

| Тема             | Решение                                                       |
| ---------------- | ------------------------------------------------------------- |
| Navigation       | Пять основных разделов; Today — главный вход.                 |
| Dialog           | Role flow выполнен; новые изменения только через новую Issue. |
| Product priority | Очередь определяется открытыми Issues #623, #620, #618, #615 и #612. |
| Production       | Публикация только из защищённого `main`.                      |
| Manual gate      | iPhone/Telegram проверка обязательна перед product release.   |

## References

[1]: https://github.com/Smira31/Mentalix/pulls 'Открытые pull requests Mentalix'
[2]: https://github.com/Smira31/Mentalix/issues 'Открытые issues Mentalix'
