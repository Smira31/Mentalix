# Stoic → Mentalix: product and design audit

**Статус:** рабочий аудит, 27.08.2026  
**Цель:** понять, какие Stoic-паттерны полезно адаптировать в Mentalix, не копируя бренд, тексты, UI или proprietary implementation.

## 1. Functional map

| Stoic capability | Что подтверждено официальными материалами | Mentalix сегодня | Решение для Mentalix |
|---|---|---|---|
| Home / daily start | Home — ежедневная стартовая точка с Daily Check-In и настройкой состава | Today — главный вход; есть mood/check-in и daily cycle | Сохранить Today как основной вход; Journal Home развивать как рабочую поверхность, не создавать новую конкурирующую вкладку |
| Morning / evening cadence | Можно выбрать один Daily Check-In или Morning Preparation + Evening Reflection | Today/CheckIn и Journal Home prototype; evening parts существуют в CheckIn | Собрать один понятный journal flow поверх существующих morning/evening contracts |
| Free writing | Empty Page для свободной записи | `JournalTextarea` уже поддерживает Writing Canvas, formatting и save/deepen | Сделать free write равноправным входом, без обязательного prompt |
| Daily prompts | Новый prompt каждый день и новая тема каждую неделю | MXL-015: семь curated themes; MXL-016: authorial daily thoughts | Связать daily thought/theme с prompt, но не перекрывать собственную запись |
| Guided journals | Тематические guided journals и prepared exercises | ThemeScreen, Practices, MXL-014 meditation | Сначала один core Journal; затем guided tracks как отдельный content layer |
| History | История записей как возврат к прошлому | History показывает check-ins, activity, theme entries и badges с оговоркой о датах | Улучшить раскрытие дня; unified feed ждать честного backend date contract |
| Tags / search / favorites | Tags, search, favorites и Add Button shortcuts | Частично отсутствуют; roadmap item | Не брать до persistence/schema decision |
| Progress | Mood tracking, factors, streaks, badges, writing goals | Active days, Journey, activity, badges | Использовать active days и completion, избегать давления streak-first |
| Insights | Personalized insights based on entries and activities | MXL-009 frontend descriptive safety slice | Развивать только descriptive observations с provenance, sample-size guards и disclaimer |
| Mindful exercises | Meditation, breathing, library | MXL-014 text meditation; другие practices частично | Добавлять короткие текстовые практики постепенно, без claims лечения |
| Memories/media | Photos, videos, memories | Не входит в текущий scope | Отложить до privacy/storage/attachment contract |
| Privacy/storage | Local/iCloud storage, export/import, AI disclosure | Telegram/backend architecture; local prototype draft | Перед cloud journal определить privacy promise, retention, export/delete и AI consent |
| Notifications | Gentle daily notifications; AI reminders | Backend reminder task remains separate | Сначала определить режим повторения и consent; не копировать notification pressure |
| Subscription | Basic prompts/quotes/guided journals and premium layers описаны в official guide | MXL-020 deferred | Не монетизировать до evidence повторяемой ценности |

## 2. Core user journeys to prototype

### Journey A — Today → morning idea

Пользователь открывает Today, видит текущее состояние и один следующий шаг, затем попадает в Journal Home. Journal Home предлагает один короткий prompt, но оставляет свободное письмо. После сохранения пользователь может выбрать действие или передать запись AI-наставнику через explicit deepen.

### Journey B — action → evening analysis

Пользователь возвращается к сегодняшнему журналу и видит сохранённую утреннюю мысль. Он фиксирует, что произошло, что зависело от него и что было сложным. Завершение не оценивает человека; оно формирует один новый шаг на завтра.

### Journey C — history → continuation

Пользователь открывает историю, выбирает день, читает запись и возвращается к сегодняшнему действию. История должна отвечать на вопрос «что я заметил и что сделал», а не превращаться в статистический dashboard без контекста.

### Journey D — free write → optional AI

Пользователь нажимает add/free write, пишет без шаблона, сохраняет локально/в разрешённом storage и только отдельным действием отправляет текст AI. До явного consent текст не должен уходить в backend/LLM.

## 3. Design translation

| Stoic observation | Mentalix adaptation |
|---|---|
| Большая смысловая иерархия и много воздуха | Оставить тёмную Mentalix-систему, но сократить количество конкурирующих CTA |
| Home как daily invitation | Journal Home должен показывать один current action, а не каталог всех возможностей |
| Add Button как shortcut | Использовать одну понятную кнопку «Новая запись» внутри существующего Mentor/Journal flow |
| Daily/weekly content layers | MXL-016 + MXL-015 становятся prompts, а не отдельными обязательными сущностями |
| History as return loop | Датированные записи и мягкая кнопка «Продолжить сегодня» |
| Customization | Сначала только выбор free write / prompt / optional AI; templates/tags позже |
| Privacy as product promise | Явно разделить local draft, synced journal и AI-submitted text |

## 4. Mentalix gaps by size

| Размер | Gap | Зависимость |
|---|---|---|
| XL | Production Journal Home with persisted morning/evening entries | Backend/storage contract, conflict policy, export/delete |
| L | Unified dated journal/history feed | Backend date model for all source types |
| L | Journal personalization: cadence, prompt source, optional AI | Product settings, copy, analytics |
| M | Journal Home prototype refinement | Manual iPhone/Telegram gate; current PR #224 |
| M | Guided journal library | Content governance, taxonomy, accessibility |
| M | Tags/search/favorites | Schema, indexing/search UX, persistence |
| M | Privacy/data center | Retention, export, delete, AI disclosure |
| S | Quick add/free write entry | Existing editor and local draft contract |
| S | Gentle reminder settings | Backend schedule and consent |
| S | Journal completion summary | Copy and event tracking |

## 5. Recommended implementation order

1. Проверить и довести текущий Journal Home prototype.
2. Зафиксировать production persistence contract: entry ID, date/timezone, phase, draft/final, edit/delete, sync conflict, export and delete.
3. Реализовать morning/evening entries на существующих backend contracts или завести отдельный contract PR.
4. Объединить дату и раскрытие дня в History.
5. Добавить guided journal library из проверенного контента.
6. Добавить tags/search/favorites только после стабилизации хранения.
7. Провести privacy/data center и explicit AI consent.
8. Проверить 5–7 пользователей и измерить complete-cycle rate, return rate и perceived usefulness.
9. Только после evidence решать reminders, personalization, payment и media memories.

## References

[1]: https://www.getstoic.com/features "Stoic App Features"
[2]: https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/daily-journaling-flow/6f9eBdDY7m4AnbXtALLGtM "Daily Journaling Flow — Stoic Help Center"
[3]: https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/home-screen/6f9eBdDY7kpekp8AYu18Xq "Home Screen — Stoic Help Center"
[4]: https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/add-button/6f9eBdDY7nQhVPFjkq29Ka "Add Button — Stoic Help Center"
[5]: https://help.getstoic.com/faq/3sfUSwpkyPFw22e8F1CRHk/privacy-data-and-ai/6f9eBdDY7nmUseRBxVxvQV "Privacy, Data, and AI — Stoic Help Center"
[6]: https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/data-storage-import-and-backups/6f9eBdDY7jYcoaF9t9ytqz "Data Storage, Import and Backups — Stoic Help Center"
[7]: https://help.getstoic.com/stoic-user-guide/mooMJC6qGFVeG62FpCwNAw/explore-screen/6f9eBdDY7mmGmvLJB6xkCh "Explore Screen — Stoic Help Center"
