import { useEffect, useRef } from 'react'
import Screen from './Screen'
import { useBackButton } from '../platform/telegram.hooks'
import { useSheetSwipeDown } from '../lib/gestures/useSheetSwipeDown'

export default function ArticleSheet({ article, onClose, onRead }) {
  const ref = useRef(null)
  const readRef = useRef(null)
  useBackButton(onClose)
  useSheetSwipeDown(ref, onClose)
  useEffect(() => {
    const previous = document.activeElement
    readRef.current?.focus({ preventScroll: true })
    const onKey = event => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        event.preventDefault()
        readRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.({ preventScroll: true })
    }
  }, [onClose])
  return (
    <Screen
      showHeader={false}
      scroll={false}
      fullFrame
      className="mx-library-sheet-surface"
      bodyClassName="mx-library-sheet-body"
    >
      <button
        type="button"
        className="mx-library-sheet-backdrop"
        aria-label="Закрыть статью"
        data-testid="article-sheet-backdrop"
        onClick={onClose}
      />
      <section
        ref={ref}
        className="mx-library-sheet mx-glass mx-sheet-enter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-sheet-title"
        data-testid="article-sheet"
      >
        <div className="mx-library-sheet-handle" aria-hidden="true" />
        <p className="mx-library-caps">{article.tag || article.category || 'Статья'}</p>
        <h2 id="article-sheet-title" className="mx-type-hero">
          {article.title}
        </h2>
        <p className="mx-type-body text-muted">{article.excerpt}</p>
        <p className="mx-type-meta text-muted">{article.minutes} мин чтения</p>
        <button
          ref={readRef}
          type="button"
          className="mx-library-action mx-type-control"
          data-testid="article-sheet-read"
          onClick={onRead}
        >
          Читать
        </button>
      </section>
    </Screen>
  )
}
