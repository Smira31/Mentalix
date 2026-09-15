---
status: working
last_verified: 2026-09-14
---

# Адаптация наблюдаемых Stoic-механик для Mentalix

## Граница задачи

Видеореференс используется как источник наблюдаемых UX-механик: ритм переходов, поведение карточек, safe-area, клавиатура, иерархия текста, line-art и характер микровзаимодействий. Mentalix не копирует бренд stoic., его иллюстрации, название, тексты или уникальную визуальную личность. Все механики переназначаются на существующие функции Mentalix: Today, check-in, Journal, Mentor, Library и Progress.

## Наблюдаемые механики

| Механика                                  | Адаптация Mentalix                                                   | Критерий проверки                                             |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| Тёмная почти чёрная поверхность           | `--c-bg`, `--c-card`, `--c-card2` и нейтральные Library-карточки     | нет цветной заливки там, где карточка должна быть нейтральной |
| Serif-акцент крупных смысловых заголовков | только editorial/hero роли; управление остаётся на Onest             | иерархия читается без декоративного шума                      |
| Spring/tactile tap                        | 140–240 ms, scale примерно 0.975–0.985                               | CTA и choice не дёргаются и не меняют layout                  |
| Переход между шагами                      | fade + короткий вертикальный settle, 420–520 ms для state transition | BackButton и keyboard flow сохраняют state                    |
| Полноэкранный check-in/journal            | существующий `useFullscreenSurface`, safe-area сверху и снизу        | CTA не перекрывается клавиатурой или home indicator           |
| Горизонтальные карточки                   | существующий scroll-snap и центр активной карточки                   | активная карточка центрирована на Pro и Pro Max               |
| Line-art                                  | существующий `SemanticGlyph`/`CardSystemGlyph`                       | одна смысловая точка, без новых конкурирующих SVG-систем      |
| Bottom navigation                         | пять равных tab slots, активный tab выделен поверхностью             | центры вкладок равномерно распределены                        |

## Приоритеты реализации

1. Motion foundation и screen transitions.
2. Today/check-in: настроение, энергия, фокус, текстовый шаг и завершение.
3. Journal: keyboard-safe editor, draft persistence, next-step transition.
4. Mentor: fullscreen picker/conversation, centered pin bar, persona card settle.
5. Library/Progress: neutral surfaces, horizontal content rails, fade/graph reveal.
6. Реальная Telegram iOS/Android ручная проверка.

## Неопределённости видео

Видео не даёт надёжно измерить исходные duration/easing и не показывает все состояния приложения. Поэтому Mentalix использует утверждённые project tokens: tactile 140–240 ms, state transition 420–520 ms, slow semantic cycles 3.8–6.8 s, `prefers-reduced-motion`, `visualViewport` и Telegram safe-area.

## Release gate

Перед завершением UI-пакета обязательны unit, build, lint, Telegram P0 на iPhone 16 Pro и Pro Max, проверка loading/empty/error states и ручной smoke в реальном Telegram WebView.

Источник анализа: `ScreenRecording_09-14-202618-24-21_1.mp4`, локальный AI video analysis от 14 сентября 2026 года.
