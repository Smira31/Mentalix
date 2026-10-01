// src/screens/settings/ProfileBanners.jsx
//
// Три баннера в начале «твой профиль.» — DESIGN_SYSTEM.md §5.4 «Баннеры профиля».
// Геометрия как у Stoic (решение владельца, PR #929), тексты — свои из main.
// Рисунки — свои SVG без персонажей: ProfileBannerArt.jsx; картинки-демоны
// (src/assets/profile/*.webp) убраны.
// alt не нужен: рисунки декоративные, aria-hidden внутри SVG.
// PR2: строка «Держит форму — До „Находит путь" — N дня» убрана.

import './ProfileBanners.css'
import { PotentialLockArt, SupportGiftArt, ProfileFeatherArt } from './ProfileBannerArt'

export function PotentialBanner({ onOpen }) {
  return (
    // Тап по всей карточке ведёт туда же, куда кнопка: клик по кнопке всплывает сюда.
    <div
      className="mx-profile-banner mx-profile-banner--potential"
      data-testid="profile-banner-potential"
      onClick={onOpen}
    >
      {/* Замок справа снизу, обрезан нижним краем карточки, под текстом. */}
      <PotentialLockArt />
      <h2 className="mx-profile-banner__title">Открой весь потенциал Mentalix</h2>
      {/* «Mentalix Pro» не разрывается переносом строки. */}
      <p className="mx-profile-banner__text">
        {'Собеседники без ограничений, курсы и полная аналитика в Mentalix\u00A0Pro'}
      </p>
      <button
        type="button"
        className="mx-profile-banner__pill"
        data-testid="profile-banner-potential-button"
      >
        Смотреть тарифы
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
      {/* Справа полоса-«коробка»: лента с бантом. */}
      <span className="mx-profile-banner__panel">
        <SupportGiftArt />
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
      {/* Перо справа сверху, обрезано верхним краем карточки. */}
      <ProfileFeatherArt />
      {/* Заголовок как в референсе Stoic: «Mentalix» выделен, «на сайте»
          обычным весом, одним размером шрифта, строка одна. */}
      <span className="mx-profile-banner__title">
        <strong>Mentalix</strong> на сайте
      </span>
      <span className="mx-profile-banner__text">
        Свяжи аккаунт с сайтом, чтобы записи были и в браузере.
      </span>
      <span className="mx-profile-banner__chevron" aria-hidden="true">
        ›
      </span>
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
