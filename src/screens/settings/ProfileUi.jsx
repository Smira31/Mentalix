// src/screens/settings/ProfileUi.jsx
//
// Каркас экрана профиля и его под-экранов по эталону Stoic.
// Все размеры — DESIGN_SYSTEM.md §5.4 «Профиль и настройки».
//
// Переведён на <Screen> (PR #965): портал, демо-шапка, скролл-контейнер
// и safe-area — через <Screen>. Липкая шапка с коллапс-заголовком и
// круглая кнопка «Назад» остаются внутри тела <Screen>.

import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import Screen from '../../components/Screen'
import ScreenBack from '../../components/ScreenBack'
import { useBackButton } from '../../platform/telegram.hooks'
import { isTelegramBackMode } from '../../lib/backButtonMode'
import { isDemoEmulationActive } from '../../lib/demoChrome'

import './ProfileUi.css'

/*
 * Крупный заголовок «твой профиль.» при скролле уходит под липкую шапку —
 * тогда в центре шапки появляется маленький на фоне экрана с затуханием
 * вниз (контент уходит под него, а не обрезается). Следим за самим заголовком:
 * IntersectionObserver ловит layout/viewport-изменения, а scroll-listener
 * на скролл-контейнере <Screen> — программный scrollTop (IntersectionObserver
 * в headless Chrome срабатывает по нему ненадёжно).
 */
/*
 * Маленький заголовок появляется ТОЛЬКО когда большой полностью ушёл
 * под шапку (порог = низ большого заголовка). Гистерезис 4 px исключяет
 * мигание на границе: расширение — когда низ заголовка на 4 px ниже шапки.
 */
const COLLAPSE_HYSTERESIS = 4

function useTitleCollapsed(headerRef, titleRef) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const header = headerRef.current
    const title = titleRef.current
    if (!header || !title) return undefined

    const check = () => {
      // Порог — верх липкой шапки (top), не низ surface.
      // Маленький заголовок появляется когда низ большого
      // уходит выше верха шапки — т.е. полностью скрывается.
      const headerTop = Math.max(0, Math.round(header.getBoundingClientRect().top))
      const titleBottom = title.getBoundingClientRect().bottom
      setCollapsed(prev => {
        if (prev) return titleBottom < headerTop + COLLAPSE_HYSTERESIS
        return titleBottom < headerTop
      })
    }

    // Скролл-контейнер <Screen> — .mx-fullscreen-scroll; fallback на старый
    // корень App на случай, если экран ещё не внутри <Screen>.
    const scrollRoot = title.closest('.mx-fullscreen-scroll, .mx-app-scroll-root')
    if (scrollRoot) scrollRoot.addEventListener('scroll', check, { passive: true })

    // ResizeObserver ловит layout/viewport-изменения (поворот, появление
    // клавиатуры), заменяя ненадёжный IntersectionObserver в headless Chrome.
    let resizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(check)
      if (scrollRoot) resizeObserver.observe(scrollRoot)
    }

    check()

    return () => {
      if (scrollRoot) scrollRoot.removeEventListener('scroll', check)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [headerRef, titleRef])

  return collapsed
}

/*
 * В Telegram своих кнопок «закрыть»/«назад» нет — работает нативная
 * «Назад» (как в шторке серии). В Demo Preview её роль играет
 * демо-шапка Telegram. Круглая кнопка рисуется только в web (не демо-режиме).
 *
 * <Screen showHeader={false}> — портал, демо-шапка и скролл берутся из <Screen>,
 * а шапка профиля (липкий коллапс + кнопка) рисуется внутри тела, чтобы
 * сохранить принятую геометрию (кнопка 20px от края, заголовок 34px).
 * Крестик ✕ на корне убран — в Telegram есть своя «Назад».
 */
export function ProfilePage({ title, isRoot = false, onBack, testId, footer, children }) {
  const headerRef = useRef(null)
  const titleRef = useRef(null)
  const collapsed = useTitleCollapsed(headerRef, titleRef)
  const showOwnButton =
    !isTelegramBackMode(
      typeof window === 'undefined' ? null : window.Telegram?.WebApp
    ) && !isDemoEmulationActive()
  useBackButton(onBack, isRoot)

  return (
    <Screen
      onBack={onBack}
      showHeader={false}
      registerSystemBack={false}
      footer={footer}
      footerClassName="mx-profile-page__footer"
    >
      <div
        className={`mx-profile-page${isRoot ? '' : ' mx-profile-page--sub'}${showOwnButton ? ' mx-profile-page--own-button' : ''}`}
        data-testid={testId}
      >
        <div className="mx-profile-page__bar">
          {!isRoot && (
            <ScreenBack
              onBack={onBack}
              testId="profile-close-button"
              className="mx-profile-page__button mx-profile-page__button--back"
            />
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
    </Screen>
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
export function ProfileRow({
  title,
  subtitle,
  value,
  right,
  onClick,
  danger = false,
  testId,
  valueHeading = false,
}) {
  const Component = onClick ? 'button' : 'div'
  const showChevron = Boolean(onClick) && !right
  // valueHeading: значение строки становится заголовком (h3) — нужно,
  // чтобы имя пользователя в «о тебе.» имело роль heading (контракт #648).
  // Вёрстка та же: .mx-profile-row__value обнуляет отступы для заголовка.
  const ValueTag = valueHeading ? 'h3' : 'span'

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
      {value != null && <ValueTag className="mx-profile-row__value">{value}</ValueTag>}
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
