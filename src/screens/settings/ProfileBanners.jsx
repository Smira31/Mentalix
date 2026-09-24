// src/screens/settings/ProfileBanners.jsx
//
// Три баннера в начале «твой профиль.» — DESIGN_SYSTEM.md §5.4 «Баннеры профиля».
// Геометрия — по эталону Stoic. Иллюстрации — персонаж из референса
// владельца (профиль влево, рог-полумесяц, вытянутое лицо с острым
// подбородком, прикрытый глаз с каплей, тонкая шея, тёмная одежда),
// но линейные, в токенах Mentalix (currentColor), без акцентных цветов.

import { ChevronRight } from 'lucide-react'
import './ProfileBanners.css'

// Персонаж из референса: профиль влево, рог-полумесяц, вытянутое лицо
// с острым подбородком, прикрытый глаз с каплей, тонкая шея, тёмная одежда.
// Выглядывает из-за края карточки снизу справа.
function PotentialArt() {
  return (
    <svg className="mx-profile-banner__art" viewBox="0 0 160 140" aria-hidden="true">
      {/* Рог-полумесяц: изгиб вверх и наружу к острому концу. */}
      <path d="M100 60C108 44 120 24 138 12c4 16-8 36-28 48" />
      {/* Профиль: лоб → острый нос → заострённый подбородок → шея. */}
      <path d="M102 58C94 58 86 60 80 64C72 70 66 76 62 82C59 86 55 88 52 89C54 94 55 99 58 104C62 110 70 113 79 113C88 113 96 110 102 106" />
      <path d="M102 106C104 90 104 74 102 58" />
      {/* Прикрытый глаз — острая тонкая линия, под ней капля. */}
      <path d="M67 84l11 1" />
      <path
        d="M74 91c-1.5 2.3-2.2 3.6-2.2 4.8a2.2 2.2 0 0 0 4.4 0c0-1.2-.7-2.5-2.2-4.8Z"
        className="mx-profile-banner__art-fill"
      />
      {/* Длинная тонкая шея. */}
      <path d="M84 113C86 122 87 131 87 140" />
      <path d="M100 106C103 116 105 128 105 140" />
      {/* Штриховка «угольком» под скулой и на шее. */}
      <path d="M64 102l-7 8M71 106l-6 7M78 109l-5 6" />
      <path d="M92 122l5 6M88 132l5 6" />
      {/* Тёмная одежда референса — мягкая заливка, срезанная краем карточки. */}
      <path
        d="M24 140C30 128 44 120 62 117C76 114 90 117 100 122C114 128 126 133 132 140Z"
        className="mx-profile-banner__art-fill"
        fillOpacity="0.35"
      />
    </svg>
  )
}

// Персонаж из референса на панели справа — со сердцем-поддержкой.
function SupportArt() {
  return (
    <svg className="mx-profile-banner__art" viewBox="0 0 89 118" aria-hidden="true">
      {/* Рог-полумесяц. */}
      <path d="M46 32C52 22 60 10 70 6c3 10-4 20-13 26" />
      {/* Профиль влево с острым подбородком. */}
      <path d="M48 30C42 32 36 35 33 39C30 43 27 46 25 48C27 52 29 56 31 58C34 62 39 64 45 64C50 64 55 62 58 59" />
      <path d="M58 59C60 49 60 39 58 31" />
      {/* Прикрытый глаз и капля. */}
      <path d="M35 42l7 1" />
      <path
        d="M40 48c-1.1 1.7-1.6 2.7-1.6 3.6a1.6 1.6 0 0 0 3.2 0c0-.9-.5-1.9-1.6-3.6Z"
        className="mx-profile-banner__art-fill"
      />
      {/* Тонкая шея. */}
      <path d="M50 64C52 72 53 80 53 88" />
      <path d="M58 59C60 67 61 75 61 84" />
      {/* Штриховка под скулой. */}
      <path d="M37 60l-5 6M43 63l-4 5" />
      {/* Тёмная одежда. */}
      <path
        d="M14 118C18 106 26 99 36 97C46 95 55 98 62 103C67 107 71 112 73 118Z"
        className="mx-profile-banner__art-fill"
        fillOpacity="0.16"
      />
      {/* Сердце-поддержка впереди. */}
      <path d="M28 104c-6-4-10-7-10-10.5a4.5 4.5 0 0 1 10-1.8 4.5 4.5 0 0 1 10 1.8C38 97 34 100 28 104Z" />
    </svg>
  )
}

// Персонаж из референса у окна браузера — смотрит влево, на «сайт».
function WebArt() {
  return (
    <svg className="mx-profile-banner__art" viewBox="0 0 120 96" aria-hidden="true">
      <rect x="6" y="10" width="78" height="56" rx="8" />
      <path d="M6 24h78" />
      <circle cx="15" cy="17" r="1.6" className="mx-profile-banner__art-fill" />
      <circle cx="22" cy="17" r="1.6" className="mx-profile-banner__art-fill" />
      <path d="M18 38h40M18 48h28" />
      {/* Рог-полумесяц. */}
      <path d="M100 52C103 42 109 32 117 27c2 8-3 16-10 21" />
      {/* Профиль влево с острым подбородком. */}
      <path d="M100 50C97 52 94 54 92 58C90 61 87 63 86 65C88 68 90 71 92 74C95 77 98 78 102 78C106 78 109 76 111 73" />
      <path d="M111 73C112 65 112 57 110 50" />
      {/* Прикрытый глаз и капля. */}
      <path d="M94 61l7 1" />
      <path
        d="M98 67c-.9 1.4-1.3 2.2-1.3 3a1.3 1.3 0 0 0 2.6 0c0-.8-.4-1.6-1.3-3Z"
        className="mx-profile-banner__art-fill"
      />
      {/* Тонкая шея. */}
      <path d="M104 78C105 84 106 90 106 96" />
      <path d="M111 73C113 80 114 87 114 94" />
      {/* Штриховка под скулой. */}
      <path d="M96 76l-4 5M101 78l-3 5" />
      {/* Тёмная одежда. */}
      <path
        d="M78 96C82 88 90 84 98 84C105 84 111 87 115 92L117 96Z"
        className="mx-profile-banner__art-fill"
        fillOpacity="0.16"
      />
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
