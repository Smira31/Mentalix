# MXL-435 — пять направлений редизайна пикера персон: ADR и LLM Council

**Статус:** proposed; no implementation authorized  
**Тип:** docs-only decision-prep  
**Связанный research:** [`MENTOR_PERSONA_PICKER_REDESIGN_DIRECTIONS.md`](../research/MENTOR_PERSONA_PICKER_REDESIGN_DIRECTIONS.md)

## Decision context

`PersonaPicker.jsx` уже использует горизонтальный нативный snap-скролл, верхнюю `SemanticGlyph`-зону, имя/подпись/описание персоны, starter-кнопки или «Говорить»/«Продолжить разговор» и общий dot-пагинатор. Поэтому вопросом является не изобретение новой навигации, а выбор смысловой модели первого знакомства с тремя персонами.

Рассмотрены пять направлений:

1. **«Наставник как один следующий обратимый шаг»** — действие без давления.
2. **«Проверяемое обещание роли»** — ясное отличие персон по наблюдаемому результату первого разговора.
3. **«Мягкое знакомство через starter-сценарий»** — низкопороговое начало с возможностью пропустить.
4. **«Контекст под контролем пользователя»** — прозрачная граница продолжения, начала заново и памяти.
5. **«Безопасный выбор по состоянию, а не по личности»** — выбор формы разговора по текущей задаче, а не ярлыку человека.

Stoic Explore используется только как структурный референс: образ, подпись, вопрос, CTA, горизонтальная карточка и пагинация. Иллюстрация Stoic не копируется. Mentalix сохраняет собственный `SemanticGlyph`, тёмную тему и семантику gold/azure [1] [2].

Этот ADR не изменяет `src/`, `backend`, API-контракты, persona в production и открытый PR #565. Тексты `kompas` на `origin/main` считаются baseline; PR #565 не является источником решения [3].

## LLM Council: независимые перспективы

### Skeptic — риски и failure modes

Skeptic считает направление 1 наиболее полезным для core loop, но видит риск давления в слове «шаг». Направление 2 может превратить выбор в обещание гарантированного результата. Направление 3 создаёт companion-ожидание и может незаметно расширить личное раскрытие. Направление 4 полезно для privacy, но опасно, если интерфейс обещает memory-control, которого нет в backend-контракте. Направление 5 снижает риск identity-label, однако state-based выбор может быть трудным в момент перегруза.

Критерий Skeptic: любой вариант должен иметь один обратимый CTA, короткую границу возможностей AI, отсутствие диагностического языка и отдельный safety review для 16–17 лет. Все claims о памяти должны быть либо session-local, либо отложены до подтверждённого контракта.

### Fact-checker — подтверждённое и предположительное

Fact-checker подтверждает, что Character.AI использует role/character discovery и публикует отдельные меры для подростков; это подтверждает полезность role clarity и возрастного gate, но не доказывает конверсию конкретной раскладки [4] [5]. Poe подтверждает настройки контекста, Memory с opt-in, просмотром и удалением, а также temporary chat; это подтверждает паттерн явных границ, но не разрешает переносить такой contract в Mentalix [6]. Replika подтверждает видимый и ручной слой Memory; это подтверждает ценность исправления контекста, но не companion framing [7]. Inflection подтверждает отдельный safety-процесс, оценки и red-teaming; это подтверждает необходимость gate, но не даёт готового Mentalix-потока [8].

Fact-checker считает подтверждёнными факты о текущем `PersonaPicker.jsx`, `kompas` и дизайн-системе репозитория. Предположениями остаются предпочтение пользователей, влияние каждого варианта на completion и то, что «state-based» выбор будет понятнее role-based выбора.

### Visionary — потенциал

Visionary видит сильную комбинацию направлений 1, 2 и 5: карточка может одновременно сказать, **кто помогает**, **с чем помогает сейчас** и **какой маленький результат ожидается после первого сообщения**. Направление 3 способно снизить страх пустого чата. Направление 4 открывает долгосрочную персонализацию, но только как будущий слой после privacy contract.

Visionary не рекомендует превращать picker в каталог функций. Главный потенциал — в ясном переходе от образа к вопросу и от вопроса к одному reversible next action.

### Outsider — взгляд человека без контекста индустрии

Outsider ожидает, что человек без контекста быстро ответит на три вопроса: «кто это?», «что я могу написать?» и «что будет после нажатия?». Направление 2 лучше всего отвечает на первый вопрос. Направление 3 — на второй. Направление 1 — на третий. Направление 4 может быть непонятным без пояснения, а направление 5 требует очень простого языка, иначе «состояние» станет ещё одной абстракцией.

Outsider предупреждает: слова «Наставник», «строгий», «паттерны» могут звучать как оценка человека. Безопаснее описывать действие и текущую задачу, а не постоянную черту пользователя.

### Executor — реализуемость без нового backend

Executor оценивает направление 1 как самое реализуемое: достаточно content/UI Lab гипотезы поверх существующих `name/tagline/desc/question/starters`, без API-изменений. Направление 2 также реализуемо в статическом контенте. Направление 3 требует только session-local состояния, если feedback не сохраняется. Направление 4 нельзя расширять до persistent memory, temporary chat или delete/export без backend/privacy решения. Направление 5 реализуемо как copy variant, но его safety coverage для 16–17 требует отдельной проверки.

Executor рекомендует не менять touch-механику, не вводить второй пагинатор, не добавлять новый top-level navigation и не трогать `Conversation.jsx` в первом scope.

## Cross-critique и конвергенция

Skeptic оспаривает Visionary: комбинация трёх promise-слоёв может перегрузить карточку. Outsider подтверждает опасность перегруза и просит оставить один видимый CTA. Fact-checker оспаривает перенос memory-паттернов из Poe/Replika: подтверждение чужого паттерна не является подтверждением Mentalix-контракта. Executor оспаривает направление 4 как первый scope из-за отсутствующего backend/privacy contract. Visionary отвечает, что направление 4 следует оставить как future hypothesis, а не смешивать с первым UI Lab.

Конвергенция Council: рекомендован ограниченный гибрид **направления 1 и направления 2**, с safety-ограничениями и формулировками из направления 5. Направление 3 оставить как отдельный экспериментальный вариант для сравнения. Направление 4 не входит в bounded first scope и может быть рассмотрено только после privacy decision.

## Pre-mortem: предположим, что рекомендованный вариант провалился

| Failure mode | Early warning | Prevention / kill rule |
|---|---|---|
| «Один шаг» воспринимается как давление или оценка дисциплины | Пользователи выбирают роль, но не начинают разговор; в feedback появляются слова «надо», «должен», «меня оценивают» | Переписать на «попробовать», «если подходит» и добавить заметный выход; остановить вариант при росте отказов у 16–17 |
| Promise не совпадает с первым ответом AI | Пользователь не может объяснить, чем «Наставник» отличается; ответ уходит в общий совет | Content/AI gate на примерах первого ответа; reject при отсутствии трассировки promise → response |
| State-based safety-copy создаёт ложное ожидание помощи | Пользователь трактует карточку как терапию, диагностику или emergency response | Нейтральная граница AI; запрет claims; отдельная проверка sensitive и youth сценариев |
| Карточка перегружается направлениями и CTA | Пользователь не замечает главный CTA или путает starter с выбором новой persona | Оставить один primary CTA, максимум два starter-а, один пагинатор; kill rule по comprehension |
| Референс Stoic превращается в визуальную копию | В макете появляются два силуэта, лупа, брендовые тексты или фирменный Explore chrome | Asset review: только оригинальный SemanticGlyph и текущие токены; отклонять чужую иллюстрацию |
| «Продолжить разговор» обещает memory, которой нет | Пользователь ожидает постоянный профиль или исправление сохранённого факта | В первом scope говорить только о фактическом `last`/текущем разговоре; persistent memory вынести в отдельный ADR |
| У 16–17 лет starter приводит к чувствительному раскрытию | Starter провоцирует медицинские, сексуальные, self-harm или emergency disclosures | Youth safety review до UI Lab; заменить starter или остановить вариант при неясном redirect |
| Picker перестаёт вести в core loop | После выбора persona растёт число возвратов, но не начинается разговор или next action | Измерять выбор → первое сообщение → reversible next action; не добавлять вторичные entry points |

## Proposed decision

**Не реализовывать редизайн в production сейчас.** Одобрить только decision-prep и, после отдельного решения владельца, ограниченный UI Lab prototype рекомендованного гибрида «обратимый следующий шаг + проверяемое обещание роли». Направление 5 используется как safety-язык, но не как отдельная новая навигация. Направление 3 может быть контрольным вариантом. Направление 4 остаётся отложенной privacy-гипотезой.

### Bounded first scope после авторизации владельца

1. Подготовить в UI Lab два статических варианта карточки для трёх существующих персон: рекомендованный гибрид и контрольный вариант направления 3.
2. Сохранить текущий нативный snap-скролл, `SemanticGlyph`-зону, один dot-пагинатор и touch-friendly controls.
3. Использовать только session-local выбор; не добавлять persistent memory, новый endpoint, storage или API-поле.
4. Для «Наставника» заменить язык строгости на проверяемое, обратимое действие только в отдельном прототипе после owner approval; production `personas.js` не менять этим ADR.
5. Провести comprehension, safety и accessibility review; ручной Telegram/iPhone gate остаётся обязательным перед любым решением о переносе.

## Acceptance gates before implementation

| Gate | Required evidence | Owner decision |
|---|---|---|
| Product fit | Пользователь своими словами объясняет различие трёх ролей и следующий шаг; picker не конкурирует с Today/Journal | approve / reject |
| Safety | Review для 16–17, sensitive disclosures, non-diagnostic language, не-терапевтическая позиция и emergency boundary | approve / reject |
| Privacy | Ясно указано, что первый scope session-local; для продолжения, Memory, delete/export и retention есть подтверждённый контракт | approve / reject |
| Core loop | Есть измеримый переход picker → первое сообщение → один обратимый next action; нет новых равногромких entry points | approve / reject |
| Content | Promise каждой persona симметричен, не содержит давления, prediction, diagnosis или identity claims; оригинальный art review пройден | approve / reject |
| AI | Для каждого promise есть проверяемые примеры ответа, provenance/границы контекста, refusal и redirect для safety-сценариев; либо AI gate отклонён | approve / reject |

## Non-goals

Этот ADR:

- не авторизует имплементацию в `src/` и не меняет production UI;
- не меняет `src/screens/mentalix/personas.js`, `Conversation.jsx` или AI prompt/endpoint;
- не меняет backend/API/storage contracts и не изобретает новый контракт;
- не создаёт persistent profile, Memory, analytics expansion, payment или новую вкладку;
- не принимает решение по PR #565 и не использует его тексты как baseline;
- не копирует иллюстрацию Stoic, его брендовый UI, лупу или Explore navigation;
- не заявляет, что Mentalix является терапией, диагностикой или emergency response;
- не заменяет owner decision gate ручным desktop/UI Lab preview;
- не меняет `docs/TASK_INDEX.md` или `PROJECT_STATE.md` в рамках этого узкого PR.

## References

[1]: https://github.com/Smira31/Mentalix/blob/main/DESIGN_SYSTEM.md "Mentalix Design System"
[2]: https://github.com/Smira31/Mentalix/blob/main/docs/product/STOIC_TO_MENTALIX_AUDIT.md "Stoic to Mentalix product and design audit"
[3]: https://github.com/Smira31/Mentalix/pull/565 "PR #565: MVP «Наставник»"
[4]: https://support.character.ai/hc/en-us/articles/42645561782555-Important-Changes-for-Teens-on-Character-ai "Important Changes for Teens on Character.AI"
[5]: https://character.ai/safety "Character.AI Safety Center"
[6]: https://help.poe.com/hc/en-us/articles/19944206309524-Poe-FAQs "Poe FAQs"
[7]: https://help.replika.com/hc/en-us/articles/37208679176077-How-does-Replika-s-memory-work "How does Replika’s memory work?"
[8]: https://inflection.ai/safety "Inflection AI safety"
