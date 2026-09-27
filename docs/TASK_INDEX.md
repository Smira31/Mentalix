---
status: current
last_verified: 2026-09-27
---

# Mentalix — активный task index

Сверено с [открытыми Issues](https://github.com/Smira31/Mentalix/issues?q=is%3Aissue+is%3Aopen) и PR GitHub на 27.09.2026, `main` `767a3b55`. Issue/PR — первичный scope; наличие открытой Issue не означает разрешения начать реализацию. `TASKS.md` и `docs/STATUS.md` не являются активным backlog.

| Issue | Состояние / граница | Следующий gate |
| --- | --- | --- |
| [#615](https://github.com/Smira31/Mentalix/issues/615) | Открыта; исходный local-only guest контракт частично вытеснен реализацией #847/#861/#863/#883 | Сверить оставшийся scope и web/PWA release gate с владельцем; не трактовать как отсутствие guest в `main` |
| [#789](https://github.com/Smira31/Mentalix/issues/789) | Открыта; вопрос локального или серверного хранения исторический, фактически выбран server-backed guest в `main` без новой записи owner-decision | Уточнить у владельца остаток scope: конфликтующие записи, ограничения AI, потеря сессии |
| [#851](https://github.com/Smira31/Mentalix/issues/851) | Открытое исследование вовлечённости, не разрешение на новую механику | Рассмотреть результаты исследования с владельцем |
| [#771](https://github.com/Smira31/Mentalix/issues/771) | Отложенная миграция Tailwind CSS 4 | План миграции и визуальный gate перед началом |
| [#683](https://github.com/Smira31/Mentalix/issues/683) | Отложенная админка и ротация «мысли дня» | Отдельное owner-решение и проверка приватного backend-контракта |
| [#582](https://github.com/Smira31/Mentalix/issues/582) | Preview-only Library UI Lab | Отдельное решение владельца о переносе в Production |
| [#516](https://github.com/Smira31/Mentalix/issues/516) | Иллюстрации и SemanticGlyph; открыта | Сверить актуальный scope с владельцем до реализации |

**Административное закрытие, не active implementation:** [#767](https://github.com/Smira31/Mentalix/issues/767) и [#766](https://github.com/Smira31/Mentalix/issues/766) всё ещё открыты, хотя SDK 8.0.2 / ESLint 10 уже в `main` через #862 / #852. Владелец должен проверить acceptance и закрыть их, если выполнены; агент не закрывает Issues самостоятельно.

Закрытые #623, #620, #618, #612, #600, #480 исключены из очереди. Новая работа начинается только после согласования scope и соответствующего manual/backend gate. Публикация — только из защищённого `main`; зелёная сборка не заменяет ручной iPhone/Telegram или Web/PWA gate.
