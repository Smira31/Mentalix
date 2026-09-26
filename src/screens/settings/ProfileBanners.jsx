// src/screens/settings/ProfileBanners.jsx
//
// Три баннера в начале «твой профиль.» — DESIGN_SYSTEM.md §5.4 «Баннеры профиля».
// Иллюстрации — готовые файлы владельца, WebP с прозрачным фоном @2x/@3x:
// персонаж лежит в src/assets/profile/, фон прозрачный — прямоугольника
// на карточке нет. alt="" — рядом есть текст, картинка декоративная;
// width/height равны месту на баннере, чтобы вёрстка не прыгала.

import './ProfileBanners.css'
import potentialArt2x from '../../assets/profile/banner-potential@2x.webp'
import potentialArt3x from '../../assets/profile/banner-potential@3x.webp'
import supportArt2x from '../../assets/profile/banner-support@2x.webp'
import supportArt3x from '../../assets/profile/banner-support@3x.webp'
import webArt2x from '../../assets/profile/banner-web@2x.webp'
import webArt3x from '../../assets/profile/banner-web@3x.webp'

function BannerArt({ art2x, art3x, width, height }) {
  return (
    <img
      className="mx-profile-banner__art"
      src={art2x}
      srcSet={`${art2x} 2x, ${art3x} 3x`}
      width={width}
      height={height}
      loading="lazy"
      alt=""
      draggable={false}
    />
  )
}

export function PotentialBanner({ onOpen, stageImage }) {
  return (
    // Тап по всей карточке ведёт туда же, куда кнопка: клик по кнопке всплывает сюда.
    <div
      className="mx-profile-banner mx-profile-banner--potential"
      data-testid="profile-banner-potential"
      onClick={onOpen}
    >
      {/* Персонаж справа снизу, крупный, частично обрезан краем карточки. */}
      <BannerArt art2x={stageImage || potentialArt2x} art3x={stageImage || potentialArt3x} width={200} height={139} />
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
        {/* Персонаж крупнее (видно сердечко), смещён влево отрицательным
            отступом в CSS — внутри WebP он прижат к правому краю холста. */}
        <BannerArt art2x={supportArt2x} art3x={supportArt3x} width={120} height={101} />
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
      {/* Персонаж справа целиком, кадр берёт файл от кончика поднятого
          пальца: в иллюстрации владельца рядом с пальцем нарисована
          маленькая тусклая плашка браузера — персонаж указывает на неё. */}
      <span className="mx-profile-banner__web-character">
        <BannerArt art2x={webArt2x} art3x={webArt3x} width={234} height={162} />
      </span>
      {/* Заголовок как в референсе Stoic: «Mentalix» выделен, «на сайте»
          обычным весом, одним размером шрифта, строка одна. */}
      <span className="mx-profile-banner__title">
        <strong>Mentalix</strong> на сайте
      </span>
      <span className="mx-profile-banner__text">
        Свяжи аккаунт с сайтом, чтобы записи были и в браузере.
      </span>
    </button>
  )
}

export function ProfileBanners({ showWeb, onOpenSubscription, onOpenDonate, onOpenWeb, maskStage, maskNext, maskDaysUntilNext }) {
  return (
    <div className="mx-profile-banners" data-testid="profile-banners">
      <div>
        <PotentialBanner onOpen={onOpenSubscription} stageImage={maskStage?.image} />
        {maskStage && (
          <div className="mx-profile-mask-stage" data-testid="profile-mask-stage">
            <p className="mx-profile-mask-stage__name">{maskStage.name}</p>
            {maskNext && (
              <p className="mx-profile-mask-stage__next">
                До „{maskNext.name}“ — {maskDaysUntilNext} {maskDaysUntilNext === 1 ? 'день' : maskDaysUntilNext < 5 ? 'дня' : 'дней'}
              </p>
            )}
          </div>
        )}
      </div>
      <SupportBanner onOpen={onOpenDonate} />
      {showWeb && <WebBanner onOpen={onOpenWeb} />}
    </div>
  )
}
