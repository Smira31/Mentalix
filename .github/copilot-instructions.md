# Инструкции для GitHub Copilot

Начинайте работу с [`AGENTS.md`](../AGENTS.md) и [`PROJECT_BRIEF.md`](../PROJECT_BRIEF.md). Они определяют обязательные границы, маршрут по документации и минимальный контекст; не копируйте и не переопределяйте их в этой инструкции.

Определите один Issue/PR и один малый scope до изменения файлов. Читайте только нужный профильный источник: `PRODUCT.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md` или `AI_RULES.md`. Не используйте `TASKS.md`, `CHANGES.md`, `ROADMAP.md` или `docs/handoffs/` как стартовый backlog: это исторические материалы.

Не изменяйте backend/API, данные, secrets, production, deployment, product scope, визуальные токены или ветки без отдельного решения владельца. Для документации запускайте `npm run docs:check`; для кода — `npm run check:core`, а для UI добавляйте релевантный mobile/Telegram gate. В PR указывайте scope, out-of-scope, checks, риски и rollback.
