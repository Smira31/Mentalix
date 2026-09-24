// src/screens/settings/ProfileBanners.jsx
//
// Три баннера в начале «твой профиль.» — DESIGN_SYSTEM.md §5.4 «Баннеры профиля».
// Геометрия — по эталону Stoic, иллюстрации — свои, линейные, в стиле кролика Mentalix.

import { ChevronRight } from 'lucide-react'
import './ProfileBanners.css'

// Кролик выглядывает из-за края карточки: серый, линейный.
function PotentialArt() {
  return (
    <svg className="mx-profile-banner__art" viewBox="0 0 160 140" aria-hidden="true">
      <path d="M58 140V92c0-26 18-44 42-44s42 18 42 44v48" />
      <path d="M78 54C70 30 70 10 80 4c10 6 12 28 6 48" />
      <path d="M112 52c4-24 14-42 26-44 6 12-2 32-14 48" />
      <circle cx="88" cy="88" r="3.2" className="mx-profile-banner__art-fill" />
      <circle cx="116" cy="88" r="3.2" className="mx-profile-banner__art-fill" />
      <path d="M98 102c2 3 6 3 8 0" />
      <path d="M30 120c10-6 20-6 28 0M142 118c8-5 14-5 18-2" />
      <path d="M20 44l4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
    </svg>
  )
}

// Кролик держит сердце — белая линия на панели справа.
function SupportArt() {
  return (
    <svg className="mx-profile-banner__art" viewBox="0 0 89 118" aria-hidden="true">
      <path d="M26 118V84c0-14 8-24 19-24s19 10 19 24v34" />
      <path d="M37 62c-5-16-5-30 1-36 7 5 8 20 5 34" />
      <path d="M52 60c3-15 9-27 16-28 3 8-1 20-8 30" />
      <circle cx="39" cy="80" r="1.8" className="mx-profile-banner__art-fill" />
      <circle cx="52" cy="80" r="1.8" className="mx-profile-banner__art-fill" />
      <path d="M45.5 106c-6-4-10-7-10-11a4.5 4.5 0 0 1 10-2 4.5 4.5 0 0 1 10 2c0 4-4 7-10 11Z" />
    </svg>
  )
}

// Кролик у окна браузера.
function WebArt() {
  return (
    <svg className="mx-profile-banner__art" viewBox="0 0 120 96" aria-hidden="true">
      <rect x="6" y="10" width="78" height="56" rx="8" />
      <path d="M6 24h78" />
      <circle cx="15" cy="17" r="1.6" className="mx-profile-banner__art-fill" />
      <circle cx="22" cy="17" r="1.6" className="mx-profile-banner__art-fill" />
      <path d="M18 38h40M18 48h28" />
      <path d="M84 96V74c0-10 7-17 15-17s15 7 15 17v22" />
      <path d="M92 58c-4-12-3-22 2-26 5 4 6 14 3 25" />
      <path d="M104 57c3-11 7-19 13-20 2 6-1 15-7 22" />
      <circle cx="95" cy="73" r="1.6" className="mx-profile-banner__art-fill" />
      <circle cx="105" cy="73" r="1.6" className="mx-profile-banner__art-fill" />
    </svg>
  )
}

export function PotentialBanner({ onOpen }) {
  return (
    // Тап по всей карточке ведёт туда же, куда кнопка: клик по кнопке всплывает сюда.
    <div
      className="mx-profile-banner mx-profile-banner--potential"
      data-testid="profile-banner-potential"
      onClick={onOpen}
    >
      <PotentialArt />
      <h2 className="mx-profile-banner__title">Открой весь потенциал Mentalix</h2>
      <p className="mx-profile-banner__text">
        Все собеседники, полная аналитика и курсы в Mentalix Pro
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
      <p className="mx-profile-banner__text">
        Поддержи <strong>Mentalix</strong> — это помогает проекту расти.
      </p>
      <span className="mx-profile-banner__panel">
        <SupportArt />
      </span>
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
      <WebArt />
      <span className="mx-profile-banner__title">Mentalix на сайте</span>
      <span className="mx-profile-banner__text">
        Свяжи аккаунт с сайтом, чтобы записи были и в браузере.
      </span>
      <ChevronRight size={20} aria-hidden="true" className="mx-profile-banner__chevron" />
    </button>
  )
}

export function ProfileBanners({ showWeb, onOpenSubscription, onOpenDonate, onOpenWeb }) {
  return (
    <div className="mx-profile-banners" data-testid="profile-banners">
      <PotentialBanner onOpen={onOpenSubscription} />
      <SupportBanner onOpen={onOpenDonate} />
      {showWeb && <WebBanner onOpen={onOpenWeb} />}
    </div>
  )
}
