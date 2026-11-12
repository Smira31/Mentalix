import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import DemoTelegramHeader from '../../components/DemoTelegramHeader'
import { getFullscreenSnapshot, subscribeFullscreen } from '../../lib/tgFullscreen'

/*
 * Строка сегмента «Аналитика | История» в полосе кнопок Telegram.
 *
 * Демо-рамка: строка уходит порталом в DemoTelegramHeader — как раньше.
 *
 * Telegram fullscreen: строка рендерится порталом прямо в .mx-app-shell,
 * то есть ВНЕ .mx-app-scroll-root (у него overflow-x: clip). Внутри
 * скролл-контейнера iOS WebKit после переключения «Аналитика ↔ История»
 * перестаёт перерисовывать fixed-строку: раскладка и тапы работают, а
 * пиксели не обновляются (will-change: transform не помог — подтверждено
 * владельцем на iPhone 12.11). Координаты и стили строки те же:
 * fixed, top: var(--app-safe-top), по центру, z-index 80 (ниже листов
 * и оверлеев 90+), высота полосы 56.
 *
 * Fullscreen читаем из того же store, что и App (src/lib/tgFullscreen.js):
 * переключение режима обязано пересобрать строку, иначе портал останется
 * в shell после подтверждения compact-режима.
 *
 * В вебе и компактном окне Telegram (без fullscreen) строка остаётся
 * на месте — внутри .mx-progress-segment-bar, как в main.
 */
export default function ProgressSegmentHeader({ children, active = true }) {
  const fullscreen = useSyncExternalStore(subscribeFullscreen, getFullscreenSnapshot, () => false)

  const demoFrame = document.querySelector(
    "[data-mentalix-demo-frame='true'][data-demo-mode='true']"
  )
  if (demoFrame) return <DemoTelegramHeader active={active}>{children}</DemoTelegramHeader>

  if (!fullscreen) return children
  // Открытые вкладки остаются смонтированными: уходя с «Прогресса»,
  // портал обязан исчезнуть, иначе сегмент останется поверх других вкладок.
  if (!active) return null

  const shell = document.querySelector('.mx-app-shell')
  return shell ? createPortal(children, shell) : children
}
