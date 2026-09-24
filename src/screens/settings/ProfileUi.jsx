// src/screens/settings/ProfileUi.jsx
//
// Каркас экрана профиля и его под-экранов по эталону Stoic.
// Все размеры — DESIGN_SYSTEM.md §5.4 «Профиль и настройки».

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { platform, platformName } from '../../platform'
import { useBackButton } from '../../platform/telegram.hooks'
import { isPreviewDemoMode } from '../../lib/demoMode'
import './ProfileUi.css'

/*
 * Крупный заголовок «твой профиль.» при скролле уходит под липкую шапку —
 * тогда в центре шапки появляется маленький на фоне экрана с затуханием
 * вниз (контент уходит под него, а не обрезается). Следим за самим заголовком,
 * а не за scroll-событиями: скроллится корень App, а не этот экран.
 */
function useTitleCollapsed(headerRef, titleRef) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const header = headerRef.current
    const title = titleRef.current
    if (!header || !title || typeof IntersectionObserver === 'undefined') return undefined
    const headerBottom = Math.max(0, Math.round(header.getBoundingClientRect().bottom))
    const observer = new IntersectionObserver(
      ([entry]) =>
        setCollapsed(!entry.isIntersecting && entry.boundingClientRect.top < headerBottom),
      { rootMargin: `-${headerBottom}px 0px 0px 0px`, threshold: 0 }
    )
    observer.observe(title)
    return () => observer.disconnect()
  }, [headerRef, titleRef])

  return collapsed
}

/*
 * В Telegram своих кнопок «закрыть»/«назад» нет — работает нативная
 * «Назад» (как в шторке серии). В Demo Preview её роль играет
 * демо-шапка Telegram. Круглая кнопка рисуется только в web.
 */
export function ProfilePage({ title, isRoot = false, onBack, testId, children }) {
  const headerRef = useRef(null)
  const titleRef = useRef(null)
  const collapsed = useTitleCollapsed(headerRef, titleRef)
  const showOwnButton = platformName !== 'telegram' && !isPreviewDemoMode()

  useBackButton(() => {
    platform.haptic('light')
    onBack?.()
  })

  const ButtonIcon = isRoot ? X : ChevronLeft

  return (
    <div
      className={`mx-profile-page${showOwnButton ? ' mx-profile-page--own-button' : ''}`}
      data-testid={testId}
    >
      <div className="mx-profile-page__bar">
        {showOwnButton && (
          <button
            type="button"
            data-testid="profile-close-button"
            className={`mx-profile-page__button mx-profile-page__button--${isRoot ? 'close' : 'back'}`}
            aria-label={isRoot ? 'Закрыть профиль' : 'Назад'}
            onClick={() => {
              platform.haptic('light')
              onBack?.()
            }}
          >
            <ButtonIcon size={22} aria-hidden="true" />
          </button>
        )}
        <div
          ref={headerRef}
          data-testid="profile-collapsed-bar"
          className={`mx-profile-page__surface${collapsed ? ' mx-profile-page__surface--collapsed' : ''}`}
        >
          <span className="mx-profile-page__bar-title" aria-hidden={!collapsed}>
            {title}
          </span>
        </div>
      </div>
      <h1 ref={titleRef} className="mx-profile-page__title" data-testid="profile-page-title">
        {title}
      </h1>
      {children}
    </div>
  )
}

export function ProfileBody({ children }) {
  return <div className="mx-profile-body">{children}</div>
}

export function ProfileGroup({ label, children }) {
  return (
    <section className="mx-profile-group">
      {label && <h2 className="mx-profile-group__label">{label}</h2>}
      {children}
    </section>
  )
}

export function ProfileCard({ children, testId }) {
  return (
    <div className="mx-profile-card" data-testid={testId}>
      {children}
    </div>
  )
}

export function ProfileNote({ children, role, danger = false }) {
  return (
    <p role={role} className={`mx-profile-note${danger ? ' mx-profile-note--danger' : ''}`}>
      {children}
    </p>
  )
}

/*
 * Строка списка: 50 px, текст слева в 20 px от края карточки, справа —
 * значение жирным и шеврон (у кликабельных) либо свой элемент (right).
 */
export function ProfileRow({ title, subtitle, value, right, onClick, danger = false, testId }) {
  const Component = onClick ? 'button' : 'div'
  const showChevron = Boolean(onClick) && !right

  return (
    <Component
      {...(onClick ? { type: 'button', onClick } : {})}
      data-testid={testId}
      className={`mx-profile-row${danger ? ' mx-profile-row--danger' : ''}`}
    >
      <span className="mx-profile-row__text">
        <span className="mx-profile-row__title">{title}</span>
        {subtitle && <span className="mx-profile-row__subtitle">{subtitle}</span>}
      </span>
      {value != null && <span className="mx-profile-row__value">{value}</span>}
      {right}
      {showChevron && (
        <ChevronRight
          size={14}
          strokeWidth={2.5}
          aria-hidden="true"
          className="mx-profile-row__chevron"
        />
      )}
    </Component>
  )
}

export function ProfileChips({ options, value, onChange, label }) {
  return (
    <div className="mx-profile-chips" role="group" aria-label={label}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="mx-profile-chip"
        >
          {option.label}
          {option.hint && <span className="mx-profile-chip__hint">{option.hint}</span>}
        </button>
      ))}
    </div>
  )
}

export function ProfileVersion({ children }) {
  return <p className="mx-profile-version">{children}</p>
}
