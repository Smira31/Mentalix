import { createPortal } from 'react-dom'
import '../styles/demo-telegram-header.css'

/* Сегменты демо живут рядом с кнопками Telegram, вне обрезающего scroll-root.
   На телефоне и в production остаётся исходная шапка самого экрана. */
export default function DemoTelegramHeader({ children, active = true }) {
  const frame = document.querySelector("[data-mentalix-demo-frame='true'][data-demo-mode='true']")
  if (!frame) return children
  if (!active) return null

  return createPortal(
    <div className="mx-demo-telegram-header" data-testid="demo-telegram-header">
      {children}
    </div>,
    frame
  )
}
