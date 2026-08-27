# Mentalix

Telegram Mini App — операционная система личного роста: ритуалы, аскезы, ИИ-наставники и аналитика.

**Прод:** https://mentalix.vercel.app

## Начать здесь

Для владельца и любого ИИ сначала откройте [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md). Он объясняет, какой документ нужен для конкретного вопроса, что считать источником истины и как не тратить контекст на историю, которая не относится к задаче.

| Нужна информация о…                   | Откройте                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| Текущем состоянии, release и blockers | [`PROJECT_STATE.md`](PROJECT_STATE.md)                                                |
| Следующей работе и активном backlog   | [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md)                                            |
| Обязательных правилах для всех ИИ     | [`AGENTS.md`](AGENTS.md)                                                              |
| Продукте и решениях                   | [`PRODUCT.md`](PRODUCT.md)                                                            |
| Frontend и backend boundary           | [`ARCHITECTURE.md`](ARCHITECTURE.md)                                                  |
| UI-токенах и дизайн-правилах          | [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)                                                |
| Технических инвариантах frontend-кода | [`AI_RULES.md`](AI_RULES.md)                                                          |
| Историческом контексте                | [`CHANGES.md`](CHANGES.md), [`TASKS.md`](TASKS.md), `docs/archive/`, `docs/handoffs/` |

Полное правило владения документами находится в [`docs/DOCUMENTATION_GUIDE.md`](docs/DOCUMENTATION_GUIDE.md). Для новой работы используйте существующий GitHub Issue или создайте Issue через подходящий шаблон; scope, checks и evidence одной задачи фиксируются в соответствующем Pull Request.

## Стек

**Этот репозиторий — frontend.** React + Vite + Tailwind; deployment — Vercel.

**Backend и бот находятся в отдельном приватном репозитории** `mentalix-bot`: FastAPI + SQLAlchemy + aiogram, PostgreSQL, Render и Neon. Актуальные подтверждённые сведения и SHA находятся в [`PROJECT_STATE.md`](PROJECT_STATE.md). Не предполагайте backend-контракт по frontend-коду.

## Разработка

```bash
npm install
npm run dev
```

**Перед Pull Request выполните одну базовую команду:**

```bash
npm run check:core
```

Она последовательно запускает unit-тесты, lint, production build и проверку документации. Для UI-изменений дополнительно выполните:

```bash
npm run ux:check
```

Для изменений, затрагивающих Telegram, safe area, keyboard или fullscreen, автоматические проверки не заменяют ручной gate на реальном iPhone внутри Telegram. Ограничения и порядок действий описаны в [`AGENTS.md`](AGENTS.md) и [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md).

## Дизайн

Палитра, типографика и радиусы намеренно не дублируются здесь. Единственный источник UI-токенов — [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).
