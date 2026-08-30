# MXL-320 — Product strategy experiment brief

Этот brief превращает четыре гипотезы Mentalix в проверяемый порядок экспериментов. Он не утверждает, что какая-либо гипотеза доказана, и не меняет production UI, paywall, API или AI-персон.

## Decision frame

| Hypothesis | User problem | Smallest test | Primary signal | Guardrail |
| --- | --- | --- | --- | --- |
| **H1: one clear next action** | После входа непонятно, что делать первым. | Existing Today/Journal prototype with one primary CTA versus current composition. | Time to first meaningful action; completion of first action. | Не увеличивать time-in-app и не скрывать secondary escape paths. |
| **H2: problem-led practices** | Каталог практик перекладывает выбор и объяснение на пользователя. | Four existing practices with problem framing and measurable finish. | Selection confidence; practice completion; reported clarity. | No medical claims, penalty or forced streak. |
| **H3: descriptive pattern insights** | Пользователь может не понимать пользу накопленной истории. | Low-sample-safe prototype with 2–3 descriptive observations. | Perceived usefulness; return intent; correction rate. | No diagnosis, causality, or insight below sample/provenance guard. |
| **H4: contextual AI deepen** | Иногда нужен более глубокий разбор, но не постоянный chat surface. | Explicit opt-in after a completed check-in or practice. | Opt-in rate; useful/not-useful rating; next-action creation. | Consent, retention, export/delete and safety boundaries are explicit. |

## Experiment order

1. Проверить **H1** на существующем daily loop: это самая маленькая гипотеза и она не требует нового backend-контракта.
2. Проверить **H2** на уже существующих практиках, используя контракт `docs/research/MXL-296_PROBLEM_LED_PRACTICE_CONTRACT.md`.
3. Проверить **H3** только на обезличенных или синтетических fixture-данных до завершения Journal history/date provenance contracts.
4. Проверить **H4** после отдельного consent/privacy review; не включать persistent memory или автоматическое профилирование.

Эксперименты идут последовательно, потому что смешивание нескольких изменений не позволяет объяснить, что вызвало результат. Каждый тест имеет одну control condition, одну variant condition и заранее определённый stop rule.

## Measurement contract

| Metric | Definition | Minimum evidence | Interpretation |
| --- | --- | --- | --- |
| First meaningful action | Пользователь создал или завершил один наблюдаемый next action после entry. | Event pair or moderated observation. | Не считать просмотр экрана действием. |
| Selection confidence | Ответ пользователя на вопрос «понимаешь ли ты, зачем это предложение?». | Short post-task rating plus quote. | Не заменяет completion evidence. |
| Perceived usefulness | Пользователь указал, помог ли output сделать следующий шаг. | 5-point rating and free-text reason. | Разделять usefulness от enjoyment. |
| Return intent | Пользователь назвал конкретную причину вернуться. | Intent question plus scheduled follow-up where possible. | Не трактовать как фактический retention. |
| Trust objection | Сомнение о данных, AI, pressure, privacy or claim. | Coded qualitative notes. | Любой unresolved safety objection blocks rollout. |

## Stop rules and safeguards

Тест останавливается, если участники воспринимают рекомендацию как диагноз или обязательство, не могут найти способ пропустить/удалить результат, видят обещание хранения данных без подтверждённого контракта или не различают variant и control. Для AI-ветки отдельно останавливаем тест при кризисном сообщении, запросе медицинской диагностики или попытке выдать гипотезу за установленную причину.

Не следует объявлять победителя по одному convenience sample, vanity metric или самопрезентации участника. До любого решения о rollout нужен краткий evidence note: выборка, условия, исключения, цитаты, guardrails и unresolved questions.

## Decision record template

```markdown
### Experiment: [H1/H2/H3/H4]
- Control:
- Variant:
- Participants or fixture source:
- Primary signal:
- Guardrail results:
- Evidence:
- Decision: continue / revise / stop
- Open owner decision:
```

## Result

Исходный результат задачи — не выбор единственной гипотезы, а воспроизводимый порядок проверки: сначала ясность первого действия, затем problem-led practices, затем осторожные insights и только после явного consent — AI deepen. Это оставляет владельцу право принять product decision на основании evidence, не превращая research brief в скрытое решение.
