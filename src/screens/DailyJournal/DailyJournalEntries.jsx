import { useCallback, useEffect, useRef, useState } from 'react'

import Screen from '../../components/Screen'
import CapsLabel from '../../components/ui/CapsLabel'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import { api } from '../../lib/api'

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatRussianDate(dateStr) {
  const d = parseDate(dateStr)
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`
}

function stripLeadingTimestamp(text) {
  if (!text) return text
  return text.replace(/^\d{1,2}\s+\S+,\s\d{2}:\d{2}\.\s*/, '')
}

function firstLines(text, n) {
  if (!text) return ''
  const stripped = stripLeadingTimestamp(text)
  const lines = stripped.split('\n').filter(l => l.trim())
  return lines.slice(0, n).join('\n')
}

export default function DailyJournalEntries({ userId, onBack }) {
  const [view, setView] = useState('list')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [entryLoading, setEntryLoading] = useState(false)
  const sentinelRef = useRef(null)

  const loadEntries = useCallback(async (before) => {
    const res = await api.dailyJournal.entries(userId, { limit: 30, before })
    return res
  }, [userId])

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const res = await loadEntries()
        if (cancelled) return
        setEntries(res.items || [])
        setHasMore((res.items || []).length >= 30)
      } catch (err) {
        console.error('[dailyJournal] entries load failed', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [loadEntries])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || entries.length === 0) return
    setLoadingMore(true)
    try {
      const lastDate = entries[entries.length - 1].date
      const res = await loadEntries(lastDate)
      setEntries(prev => [...prev, ...(res.items || [])])
      setHasMore((res.items || []).length >= 30)
    } catch (err) {
      console.error('[dailyJournal] entries load more failed', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, entries, loadEntries])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (view !== 'list') return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [view, loadMore])

  function openEntry(entry) {
    platform.haptic('light')
    setSelectedEntry(entry)
    setView('entry')
    // Fetch full entry if needed (list item may be truncated)
    if (entry.id != null) {
      setEntryLoading(true)
      api.dailyJournal.getEntry(entry.id, userId)
        .then(full => { setSelectedEntry(full) })
        .catch(err => console.error('[dailyJournal] getEntry failed', err))
        .finally(() => setEntryLoading(false))
    }
  }

  function handleBack() {
    if (view === 'entry') {
      setView('list')
      return
    }
    onBack()
  }

  useBackButton(handleBack)

  // ── Entry view (read-only) ──
  if (view === 'entry' && selectedEntry) {
    const e = selectedEntry
    const streamText = stripLeadingTimestamp(e.stream_text || '')
    return (
      <Screen onBack={handleBack} scroll>
        <div className="mx-dj-entry-view" data-testid="dj-entry-view">
          <CapsLabel className="mx-dj-entry-view__label">
            {formatRussianDate(e.date)} · ДЕНЬ {e.day_number}
          </CapsLabel>
          {streamText.trim() && (
            <div className="mx-dj-entry-view__section">
              <CapsLabel className="mx-dj-entry-view__section-label">Поток</CapsLabel>
              <p className="mx-dj-entry-view__text">{streamText}</p>
            </div>
          )}
          {e.prompt_text && (
            <div className="mx-dj-entry-view__section">
              <p className="mx-dj-entry-view__question">{e.prompt_text}</p>
              <p className="mx-dj-entry-view__text">{e.prompt_answer || ''}</p>
            </div>
          )}
        </div>
      </Screen>
    )
  }

  // ── List view ──
  return (
    <Screen onBack={handleBack} scroll>
      <div className="mx-dj-entries" data-testid="dj-entries">
        <CapsLabel className="mx-dj-entries__label">МОИ ЗАПИСИ</CapsLabel>
        {loading && (
          <div className="mx-dj-entries__loading">Загрузка…</div>
        )}
        {!loading && entries.length === 0 && (
          <div className="mx-dj-entries__empty" data-testid="dj-entries-empty">
            Здесь будут твои страницы. Первая — сегодня.
          </div>
        )}
        {!loading && entries.length > 0 && (
          <div className="mx-dj-entries__list">
            {entries.map(entry => (
              <button
                key={entry.id}
                type="button"
                className="mx-dj-entries__item"
                data-testid={`dj-entry-row-${entry.id}`}
                onClick={() => openEntry(entry)}
              >
                <div className="mx-dj-entries__item-header">
                  <span className="mx-dj-entries__item-date">
                    {formatRussianDate(entry.date)}
                  </span>
                  <span className="mx-dj-entries__item-day">день {entry.day_number}</span>
                </div>
                {firstLines(entry.stream_text, 2) && (
                  <p className="mx-dj-entries__item-stream">
                    {firstLines(entry.stream_text, 2)}
                  </p>
                )}
                {entry.prompt_text && (
                  <p className="mx-dj-entries__item-question">{entry.prompt_text}</p>
                )}
              </button>
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="mx-dj-entries__sentinel">
                {loadingMore && '…'}
              </div>
            )}
          </div>
        )}
      </div>
    </Screen>
  )
}
