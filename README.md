# Mentalix

Telegram Mini App и методология, помогающая превращать понимание в небольшие ежедневные действия и постепенно выстраивать более устойчивые способы поведения.

**Production:** `main` → Vercel project `mentalix` → <https://mentalix.vercel.app>

**Owner QA Preview:** Vercel project `mentalix-preview` → <https://mentalix-preview.vercel.app>

---

## Канонический словарь окружений

В документации Mentalix используются только следующие пять терминов:

| Термин | Определение |
|---|---|
| **Production** | `main` → Vercel project `mentalix` → <https://mentalix.vercel.app>. Каноническое пользовательское окружение. |
| **Owner QA Preview** | Vercel project `mentalix-preview` → <https://mentalix-preview.vercel.app>. Каноническое окружение владельца для QA; Branch Deployment не заменяет его. |
| **UI Lab** | Встроенные экспериментальные маршруты в репозитории. Это не Production. |
| **Local Preview** | `vite preview` после production build. |
| **Branch Deployment** | Временный Vercel deployment под конкретный branch/commit; это не канонический Owner QA Preview. |

## Документация
Точка входа для агентов: [`docs/INDEX.md`](docs/INDEX.md).

### Актуальные нормативные документы

| Файл | О чём |
|---|---|
| [`PRODUCT.md`](PRODUCT.md) | Зачем продукт и для кого. Принципы, что не делаем, открытые решения |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Фактические дизайн-токены, типографика и UI-правила |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Устройство frontend, platform layer и API-контракты |
| [`ROADMAP.md`](ROADMAP.md) | Что построено, что в работе |
| [`AI_RULES.md`](AI_RULES.md) | Обязательный процесс работы AI с Mentalix |
| [`docs/AGENT_ONBOARDING.md`](docs/AGENT_ONBOARDING.md) | Единый onboarding и handoff для Codex/Claude Code |
| [`REFERENCE_WORKFLOW.md`](REFERENCE_WORKFLOW.md) | Как переводить референсы в Mentalix без копирования |
| [`docs/TASK_INDEX.md`](docs/TASK_INDEX.md) | Активный backlog и следующие decision gates |
| [`TASKS.md`](TASKS.md) | Исторический контекст и старые handoffs |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | Актуальное подтверждённое состояние проекта |
| [`BASELINE_SNAPSHOT.md`](BASELINE_SNAPSHOT.md) | Зафиксированный baseline двух репозиториев на 10.09.2026 |
| [`docs/DOCUMENTATION_GUIDE.md`](docs/DOCUMENTATION_GUIDE.md) | Правило единой документации и канонический словарь окружений |

### История и архив

`CHANGES.md` и `docs/archive/` — исторический слой; его не следует использовать вместо `PROJECT_STATE.md` и свежего GitHub evidence.

При конфликте приоритет такой:

1. явная команда пользователя;
2. актуальный код — для фактического состояния;
3. профильный нормативный документ — для решений и правил;
4. исторические документы — только как контекст.

## Стек

**Этот репозиторий — фронт.** React + Vite + Tailwind. Деплой Vercel, автосборка при пуше в `main`.

**Бэкенд и бот — отдельный приватный репозиторий** `mentalix-bot`. FastAPI + SQLAlchemy + aiogram, PostgreSQL, деплой Render и Neon. Актуальные подтверждённые сведения находятся в [`PROJECT_STATE.md`](PROJECT_STATE.md).

## Разработка

```bash
npm install
npm run dev
```

Для production-like проверки локального результата используйте **Local Preview** только после production build:

```bash
npm run build
npm run preview
```

**Перед каждым Pull Request:**

```bash
npm run check:core
```

Для изменений UI, safe area, keyboard, fullscreen или Telegram дополнительно выполните:

```bash
npm run ux:check
```

`check:core` запускает unit-тесты, lint, production build и `docs:check`. Реальный Telegram/iPhone gate остаётся обязательным для mobile-sensitive изменений.

## Дизайн

Палитра и радиусы меняются чаще, чем стоит дублировать их здесь. Актуальные значения находятся в коде и [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

Коротко: монохром + золото как единственный акцент, шрифт Manrope (без Fraunces).
Символ — лабиринт, заполняющийся золотом по мере прохождения Пути.
