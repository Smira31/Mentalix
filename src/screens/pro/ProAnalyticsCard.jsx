import CardSystemGlyph from '../../components/CardSystemGlyph'

import './ProAnalyticsCard.css'

/*
 * Mentalix Pro (PRO-002b/c): вход в разбор недели из аналитики.
 *
 * Одна карточка над графиками в разделе «Аналитика» (вкладка «Прогресс»):
 * открывает уже реализованный путь ProScreen — разбор → план → прогресс
 * плана, вложенным <Screen>, без новой вкладки и дублирующего экрана.
 * Прежний вход из профиля убран; подписка, тарифы и согласие остаются в
 * профиле. Карточка не входит в настройку графиков: порядок, скрытие и
 * фильтры аналитики не затрагивает. Доступ (флаг Pro, согласие,
 * ограничения) по-прежнему проверяет backend.
 *
 * Геометрия — по образцу владельца, карточке «Твои практики» в этой же
 * аналитике: та же оболочка `.mx-progress-card` и та же композиция
 * «кольцо слева, текст справа» (`.mx-progress-practices__empty*`, §5.5).
 * Размеры здесь не задаются заново: переиспользуются классы образца,
 * поэтому ширина, высота, отступы, скругление и типографика совпадают с
 * ним. Значок недели — из общего реестра `CardSystemGlyph`; фиктивного
 * процента и меню «…» в карточке нет.
 *
 * Вся поверхность — одна кнопка: Pro открывается тапом, с клавиатуры —
 * Tab + Enter/пробел (обводка фокуса общая, см. `button:focus-visible`).
 */
export default function ProAnalyticsCard({ onOpen }) {
  return (
    <button
      type="button"
      className="mx-progress-card mx-pro-analytics-card"
      data-testid="progress-pro-card"
      aria-label="Разбор и план недели. Взгляни на свою неделю"
      onClick={onOpen}
    >
      <span className="mx-progress-card__head mx-pro-analytics-card__head">
        <span className="mx-progress-card__title mx-pro-analytics-card__title">
          Разбор и план недели
        </span>
        <span className="mx-progress-card__subtitle mx-pro-analytics-card__subtitle">
          За текущую неделю
        </span>
      </span>

      <span className="mx-progress-practices__empty">
        <span
          className="mx-progress-practices__empty-ring mx-pro-analytics-card__ring"
          aria-hidden="true"
        >
          <CardSystemGlyph kind="week-review" />
        </span>

        <span className="mx-progress-practices__empty-text">
          <span className="mx-progress-practices__empty-dot" aria-hidden="true" />
          <span className="mx-progress-practices__empty-title">Взгляни на свою неделю</span>
          <span className="mx-progress-practices__empty-hint">
            Заметь главное в записях и выбери следующий шаг
          </span>
        </span>
      </span>
    </button>
  )
}
