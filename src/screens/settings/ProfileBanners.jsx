// src/screens/settings/ProfileBanners.jsx
//
// Баннеры в начале «твой профиль.» — DESIGN_SYSTEM.md §5.4 «Баннеры профиля».
// Стиль Stoic, монохром: карточки без картинок — заголовок, подпись, кнопка.
//
// PR1: рисунки (красный персонаж) убраны — карточки без картинок.
// PR18: «Открой весь потенциал» и «Подписка» скрыты до подключения оплаты
//       (PAYMENTS_ENABLED). Карточка «Открой весь потенциал» уже без картинки —
//       при включении флага будет в стиле Stoic.
// PR2: строка «Держит форму — До „Находит путь" — N дня» убрана.

import './ProfileBanners.css'
import { PAYMENTS_ENABLED } from '../../config/payments'

export function PotentialBanner({ onOpen }) {
  return (
    // Тап по всей карточке ведёт туда же, куда кнопка: клик по кнопке всплывает сюда.
    <div
      className="mx-profile-banner mx-profile-banner--potential"
      data-testid="profile-banner-potential"
      onClick={onOpen}
    >
      <h2 className="mx-profile-banner__title">Открой весь потенциал Mentalix</h2>
      {/* «Mentalix Pro» не разрывается переносом строки. */}
      <p className="mx-profile-banner__text">
        {'Все собеседники, полная аналитика и курсы в Mentalix\u00A0Pro'}
      </p>
      <button
        type="button"
        className="mx-profile-banner__pill"
        data-testid="profile-banner-potential-button"
      >
        Подробнее
      </button>
    </div>
  )
}

export function SupportBanner({ onOpen }) {
  return (
    <button
      type="button"
      className="mx-profile-banner mx-profile-banner--support"
      data-testid="profile-banner-support"
      onClick={onOpen}
    >
      {/* Тире не отрывается от предыдущего слова при переносе. */}
      <p className="mx-profile-banner__text">
        Поддержи <strong>Mentalix</strong>
        {'\u00A0— это помогает проекту расти.'}
      </p>
    </button>
  )
}

export function WebBanner({ onOpen }) {
  return (
    <button
      type="button"
      className="mx-profile-banner mx-profile-banner--web"
      data-testid="profile-banner-web"
      onClick={onOpen}
    >
      {/* Заголовок как в референсе Stoic: «Mentalix» выделен, «на сайте»
          обычным весом, одним размером шрифта. */}
      <span className="mx-profile-banner__title">
        <strong>Mentalix</strong> на сайте
      </span>
      <span className="mx-profile-banner__text">
        Свяжи аккаунт с сайтом, чтобы записи были и в браузере.
      </span>
    </button>
  )
}

export function ProfileBanners({ showWeb, onOpenSubscription, onOpenDonate, onOpenWeb }) {
  return (
    <div className="mx-profile-banners" data-testid="profile-banners">
      {PAYMENTS_ENABLED && <PotentialBanner onOpen={onOpenSubscription} />}
      <SupportBanner onOpen={onOpenDonate} />
      {showWeb && <WebBanner onOpen={onOpenWeb} />}
    </div>
  )
}
