import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, PenLine, Share2 } from 'lucide-react'

import BackButton from '../components/BackButton'
import PracticeWritingCanvas from '../components/PracticeWritingCanvas'
import {
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
  FULLSCREEN_SHELL_CLASS,
  getFullscreenPortalTarget,
  useFullscreenSurface,
} from '../lib/fullscreenSurface'
import { saveJournalFreeWrite } from '../lib/journalStorage'
import { platform } from '../platform'
import './JournalFlow.css'

const SHARE_APP_URL = 'https://t.me/Mentalix_club_bot/app'

/*
 * «Мысль дня»: мысль крупно и три действия — записать, скопировать,
 * поделиться. «Поделиться» есть только в Telegram (openTelegramLink из SDK).
 * «Назад» — системная кнопка Telegram, в вебе — BackButton.
 */
export default function DailyThoughtScreen({ user, thought, onClose }) {
  const { style: surfaceStyle } = useFullscreenSurface()
  const [mode, setMode] = useState('view')
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)
  const text = thought?.text || ''
  const canShare = platform.name === 'telegram' && typeof platform.openTelegramLink === 'function'

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  function flash(message) {
    clearTimeout(noticeTimer.current)
    setNotice(message)
    noticeTimer.current = setTimeout(() => setNotice(null), 2000)
  }

  async function copy() {
    platform.haptic('light')
    try {
      await navigator.clipboard.writeText(text)
      flash('Скопировано')
    } catch {
      flash('Не получилось скопировать')
    }
  }

  function share() {
    platform.haptic('light')
    const message = `«${text}»\n\n— из моего Mentalix`
    platform.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(SHARE_APP_URL)}&text=${encodeURIComponent(message)}`
    )
  }

  function saveNote() {
    if (!draft.trim()) return
    try {
      saveJournalFreeWrite({ title: text, text: draft.trim(), userId: user?.id })
      platform.haptic('success')
      setDraft('')
      setMode('view')
      flash('Запись сохранена')
    } catch (error) {
      console.error(error)
      platform.haptic('error')
      flash('Не получилось сохранить запись')
    }
  }

  const back = mode === 'write' ? () => setMode('view') : onClose

  return createPortal(
    <div
      className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow mx-practice-flow--journal flex flex-col`}
      style={surfaceStyle}
      data-testid="daily-thought-screen"
    >
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} px-[var(--mx-screen-x)]`}>
        <BackButton key={mode} onClick={back} />
      </div>

      {mode === 'write' ? (
        <PracticeWritingCanvas
          value={draft}
          onChange={setDraft}
          question={text}
          placeholder="Начни писать..."
          ariaLabel={`Запись по мысли дня: ${text}`}
          autoFocus
          onSubmit={saveNote}
          submitLabel="Сохранить запись"
          submitDisabled={!draft.trim()}
          className="journal-flow__writing min-h-0 flex-1"
        />
      ) : (
        <>
          <div
            className={`${FULLSCREEN_SCROLL_CLASS} items-center justify-center px-8 text-center animate-fade-in`}
          >
            <span className="block mx-type-meta text-muted mb-4">Мысль дня</span>
            <p
              className="font-display text-[26px] text-cream leading-snug max-w-md"
              data-testid="daily-thought-text"
            >
              {text}
            </p>
            {thought?.attribution && (
              <p className="mx-type-meta text-faint mt-4">{thought.attribution}</p>
            )}
          </div>

          <div className="w-full max-w-md mx-auto shrink-0 px-[var(--mx-screen-x)] pt-4 pb-7 flex flex-col gap-3">
            <p className="mx-type-meta text-muted text-center min-h-[1.25rem]" role="status">
              {notice}
            </p>
            <button
              type="button"
              className="cta-pill mx-type-flow-action w-full flex items-center justify-center gap-2"
              data-testid="daily-thought-write"
              onClick={() => {
                platform.haptic('light')
                setMode('write')
              }}
            >
              <PenLine size={16} aria-hidden="true" /> Записать мысль
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 min-h-12 rounded-full bg-emerald text-cream mx-type-control flex items-center justify-center gap-2 border-0 active:scale-[0.98] transition-transform"
                data-testid="daily-thought-copy"
                onClick={copy}
              >
                <Copy size={16} aria-hidden="true" /> Копировать
              </button>
              {canShare && (
                <button
                  type="button"
                  className="flex-1 min-h-12 rounded-full bg-emerald text-cream mx-type-control flex items-center justify-center gap-2 border-0 active:scale-[0.98] transition-transform"
                  data-testid="daily-thought-share"
                  onClick={share}
                >
                  <Share2 size={16} aria-hidden="true" /> Поделиться
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>,
    getFullscreenPortalTarget()
  )
}
