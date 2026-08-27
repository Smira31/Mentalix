# Stoic reference notes

**Дата проверки:** 27.08.2026

## Official features page

Источник: [Stoic App Features](https://www.getstoic.com/features)

Официально заявлены: Daily Reflections; Daily Prompts with a new prompt each day and a new theme each week; Guided Journals; Progress Tracking; Streaks & Badges; Gentle Notifications; Journaling History; Personalized Insights; Treasured Memories; Meditation; Breathing; Writing Goals; Quotes & Daily Affirmations; Collections & Resources; Themed Events; Privacy & Security.

Для Mentalix важны не только названия функций, но и связка: ежедневный вход, структурированная рефлексия, свободное письмо, guided content, история, insights и mindful exercises.

## Official daily flow help article

Источник: [Daily Journaling Flow](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/daily-journaling-flow/6f9eBdDY7m4AnbXtALLGtM)

Статья описывает: quick mood check-in при открытии; выбор между одним Daily Check-In и Morning Preparation + Evening Reflection; свободную страницу, custom templates и guided exercises; форматирование текста через Aa; добавление photos/videos/memories через +; tags для организации; streaks и badges.

## Product interpretation for Mentalix

Это наблюдение о публично описанном продукте, а не инструкция копировать Stoic. В Mentalix следует заимствовать только проверяемые поведенческие принципы: короткий ежедневный вход, morning/evening cadence, свободное письмо рядом с prompts, история, мягкие reminders и optional deepening. Бренд, тексты, визуальные assets, точная навигация и proprietary implementation Stoic не копируются.

## Additional official guides

Источник: [Home Screen](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/home-screen/6f9eBdDY7kpekp8AYu18Xq)

Stoic описывает Home как ежедневную стартовую точку. На нём находится Daily Check-In, который можно персонализировать; пользователь может выбрать один ежедневный check-in либо разделить ритуал на Morning Preparation и Evening Reflection, а также выбирать источники вдохновения вроде quotes/affirmations.

Источник: [Data Storage, Import and Backups](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/data-storage-import-and-backups/6f9eBdDY7jYcoaF9t9ytqz)

Stoic заявляет локальное хранение данных на устройстве или в iCloud при включённой синхронизации, а также manual backup и импорт/экспорт в JSON/TXT. Это показывает, что persistence, privacy, backup и portability — отдельная большая capability, а не деталь редактора.

Источник: [Add Button](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/add-button/6f9eBdDY7nQhVPFjkq29Ka)

Add Button является быстрым входом к Empty Page, Mood Check-In, Journaling Suggestions, Favorites, Custom Templates и Library. Library объединяет journals, weekly themes и exercises. В Mentalix этот паттерн следует адаптировать осторожно: сначала один понятный Journal Home и free write, затем guided content; не добавлять custom templates/tags до определения storage и product contract.

## Privacy, AI and Explore

Источник: [Privacy, Data, and AI](https://help.getstoic.com/faq/3sfUSwpkyPFw22e8F1CRHk/privacy-data-and-ai/6f9eBdDY7nmUseRBxVxvQV)

Stoic заявляет приватность записей на устройстве/iCloud, но отдельно сообщает, что при использовании AI текущая journal entry отправляется OpenAI и может храниться до 30 дней для предоставления сервиса и abuse detection. Это важный benchmark для Mentalix: AI-deepen должен иметь явное объяснение, какие данные покидают Telegram/WebView, зачем и на какой срок, а free-write без AI не должен отправляться автоматически.

Источник: [Explore Screen](https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/explore-screen/6f9eBdDY7mmGmvLJB6xkCh)

Explore объединяет Featured & For You, Emotions Check-In, Weekly Themes, Library и Search. Weekly Themes описаны как новый curated theme по понедельникам с ежедневными prompts с понедельника по воскресенье; прошлые prompts можно пересматривать. Для Mentalix это аргумент в пользу отдельного discovery layer после завершения core Journal, а не до него.

## Implications for Mentalix journal roadmap

Порядок capability layers: (1) reliable Journal Home and today cycle, (2) persistence/export/privacy contract, (3) morning/evening customization, (4) guided journals and weekly content, (5) tags/search/favorites, (6) insights and personalization, (7) media memories and advanced exercises. Каждая следующая ступень требует отдельного backend, safety или content contract.

## Visual observations from official pages

Публичные официальные страницы Stoic используют очень свободную композицию: крупный короткий заголовок, много воздуха, спокойные нейтральные поверхности, короткие смысловые секции и последовательное раскрытие capabilities. Это не готовый mobile UI spec, но хороший принцип для Mentalix: не перегружать главный экран множеством CTA и дать одному ежедневному действию визуальный приоритет.

Для Mentalix переносится принцип визуальной иерархии, а не палитра или конкретные компоненты Stoic. Наши существующие dark emerald/gold tokens, line-art motifs и Telegram safe-area contracts остаются источником правды.
