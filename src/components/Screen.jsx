import { createPortal } from 'react-dom'

import DemoTelegramChrome from './DemoTelegramChrome'
import { RoundBackButton } from './NestedScreenHeader'
import {
  useFullscreenSurface,
  getFullscreenPortalTarget,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { isDemoEmulationActive } from '../lib/demoChrome'
import { shouldRenderDemoTelegramChrome } from '../lib/demoChrome'
import { isPreviewDemoMode } from '../lib/demoMode'
import { platformName } from '../platform'
import { isRealPhone } from '../lib/demoMode'

import './Screen.css'
import './ui/ui-details.css'

/*
 * <Screen> — единая полноэкранная поверхность для вложенных экранов.
 *
 * Решает все известные баги fullscreen-порталов:
 *  - портал в demo-рамку/body (fullscreenSurface) — экран всегда внутри телефона;
 *  - демо-шапка Telegram в demo-режиме (статус-бар + пилюли);
 *  - «Назад»: системная в Telegram, круглая 43 слева вне Telegram,
 *    регистрация в стеке useBackButton;
 *  - верхний отступ по токену --mx-screen-top (safe-top + 56 + 16);
 *  - нижний safe-area через --app-safe-bottom;
 *  - опции: scroll (по умолчанию) / noScroll / fullFrame.
 *
 * Все новые вложенные экраны должны использовать <Screen>.
 */
export default function Screen({
  children,
  onBack,
  backTestId = 'back-button',
  registerSystemBack = true,
  scroll = true,
  fullFrame = false,
  showHeader = true,
  telegramChrome = false,
  headerSlot,
  footer,
  footerClassName = '',
  className = '',
  bodyClassName = '',
}) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const portalTarget = getFullscreenPortalTarget()

  const demoChrome =
    (telegramChrome && isPreviewDemoMode() && platformName !== 'telegram') ||
    shouldRenderDemoTelegramChrome({
      previewDemoMode: isPreviewDemoMode(),
      platformName,
      realPhone: isRealPhone(),
      deviceFrameMode: Boolean(portalTarget?.getAttribute?.('data-mentalix-demo-frame')),
    })

  const demoHidden = isDemoEmulationActive()

  const bodyClass = scroll
    ? `${FULLSCREEN_SCROLL_CLASS} mx-screen__body ${bodyClassName}`
    : `w-full flex-1 min-h-0 flex flex-col overflow-hidden mx-screen__body mx-screen__body--noscroll ${bodyClassName}`

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-screen ${fullFrame ? 'mx-screen--full-frame' : ''} ${className}`}
      style={
        telegramChrome && isPreviewDemoMode() && platformName !== 'telegram'
          ? {
              ...surfaceStyle,
              paddingTop:
                'calc(max(var(--app-safe-top), var(--demo-statusbar-h, 62px)) + 56px)',
            }
          : surfaceStyle
      }
      data-testid="mx-screen-shell"
    >
      {demoChrome && <DemoTelegramChrome />}

      {showHeader && (
        <div
          className={
            demoHidden
              ? 'contents'
              : `${FULLSCREEN_HEADER_SLOT_CLASS} mx-screen__header flex items-center px-[var(--mx-screen-x)]`
          }
        >
          <RoundBackButton
            onClick={onBack}
            testId={backTestId}
            registerSystemBack={registerSystemBack}
          />
          {headerSlot}
        </div>
      )}

      <div className={bodyClass}>
        <div
          className={`w-full max-w-md mx-auto px-[var(--mx-screen-x)] mx-screen__content ${fullFrame ? 'mx-screen__content--full' : ''}`}
        >
          {children}
        </div>
      </div>

      {footer && (
        <div
          className={`shrink-0 px-[var(--mx-screen-x)] pb-4 mx-screen__footer ${footerClassName}`}
        >
          <div className="w-full max-w-md mx-auto">{footer}</div>
        </div>
      )}
    </div>,
    portalTarget
  )
}
