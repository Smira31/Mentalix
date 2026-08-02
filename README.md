# Mentalix

Telegram Mini App — операционная система личного роста.
Ритуалы (что делаю) и аскезы (от чего отказываюсь), ИИ-наставники, аналитика.

**Прод:** https://mentalix.vercel.app

---

## Документация

### Актуальные нормативные документы

| Файл | О чём |
|---|---|
| [`PRODUCT.md`](PRODUCT.md) | Зачем продукт и для кого. Принципы, что не делаем, открытые решения |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Фактические дизайн-токены, типографика и UI-правила |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Устройство frontend, platform layer и API-контракты |
| [`ROADMAP.md`](ROADMAP.md) | Что построено, что в работе |
| [`AI_RULES.md`](AI_RULES.md) | Обязательный процесс работы AI с Mentalix |
| [`REFERENCE_WORKFLOW.md`](REFERENCE_WORKFLOW.md) | Как переводить референсы в Mentalix без копирования |
| [`TASKS.md`](TASKS.md) | Задачи на сейчас |
| [`docs/core/README.md`](docs/core/README.md) | Mentalix Core: связь проблем, законов, методов и продукта |
| [`docs/core/CORE_PRINCIPLES.md`](docs/core/CORE_PRINCIPLES.md) | Правила мышления, проверки и безопасности Core |
| [`docs/core/MENTALIX_LAWS.md`](docs/core/MENTALIX_LAWS.md) | Каталог первичных законов-гипотез |

### История и архив

| Файл | О чём |
|---|---|
| [`CHANGES.md`](CHANGES.md) | История изменений |
| [`CONTEXT.md`](CONTEXT.md) | Legacy-контекст и старый шаблон работы |
| [`STOIC_FEATURES.md`](STOIC_FEATURES.md) | Историческое исследование референса stoic. |

При конфликте приоритет такой:

1. явная команда пользователя;
2. актуальный код — для фактического состояния;
3. профильный нормативный документ — для решений и правил;
4. исторические документы — только как контекст.

## Стек

**Этот репозиторий — фронт.** React + Vite + Tailwind.
Деплой Vercel, автосборка при пуше в `main`.

**Бэкенд и бот — отдельный приватный репозиторий** `mentalix-bot`.
FastAPI + SQLAlchemy + aiogram, PostgreSQL, деплой Railway.

## Разработка

```bash
npm install
npm run dev
```

**Перед каждым пушем:**

```bash
npm run build
```

Ловит опечатки локально, до того как упадёт сборка на Vercel.

## Дизайн

Палитра и радиусы меняются чаще, чем стоит дублировать их здесь. Актуальные
значения находятся в коде и [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

Коротко: монохром + золото как единственный акцент, шрифт Manrope (без Fraunces).
Символ — лабиринт, заполняющийся золотом по мере прохождения Пути.
