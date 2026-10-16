import { PAYMENT_UI_ENABLED, PRO_PRICE, PRO_PERIOD_LABEL } from '../../lib/paymentConfig'

import './ProShowcaseCard.css'

/*
 * Витрина Pro для гостей и пользователей без активного Pro.
 *
 * Показывается в том же месте, что и карточка Pro (раздел «Аналитика»
 * вкладки «Прогресс»), но НЕ делает запросов к /api/pro/*: сервер всё
 * равно вернёт 403/404 для не-Pro — это не ошибка интерфейса. Карточка
 * информирует о возможности и ведёт к оплате — экрану «Подписка».
 *
 * Оболочка и композиция — образец владельца, карточка «Твои практики»:
 * те же классы (.mx-progress-card, .mx-progress-practices__empty*).
 * Цена берётся из общей константы paymentConfig (PRO_PRICE), не
 * дублируется захардкоженно.
 *
 * Если оплата выключена (PAYMENT_UI_ENABLED=false), карточка показывается
 * без кнопки оплаты — как витрина без тупика: пользователь видит, что
 * предлагает Pro, но не упирается в неработающую кнопку.
 */
export default function ProShowcaseCard({ onOpenSubscription }) {
  return (
    <article
      className="mx-progress-card mx-pro-showcase-card"
      data-testid="progress-pro-showcase"
    >
      <span className="mx-progress-card__head mx-pro-showcase-card__head">
        <span className="mx-progress-card__title mx-pro-showcase-card__title">
          Разбор и план недели
        </span>
        <span className="mx-pro-showcase-card__badge" aria-label="Pro">
          Pro
        </span>
      </span>

      <div className="mx-progress-practices__empty mx-pro-showcase-card__body">
        <span
          className="mx-progress-practices__empty-ring mx-pro-showcase-card__ring"
          aria-hidden="true"
        />
        <span className="mx-progress-practices__empty-text">
          <span className="mx-progress-practices__empty-dot" aria-hidden="true" />
          <span
            className="mx-progress-practices__empty-title"
            data-testid="pro-showcase-title"
          >
            Разбор недели и план на 7 дней
          </span>
          <span
            className="mx-progress-practices__empty-hint"
            data-testid="pro-showcase-hint"
          >
            по твоим записям — {PRO_PRICE} {PRO_PERIOD_LABEL}
          </span>
        </span>
      </div>

      {PAYMENT_UI_ENABLED && (
        <button
          type="button"
          className="mx-pro-showcase-card__cta"
          data-testid="pro-showcase-open"
          onClick={onOpenSubscription}
        >
          Открыть Pro
        </button>
      )}
    </article>
  )
}
