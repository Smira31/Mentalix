// src/screens/settings/ProfileBanners.jsx
//
// Три баннера в начале «твой профиль.» — DESIGN_SYSTEM.md §5.4 «Баннеры профиля».
// Геометрия — по эталону Stoic. Иллюстрация — красный рогатый персонаж
// из цветного референса владельца (PersonaArt.jsx): симметричный силуэт
// анфас, чёрные глазницы и апертура, штриховка «угольком», светлый контур.

import { ChevronRight } from 'lucide-react'
import './ProfileBanners.css'
import { PersonaFigure } from './PersonaArt'

// Персонаж вырастает из нижнего правого края карточки — на весь рост.
function PotentialArt() {
  return (
    <svg className="mx-profile-banner__art" viewBox="0 0 160 140" aria-hidden="true">
      <g transform="translate(30 10)">
        <PersonaFigure />
      </g>
    </svg>
  )
}

// Персонаж на панели справа — во всю высоту, с сердцем-поддержкой
// на чёрном торсе.
function SupportArt() {
  return (
    <svg className="mx-profile-banner__art" viewBox="0 0 89 118" aria-hidden="true">
      <g transform="translate(-0.5 0) scale(0.9)">
        <PersonaFigure />
        {/* Сердце-поддержка на чёрном торсе. */}
        <path
          className="mx-persona-red"
          d="M50 123C45.5 119.8 43 117.5 43 115.3A3.5 3.5 0 0 1 50 114.1A3.5 3.5 0 0 1 57 115.3C57 117.5 54.5 119.8 50 123Z"
        />
      </g>
    </svg>
  )
}

// Персонаж у окна браузера — «смотрит на сайт».
function WebArt() {
  return (
    <svg className="mx-profile-banner__art" viewBox="0 0 120 96" aria-hidden="true">
      <rect x="6" y="10" width="78" height="56" rx="8" />
      <path d="M6 24h78" />
      <circle cx="15" cy="17" r="1.6" className="mx-profile-banner__art-fill" />
      <circle cx="22" cy="17" r="1.6" className="mx-profile-banner__art-fill" />
      <path d="M18 38h40M18 48h28" />
      <g transform="translate(76 27) scale(0.44)">
        <PersonaFigure />
      </g>
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
