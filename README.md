# Mentalix

Telegram Mini App — операционная система личного роста.
Ритуалы (что делаю) и аскезы (от чего отказываюсь), ИИ-наставники, аналитика.

**Прод:** https://mentalix.vercel.app

---

## Документация

Читать в этом порядке:

| Файл | О чём |
|---|---|
| [`PRODUCT.md`](PRODUCT.md) | Зачем продукт и для кого. Принципы, что не делаем, открытые решения |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Фактические дизайн-токены, типографика и UI-правила |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Устройство frontend, platform layer и API-контракты |
| [`AI_RULES.md`](AI_RULES.md) | Обязательный процесс работы AI с Mentalix |
| [`REFERENCE_WORKFLOW.md`](REFERENCE_WORKFLOW.md) | Как переводить референсы в Mentalix без копирования |
| [`CONTEXT.md`](CONTEXT.md) | Как работать с проектом в чате: шаблон запроса, правила |
| [`ROADMAP.md`](ROADMAP.md) | Что построено, что в работе |
| [`TASKS.md`](TASKS.md) | Задачи на сейчас |
| [`CHANGES.md`](CHANGES.md) | История изменений |
| [`STOIC_FEATURES.md`](STOIC_FEATURES.md) | Разбор референса stoic. — каталог функций с приоритетами |

Спорные вопросы решаются в пользу `PRODUCT.md`.

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

Палитра и радиусы меняются чаще, чем стоит дублировать их здесь — единственный
источник правды раздел 8 в [`PRODUCT.md`](PRODUCT.md), сверяться туда.

Коротко: монохром + золото как единственный акцент, шрифт Manrope (без Fraunces).
Символ — лабиринт, заполняющийся золотом по мере прохождения Пути.
