# MXL-124 — Competitive review Telegram Mini Apps

**Статус:** research; не является разрешением на изменение продукта, API, данных, безопасности, paywall или политики AI.

**Дата наблюдений:** 28.08.2026, GMT+3.
**Метод:** пассивный обзор официальных публичных сайтов и Telegram landing-страниц. Боты не запускались, сообщения не отправлялись, регистрации, identity verification и платежи не выполнялись. Поэтому в каждом случае строго разделены публично подтверждённая витрина и непроверенный in-app опыт.

> **Главный вывод:** лучшие сравнения подтверждают не необходимость расширять Mentalix новыми разделами, а ценность короткого понятного entry, одного следующего действия и связки «диалог → конкретное действие → возвращение». Широкие AI-memory, streak, social, payment и health claims не следует переносить автоматически.

## 1. Метод и ограничения

Telegram landing-страница обычно показывает название, описание, иногда число пользователей и одну CTA `Start Bot`, но не раскрывает onboarding, реальные permissions, error state, keyboard-safe поведение, paywall или retention. Официальный product site может раскрывать заявленный flow, однако его тексты являются vendor claims, а не независимой проверкой. Столбец **«Вывод»** ниже — продуктовая гипотеза для будущего review, а не план разработки.

| Критерий | Что удалось проверить | Что остаётся за ручным Telegram/iPhone gate |
|---|---|---|
| Public entry | Название, позиционирование, прямой Telegram entry, отдельный канал/поддержка там, где они видимы. | Реальная первая реплика, consent, onboarding completion и deep-link destination. |
| Mini App UX | Иногда — заявленный в публичном сайте запуск в Telegram и illustrated UI. | Навигация, loading/error/empty, safe area, keyboard, touch targets и webview performance. |
| Retention | Только публично заявленные reminders, daily flow, weekly summaries или streaks. | Фактическая частота, opt-in, cancel flow, delivery reliability и user control. |
| Privacy/paywall | Только claims на официальной странице. | Действительные data contract, export/delete execution, receipt, cancellation и security. |

## 2. Сводная таблица по десяти продуктам

| Продукт | Подтверждённая публичная ценность | Публично видимый путь / CTA | Решение для Mentalix | Почему |
|---|---|---|---|---|
| [МУНА / @munai_app_bot][1] | Лунный календарь, цикл, дневник снов, анализ личности. | Одна `Start Bot` CTA на Telegram landing. | **Взять ограниченно.** | Конкретная ценность до входа и одна CTA — удачный storefront-паттерн. Flow не проверен. |
| Kora | Официальный URL/username не идентифицирован. | Не подтверждён. | **Не брать сейчас.** | Название неоднозначно; нельзя подменять продукт одноимёнными сервисами. |
| [WantToPay][2] | Выпуск виртуальных карт, пополнение и отслеживание расходов в Telegram Mini App. | Первичный сайт показывает одну `Get your card` CTA и линейный путь «аккаунт → карта → оплата». | **Взять ограниченно.** | Ясное обещание до входа и один явный следующий шаг. Не брать финансовый onboarding/paywall. |
| [Плати по миру / @platipomiru_bot][3] | USD-карты и пополнение RUB; публично вынесены канал и support bot. | `Start Bot`; отдельные ссылки на основной канал и поддержку. | **Взять ограниченно.** | Полезен паттерн разделения product entry и support channel. In-app flow не проверен. |
| [Wise Insights][4] | Telegram AI reflection agent: краткие ежедневные диалоги, вечернее наблюдение, weekly insight. | Официальный сайт ведёт к `@Wiseinsights_bot` и объясняет путь до входа. | **Взять как reference.** | Лучше всего подтверждает daily loop «состояние → одно действие → review», уже близкий Mentalix. Не брать memory/export/paywall/medical claims. |
| [RebootMe][5] | Telegram Mini App: задачи, сферы жизни, AI coach, streaks, social и premium. | Одна `Start for Free` CTA; сайт показывает Day 1 → Month 3 progression. | **Не брать feature set; взять негативный reference.** | Хороший пример ясного entry, но его рост через streaks, social pressure и широкие surfaces не соответствует текущему спокойному core loop Mentalix. |
| Habit Tracker | У Issue нет точного username. Найденный кандидат [@HabitTrackerRobot][6] публично показывает только bot name и `Start Bot`. | Только entry CTA. | **Не брать сейчас.** | Нельзя доказать, что найденный кандидат и есть целевой продукт. |
| PsychologyAI | Официальный URL/username не идентифицирован. | Не подтверждён. | **Не брать сейчас.** | Поисковая выдача смешивает разные AI psychology продукты. |
| [Анна / @calm_mind_bot][7] | Публично заявлены AI-психолог, 24/7 support, голос, файлы, канал. | Одна `Start Bot` CTA и ссылка на канал. | **Не брать feature set; safety reference.** | Прямое позиционирование как психолог и claims о поддержке требуют отдельной safety/privacy/medical policy; можно изучать только ясность chat entry. |
| [Mira][8] | Telegram-native AI agent для action, reminders, workspaces и integrations. | Одна `Message Mira` CTA на `@mira`; public site показывает личный и group use cases. | **Взять ограниченно.** | Сильный reference для контекстного handoff «чат → действие → результат в чате». Не брать autonomy/integrations/group-memory без отдельного security/consent scope. |

## 3. Официальный platform baseline

Публичная документация Telegram подтверждает, что Mini Apps могут запускаться из нескольких контекстов, поддерживают seamless authorization, динамические theme parameters, fullscreen и safe-area события, а также нативные bottom buttons. Это важнее для Mentalix, чем копирование отдельных vendor features: capability сама по себе не является рекомендацией к включению.

| Capability | Подтверждённый platform fact | Безопасное решение для Mentalix |
|---|---|---|
| Entry points | Mini App может быть запущен через bot button, menu button или direct link.[10] | Сохранять один ясный intent на entry; не добавлять новый entry без измеримого сценария. |
| Theme and layout | Telegram передаёт theme data и safe-area/content-safe-area параметры; fullscreen имеет отдельные события.[10] | Продолжать использовать существующие safe-area/fullscreen hooks; не дублировать контейнерную навигацию. |
| Native CTA | Telegram предоставляет BottomButton и SecondaryButton.[10] | Использовать native CTA только там, где действие одно и очевидно; не заменять все web-кнопки автоматически. |
| Persistence | DeviceStorage и SecureStorage доступны на поддерживаемых версиях.[10] | Не переносить private Journal data в device storage без отдельного privacy/backend решения. |
| Data responsibility | Mini App является сторонним сервисом, а обработка данных и support лежат на Service Provider.[11] | Не формулировать claims о privacy, security или support на основании самого факта запуска внутри Telegram. |

Эта baseline-таблица отделяет **что платформа позволяет** от **что Mentalix следует делать**. Последний столбец — ограниченная product recommendation для будущих decision gates, а не разрешение на изменение production flow.

## 4. Пять наиболее полезных references

| Ранг | Reference | Что подтверждено | Что проверять в Mentalix, не создавая новую функцию |
|---|---|---|---|
| 1 | Wise Insights | Чёткий daily rhythm: утром — состояние и один сдвиг, вечером — наблюдение, раз в неделю — review.[4] | Проверить, отвечает ли каждый state `Today` на вопрос «что сделать сейчас?» и ведёт ли completion к следующему малому действию. |
| 2 | Mira | Контекстное действие из чата и возвращение результата в привычный интерфейс Telegram.[8] | Проверить существующий Bot → Mini App deep-link → completion → Bot return flow в Issue #121, не добавляя агентские integrations. |
| 3 | WantToPay | Витрина объясняет ценность, CTA и следующий путь до входа в Mini App.[2] | Проверить первый экран, Telegram profile и `/start` на одну понятную ценность и одну primary CTA. |
| 4 | Плати по миру | Публичная витрина отделяет основной product entry от support path.[3] | Проверить, понятны ли в Mentalix основной bot CTA и маршрут помощи, не смешиваются ли они в одном шаге. |
| 5 | RebootMe | Наглядно показывает, какие широкие механики — streaks, социальное давление и premium feature set — могут перегрузить personal system.[5] | Использовать как контрольный anti-pattern: не расширять core loop поверхностями, которые не сокращают путь до текущего действия. |

## 5. Сопоставление с текущими решениями Mentalix

Исследование подтверждает существующую формулу Mentalix: персональная action system внутри Telegram, где Mini App ведёт к одному действию, а bot возвращает человека в релевантный контекст. Это соответствует указанным в действующей research board принципам «одна сессия ≈ одно понятное действие» и «Bot → конкретное действие в Mini App → completion → следующий контакт».[9]

| Область | Подтверждение из research | Статус для Mentalix |
|---|---|---|
| Первый вход | WantToPay, МУНА и RebootMe делают пользу и next step понятными до запуска. | Проверить в существующей Issue #117 по onboarding; не создавать второй onboarding. |
| Daily loop | Wise Insights явно связывает краткое утро, вечер и weekly review. | Проверить связность существующих Today, Check-in и Trends; не копировать vendor memory или subscription. |
| Bot ↔ Mini App | Mira демонстрирует action inside chat, а Плати по миру — разделение main entry и support. | Проверить существующий Issue #121; deep links и server contract не менять по этому research. |
| Privacy / AI framing | Wise и Анна публично формулируют claims о психологической роли и data controls. | Только safety/privacy review: не обещать memory, export, deletion, support или диагнозы, пока это не подтверждено кодом и политикой. |
| Retention | Wise и RebootMe используют ежедневный ритм; RebootMe усиливает его streak/social mechanics. | Сохранять полезное возвращение к контексту, не добавлять penalty, streak или social pressure. |

## 6. Ручные research gates

Полный competitive review невозможен только через публичный web: следующий проход выполняется владельцем или на выделенном тестовом Telegram-аккаунте, без оплаты и чувствительных личных данных. Для каждого идентифицированного бота нужно зафиксировать скриншоты public profile, первой реплики, первого action, входа Mini App, empty/loading/error state, keyboard-safe editor, visible paywall и возвращения в bot.

| Продукт | Что именно проверить вручную | Стоп-условие |
|---|---|---|
| МУНА | Старт, первый вопрос, есть ли Mini App/меню, видимая consent/privacy информация. | Не вводить данные о здоровье/цикле и не оплачивать. |
| WantToPay / Плати по миру | Только публичный entry и help path; если Mini App просит регистрацию или платёж — остановиться. | Не проходить KYC, не пополнять баланс, не выпускать карту. |
| Wise Insights | На тестовом аккаунте: onboarding, утренний prompt, opt-in/stop и privacy entry. | Не использовать личные кризисные/медицинские сведения и не покупать подписку. |
| RebootMe | Первый экран, сколько CTA, как показывается задача и отмена reminders. | Не подключать друзей/группы и не покупать premium. |
| Анна | Видимая crisis/safety routing, privacy notice и выход из чата. | Не выдавать себя за человека в кризисе и не отправлять персональные данные/файлы. |
| Mira | Onboarding, первый task prompt, запросы на integrations/permissions и cancel path. | Не подключать внешние сервисы и не давать доступ к данным. |

## 7. Что не является результатом этой задачи

Этот документ не создаёт ни одной новой функции, не утверждает качество или безопасность сторонних сервисов, не подтверждает их фактические data practices и не разрешает копировать их claims. Неидентифицированные позиции Kora, PsychologyAI и Habit Tracker остаются сознательно неполными: для них нужен точный URL или username. Следующее product decision должно опираться на текущие Issues #117, #121, #122 и #123, а не на расширение backlog из конкурентных идей.

## References

[1]: https://t.me/munai_app_bot "МУНА — публичная Telegram-витрина"
[2]: https://wanttopay.net/en "WantToPay — официальный сайт"
[3]: https://t.me/platipomiru_bot "Плати по миру — публичная Telegram-витрина"
[4]: https://wise.synergize.digital/ "Wise Insights — официальный сайт"
[5]: https://www.reboot-me.app/ "RebootMe — официальный сайт"
[6]: https://t.me/HabitTrackerRobot "Habit Tracker bot — найденный кандидат"
[7]: https://t.me/calm_mind_bot "Анна — публичная Telegram-витрина"
[8]: https://mira.tg/ "Mira — официальный сайт"
[9]: telegram-ux-competitive-board.md "Действующая research board Mentalix"
[10]: https://core.telegram.org/bots/webapps "Telegram Mini Apps — official platform documentation"
[11]: https://telegram.org/tos/mini-apps "Telegram Mini Apps Terms of Service"
[12]: https://turumburum.com/blog/telegram-mini-app-beyond-the-standard-ui-designing-a-truly-native-experience "Telegram Mini App native UX analysis"
