# Stoic × Mentalix — visual reference board

**Дата среза:** 01.09.2026
**Статус:** research input для Preview-only `MXL-TODAY-REDESIGN-001`; не product approval и не разрешение менять production.

## Границы доски

Доска собрана из публично доступных материалов Stoic, бесплатных preview-галерей, ранее проведённого UX-аудита, owner-provided recordings и текущего кода Mentalix. Закрытые экраны в галереях не считаются наблюдаемым evidence. Скриншоты Stoic не копируются в публичный репозиторий: доска фиксирует наблюдаемые паттерны, их UX-роль и Mentalix-интерпретацию.

## 1. Onboarding

**Что наблюдается в Stoic.** Длинный, но пошаговый onboarding с одним выбором на экран; ранние предпочтения затем влияют на `For You`, prompts и дневной ритм. В публичной Uiland-карте зафиксирован отдельный onboarding flow; большинство шагов после первого preview закрыто авторизацией.

**Какую UX-проблему решает.** Убирает пустой старт и сразу даёт пользователю чувство, что продукт собран под его ритм, а не просто открывает каталог.

**Что переносим как принцип.** Один ясный выбор на сцену, понятная причина вопроса, постепенная персонализация без преждевременного запроса доступов.

**Что нельзя копировать.** Порядок экранов, тексты, иллюстрации, названия «путей», paywall placement и запросы iOS-only permissions.

**Как это должно выглядеть в Mentalix.** Короткий маршрут «что сейчас мешает → какое направление важно → первый шаг». Тёмная плоская поверхность, крупный заголовок, один CTA, одна смысловая геометрия; без новой вкладки и без копии философского tone of voice.

**Visual evidence:** [Uiland — Onboarding flow](https://uiland.design/screens/stoic/screens/d210cd31-61c4-4ddd-943e-fb7b1402c2f6/flows/onboarding), [Stoic Help — Profile and preferences](https://help.getstoic.com/getting-started/nMb4jABmc8oatYuUUyT5Q5/setting-up-and-exploring-your-profile/6f9eBdDY7mPSQyUthaS2ei).

## 2. Today / Home

**Что наблюдается в Stoic.** Home является ежедневной точкой входа: сверху Daily Check-In, рядом календарный контекст, ниже дополнительные источники. Пользователь может выбрать один Daily Check-In или разделить его на Morning Preparation и Evening Reflection, а также скрыть ненужные Home-блоки.

**Какую UX-проблему решает.** Отвечает на вопрос «что мне делать сейчас?» и позволяет возвращаться в одну и ту же точку в разное время дня.

**Что переносим как принцип.** Один доминирующий шаг в текущем состоянии; вторичные блоки не должны конкурировать с ним. Одно и то же место интерфейса меняется вместе с днём, а не накапливает карточки.

**Что нельзя копировать.** Композицию Home, позицию и вид календаря, карточную сетку, иконки, greeting-copy, названия reflections и визуальную иерархию Stoic один в один.

**Как это должно выглядеть в Mentalix.** Существующая state machine `checkinPending → dayInProgress → reviewPending → dayClosed` управляет одним hero. Внутри каждого состояния — один primary CTA: «Начать чек-ин», «Начать», «Разобрать день», затем спокойный итог/завтрашний шаг. Цвета — только graphite/white/gold, иллюстрация — `SemanticGlyph`, production в первом цикле не меняется.

**Visual evidence:** [Stoic Help — Home Screen](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/home-screen/6f9eBdDY7kpekp8AYu18Xq), [App Store listing](https://apps.apple.com/us/app/stoic-journal-mental-health/id1312926037), [Google Play listing](https://play.google.com/store/apps/details?id=com.stoicroutine.stoic&hl=en_US), [Uiland — Stoic screens](https://uiland.design/screens/stoic/screens/d210cd31-61c4-4ddd-943e-fb7b1402c2f6).

## 3. Check-in

**Что наблюдается в Stoic.** Быстрый Mood Check-In может появляться при запуске; основная reflection выполняется один или два раза в день. Публичные материалы показывают малые последовательные шаги вместо одной большой формы.

**Какую UX-проблему решает.** Снижает blank-page friction и когнитивную нагрузку: человеку не нужно сразу писать свободный текст или понимать всю методику.

**Что переносим как принцип.** Один вопрос или шкала на сцену, видимый прогресс, сохранение только после явного действия, ясная связь с тем, что произойдёт дальше.

**Что нельзя копировать.** Точные prompts, набор метрик, вид шкал, порядок шагов, иконки, фоновые изображения и Stoic-терминологию.

**Как это должно выглядеть в Mentalix.** Сохранить текущие поля и backend-контракт, но визуально собрать check-in как последовательность коротких сцен. Финал должен вести к одному следующему шагу, а не к меню практик. Telegram keyboard/safe-area остаются обязательным gate.

**Visual evidence:** [Stoic Help — Daily Journaling Flow](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/daily-journaling-flow/6f9eBdDY7m4AnbXtALLGtM), [Uiland — Stoic flows](https://uiland.design/screens/stoic/screens/d210cd31-61c4-4ddd-943e-fb7b1402c2f6), [ScreensDesign — Stoic flow index](https://screensdesign.com/apps/journal-mental-health-stoic/).

## 4. Completion

**Что наблюдается в Stoic.** В journal flow есть явный completion screen и действие `Save and Finish`; tags добавляются как опциональный мета-слой, а не подменяют само завершение.

**Какую UX-проблему решает.** Даёт ясный момент закрытия и уверенность, что запись сохранена; снижает риск зациклиться на форме или на настройках после выполненной работы.

**Что переносим как принцип.** Явное подтверждение результата, один выход из flow, метаданные и secondary actions визуально подчинены завершению.

**Что нельзя копировать.** Текст поздравления, порядок действий, иконки, badge/confetti-подачу, tag UI и точную композицию финального экрана.

**Как это должно выглядеть в Mentalix.** Спокойный итог без аттракциона: «что сделано → что замечено → что будет дальше». Золото отмечает завершение или новую точку, но не заливает экран. После закрытия дня нельзя возвращать на один уровень конкурирующие «День закрыт», «День разобран» и «Открыть разбор снова».

**Visual evidence:** [Stoic Help — Daily Journaling Flow](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/daily-journaling-flow/6f9eBdDY7m4AnbXtALLGtM), [Stoic Help — Journaling and Customization](https://help.getstoic.com/faq/3sfUSwpkyPFw22e8F1CRHk/journaling-and-customization/6f9eBdDY7njMvRmxFbraod).

## 5. Practices

**Что наблюдается в Stoic.** Explore собирает `Featured`, `For You`, быстрый emotion check-in, weekly themes, library и search. В магазинах и на официальном сайте отдельно показаны guided journals, prompts, breathing, meditation и другие reflection tools.

**Какую UX-проблему решает.** Помогает найти подходящий способ начать, не зная точного названия упражнения; даёт быстрый вход и возможность исследовать глубже.

**Что переносим как принцип.** Курированный верх экрана, ясные категории, поиск, отделение «рекомендовано сейчас» от «все практики», карточка объясняет не только название, но и зачем её открывать.

**Что нельзя копировать.** Таксономию, тексты prompts, карточки, иллюстрации, сезонные темы, порядок секций и paywall-границы.

**Как это должно выглядеть в Mentalix.** Оставить текущую вкладку «Практики», ритуалы и аскезы как собственное ядро, а практики группировать по проблеме и ожидаемому действию. Две колонки, крупный белый силуэт/line-art, много воздуха и не больше одной золотой смысловой точки.

**Visual evidence:** [Stoic Help — Explore Screen](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/explore-screen/6f9eBdDY7mmGmvLJB6xkCh), [Stoic official site](https://www.getstoic.com/), [App Store screenshot gallery](https://appscreenmagic.com/gallery/app/1312926037).

## 6. Streak / recovery

**Что наблюдается в Stoic.** Серия и badges открываются из Home через fire icon. Пропущенную серию можно восстановить, выбрав прошедшую дату и закрыв пропущенную reflection. Streak и badges можно отключить.

**Какую UX-проблему решает.** Даёт мотивацию без безвозвратного наказания за пропуск и сохраняет контроль у людей, которых геймификация отвлекает.

**Что переносим как принцип.** Показывать непрерывность, а не долг; дать ограниченное и явное recovery-действие; не показывать «ноль» как поражение; дать отключение.

**Что нельзя копировать.** Fire icon, имена уровней/badges, календарную композицию, копирайтинг восстановления и пороги наград.

**Как это должно выглядеть в Mentalix.** Сохранить текущие «Серии и вехи» и restore-sheet как часть «Пути». Восстановление — не автоматическая фальсификация, а явное внесение факта за прошедшую дату. Тон — спокойный, без стыда и страха «сжечь серию».

**Visual evidence:** [Stoic Help — Daily Journaling Flow](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/daily-journaling-flow/6f9eBdDY7m4AnbXtALLGtM), [Stoic Help — Streak recovery and controls](https://help.getstoic.com/faq/3sfUSwpkyPFw22e8F1CRHk/journaling-and-customization/6f9eBdDY7njMvRmxFbraod), [Uiland — flow catalogue](https://uiland.design/screens/stoic/screens/d210cd31-61c4-4ddd-943e-fb7b1402c2f6/flows/onboarding).

## 7. Settings

**Что наблюдается в Stoic.** Profile группирует Preferences, Appearance, platform integrations, Account и data controls. Можно менять начало дня/недели, haptics/sounds, mood check on launch, notifications, storage/sync, subscription и privacy options.

**Какую UX-проблему решает.** Выносит редкие и опасные действия из ежедневного flow, но оставляет их находимыми и собирает по смыслу, а не по технической реализации.

**Что переносим как принцип.** Семантические секции, ясная текущая величина в строке, пояснение последствий, confirmation для sensitive actions, отражение изменённой настройки в связанном экране.

**Что нельзя копировать.** Секции, названия, иконки и композицию Stoic; Apple Health/Screen Time/iCloud controls, которые недоступны в Telegram Mini App; обещания storage/privacy/AI, не подтверждённые Mentalix-контрактами.

**Как это должно выглядеть в Mentalix.** Текущий Settings с округлыми плоскими секциями, спокойной иерархией текста и Telegram/web-границей. Новая Today-настройка не появляется вместе с визуальным прототипом: это отдельное product decision.

**Visual evidence:** [Stoic Help — Profile and Settings](https://help.getstoic.com/getting-started/nMb4jABmc8oatYuUUyT5Q5/setting-up-and-exploring-your-profile/6f9eBdDY7mPSQyUthaS2ei), [Stoic Help — Journaling and Customization](https://help.getstoic.com/faq/3sfUSwpkyPFw22e8F1CRHk/journaling-and-customization/6f9eBdDY7njMvRmxFbraod), [Stoic Help — Data Storage](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/data-storage-import-and-backups/6f9eBdDY7jYcoaF9t9ytqz).

## 8. Motion

**Что наблюдается в Stoic.** В доступных записях и preview движение подчинено переходу между сценами, подтверждению выбора и спокойному оживлению иллюстрации; оно не заменяет само действие. `60fps` используется как общий словарь motion-механик, но не как доказательство Stoic-specific behavior.

**Какую UX-проблему решает.** Показывает причинно-следственную связь «я выбрал → состояние изменилось», удерживает пространственный контекст и не заставляет гадать, произошло ли нажатие.

**Что переносим как принцип.** Один смысловой процесс на сцену; короткий tactile feedback; средний state transition; медленная иллюстративная фаза только там, где она объясняет глагол; статичное и читаемое `prefers-reduced-motion`-состояние.

**Что нельзя копировать.** Видео, точные траектории/easing, proprietary illustrations, характерные переходы и animation assets. Нельзя превращать motion в аттракцион или добавлять несколько независимых эффектов.

**Как это должно выглядеть в Mentalix.** Переиспользуется `SemanticGlyph`; форма отражает глагол текущего state, а один медленный pulse показывает активную часть. Допускаются только `transform`, `opacity` и `stroke`; нет layout shift, `transition: all`, синего, неона, градиента или новой SVG-системы.

**Visual evidence:** [60fps — motion pattern library](https://60fps.design/), [Uiland — Stoic flow catalogue](https://uiland.design/screens/stoic/screens/d210cd31-61c4-4ddd-943e-fb7b1402c2f6), [`MENTALIX_SEMANTIC_MOTION.md`](../../MENTALIX_SEMANTIC_MOTION.md).

## Вывод для Today prototype

Reference board не даёт оснований переносить Stoic-композицию. Она подтверждает пять принципов для Mentalix:

1. Today остаётся одной точкой входа в течение всего дня.
2. Существующая state machine, а не новая структура, управляет четырьмя сценами.
3. В каждой сцене ровно один primary CTA; остальное либо подчинено, либо отложено.
4. Закрытый день показывает один итог и перенос в завтра, а не новый список дел на сегодня.
5. Один смысловой motion-процесс объясняет state и остаётся читаемым без анимации.

Целевая поверхность первого цикла — только UI Lab / Vercel Preview. `src/screens/Today.jsx`, `src/screens/CheckIn.jsx`, backend/API, production, Vercel configuration и env не меняются до owner-reviewed iPhone/Telegram gate.
