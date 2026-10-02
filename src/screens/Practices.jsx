import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, ArrowRight } from 'lucide-react'

import { platform } from '../platform'
import { fetchPracticesData, peekPracticesData } from '../lib/practicesDataCache'
import { fetchThemesData, peekThemesData } from '../lib/themesDataCache'
import { useTabRefresh, useTabReset } from '../lib/tabRefresh'
import { buildPracticeViewModels } from '../lib/practiceCatalogRegistry'
import { previewPracticeAction } from '../lib/demoMode'

import PracticeCatalogV2 from '../components/PracticeCatalogV2'
import SemanticGlyph from '../components/SemanticGlyph'

import './PracticeFlow.css'

const PRACTICE_SEARCH_STYLES = `
.mx-steps-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}
.mx-steps-search-btn {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #f3f3f3;
  cursor: pointer;
}
.mx-steps-search-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  flex-direction: column;
  background: #000;
}
.mx-steps-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: max(var(--app-safe-top, env(safe-area-inset-top, 0px)), 16px) 16px 12px;
}
.mx-steps-search-input {
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #333;
  border-radius: 999px;
  background: #1a1a1a;
  color: #f3f3f3;
  font-size: 16px;
  outline: none;
}
.mx-steps-search-input::placeholder { color: #666; }
.mx-steps-search-close {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #f3f3f3;
  cursor: pointer;
}
.mx-steps-search-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}
.mx-steps-search-result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 0;
  border-bottom: 1px solid #1a1a1a;
  background: transparent;
  color: #f3f3f3;
  text-align: left;
  cursor: pointer;
}
.mx-steps-search-result span {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 50%;
  background: #1a1a1a;
  flex-shrink: 0;
}
.mx-steps-search-result span .mx-semantic-glyph { width: 80%; height: 80%; }
.mx-steps-search-result strong { font-size: 16px; font-weight: 500; }
.mx-steps-search-empty { padding: 40px 16px; text-align: center; color: #666; font-size: 14px; }
`

function PracticeSearchOverlay({ practices, themes, onOpenPractice, onOpenTheme, onClose }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const matchedPractices = q
    ? practices.filter(
        p =>
          !p.soon && (p.title?.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q))
      )
    : []
  const matchedThemes = q
    ? themes.filter(
        t => t.title?.toLowerCase().includes(q) || t.subtitle?.toLowerCase().includes(q)
      )
    : []

  return (
    <div className="mx-steps-search-overlay">
      <div className="mx-steps-search-bar">
        <input
          type="search"
          placeholder="Поиск практик и тем"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          className="mx-steps-search-input"
        />
        <button
          type="button"
          className="mx-steps-search-close"
          aria-label="Закрыть поиск"
          onClick={onClose}
        >
          <ArrowRight size={20} />
        </button>
      </div>
      <div className="mx-steps-search-results">
        {q && matchedPractices.length === 0 && matchedThemes.length === 0 && (
          <p className="mx-steps-search-empty">Ничего не найдено.</p>
        )}
        {matchedPractices.map(p => (
          <button
            type="button"
            key={p.key}
            className="mx-steps-search-result"
            onClick={() => {
              onOpenPractice(p)
              onClose()
            }}
          >
            <span aria-hidden="true">
              <SemanticGlyph kind={p.kind || 'journal'} animated={false} />
            </span>
            <strong>{p.title}</strong>
          </button>
        ))}
        {matchedThemes.map(t => (
          <button
            type="button"
            key={t.id}
            className="mx-steps-search-result"
            onClick={() => {
              onOpenTheme(t)
              onClose()
            }}
          >
            <span aria-hidden="true">
              <SemanticGlyph kind="journal" animated={false} />
            </span>
            <strong>{t.title}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}

import Rituals from './Rituals'
import Ascezas from './Ascezas'
import DailyJournalFlow from './DailyJournal/DailyJournalFlow'
import DaimonFlow from './Daimon/DaimonFlow'
import ThemeCarouselScreen from './ThemeCarouselScreen'

function PracticesCatalogLoading() {
  return (
    /* Loading state uses role="status" aria-live="polite" for screen readers. */
    <div
      className="mx-practices-catalog-shell mx-practices-catalog-shell--loading w-full max-w-md px-[var(--mx-screen-x)]"
      role="status"
      aria-live="polite"
    >
      <div className="mx-steps-header-row">
        <h1 className="font-display mx-type-page text-cream lowercase">практики.</h1>
      </div>
      <div className="mx-practices-catalog-loading" aria-hidden="true">
        <span className="mx-practices-catalog-loading__hero" />
        <span className="mx-practices-catalog-loading__label" />
        <div className="mx-practices-catalog-loading__rail">
          <span />
          <span />
          <span />
        </div>
      </div>
      <span className="sr-only">Загружаю практики…</span>
    </div>
  )
}

export default function Practices({
  user,
  initialSub = null,
  onGameChange,
  onRegisterBack,
  onReturnToToday,
  onGuestLogin,
}) {
  const [searchOpen, setSearchOpen] = useState(false)

  // Инъекция стилей шапки/поиска (один раз)
  const styleInjected = useRef(false)
  if (!styleInjected.current) {
    styleInjected.current = true
    if (typeof document !== 'undefined') {
      const el = document.createElement('style')
      el.textContent = PRACTICE_SEARCH_STYLES
      document.head.appendChild(el)
    }
  }

  const [sub, setSub] = useState(() => {
    if (initialSub) return initialSub
    const action = previewPracticeAction()
    if (action === 'rituals_list' || action === 'ritual_detail') return 'rituals'
    if (action === 'ascezas_list' || action === 'asceza_detail') return 'ascezas'
    return null
  })
  // Откуда открыт список: внешний вход (из «Сегодня») или коллекция каталога
  // «Шагов». «Назад» возвращает именно туда, откуда пришли.
  const [enteredFromToday, setEnteredFromToday] = useState(() => initialSub != null)

  const backToList = useCallback(() => {
    if (enteredFromToday) {
      setEnteredFromToday(false)
      onReturnToToday?.()
      return
    }
    setSub(null)
  }, [enteredFromToday, onReturnToToday])

  const [initialPracticesData] = useState(() => (user ? peekPracticesData(user.id) : null))
  const [initialThemesData] = useState(() => (user ? peekThemesData(user.id) : null))
  const [rituals, setRituals] = useState(initialPracticesData?.rituals ?? [])
  const [ascezas, setAscezas] = useState(initialPracticesData?.ascezas ?? [])
  const [themes, setThemes] = useState(initialThemesData ?? [])
  const [themeLoading, setThemeLoading] = useState(!initialThemesData)
  const [themesError, setThemesError] = useState(false)
  const themeRequestRef = useRef(0)
  const [selectedThemeId, setSelectedThemeId] = useState(null)
  const [isLoading, setIsLoading] = useState(!initialPracticesData)
  const [loadError, setLoadError] = useState(null)
  const focusedFlowOpen = ['journal', 'daimon'].includes(sub)
  const nestedFlowOpen = focusedFlowOpen || Boolean(selectedThemeId)

  useEffect(() => {
    onGameChange?.(nestedFlowOpen)

    return () => onGameChange?.(false)
  }, [nestedFlowOpen, onGameChange])

  useEffect(() => {
    const handler = selectedThemeId ? () => setSelectedThemeId(null) : sub ? backToList : null

    onRegisterBack?.(handler)

    return () => onRegisterBack?.(null)
  }, [backToList, onRegisterBack, selectedThemeId, sub])
  /*
   * initialSub приходит из навигации (открыть Practices сразу на
   * конкретном экране) — синхронизация с внешним пропом, без побочных
   * эффектов, поэтому во время рендера, а не в useEffect.
   */
  const [seenInitialSub, setSeenInitialSub] = useState(initialSub)
  if (seenInitialSub !== initialSub) {
    setSeenInitialSub(initialSub)
    setSub(initialSub)
    setEnteredFromToday(initialSub != null)
  }

  const loadPractices = useCallback(
    async (force = false) => {
      if (!user) return

      setIsLoading(true)
      setLoadError(null)
      try {
        const { rituals: ritualsData, ascezas: ascezasData } = await fetchPracticesData(user.id, {
          force,
        })
        setRituals(ritualsData)
        setAscezas(ascezasData)
      } catch (error) {
        setLoadError(error)
      } finally {
        setIsLoading(false)
      }
    },
    [user]
  )

  useEffect(() => {
    if (!user || sub !== null || initialPracticesData) return
    Promise.resolve().then(() => loadPractices())
  }, [initialPracticesData, loadPractices, sub, user])

  const loadThemes = useCallback(
    async ({ force = false } = {}) => {
      if (!user) return

      const requestId = ++themeRequestRef.current
      setThemeLoading(true)
      setThemesError(false)

      try {
        const themesData = await fetchThemesData(user.id, { force })
        if (themeRequestRef.current !== requestId) return

        setThemes(themesData)
        setThemesError(false)
      } catch {
        if (themeRequestRef.current !== requestId) return
        setThemes([])
        setThemesError(true)
      } finally {
        if (themeRequestRef.current === requestId) setThemeLoading(false)
      }
    },
    [user]
  )

  useEffect(() => {
    if (!user || sub !== null || initialThemesData) return
    Promise.resolve().then(() => loadThemes())

    return () => {
      themeRequestRef.current += 1
    }
  }, [initialThemesData, loadThemes, sub, user])

  // Тихий фоновый рефетч без скелетона и loading — для возврата на вкладку
  // и закрытия вложенного экрана (Rituals/Ascezas могли изменить данные).
  const silentRefreshPractices = useCallback(async () => {
    if (!user) return
    try {
      const { rituals: ritualsData, ascezas: ascezasData } = await fetchPracticesData(user.id, {
        force: true,
      })
      setRituals(ritualsData)
      setAscezas(ascezasData)
    } catch {
      /* сохраняем текущие данные при сбое сети */
    }
  }, [user])

  const silentRefreshThemes = useCallback(async () => {
    if (!user) return
    try {
      const themesData = await fetchThemesData(user.id, { force: true })
      setThemes(themesData)
    } catch {
      /* сохраняем текущие темы при сбое сети */
    }
  }, [user])

  // Возврат на уже открытую вкладку или из фона — тихое обновление
  useTabRefresh('practices', () => {
    silentRefreshPractices()
    silentRefreshThemes()
  })

  // Повторный тап по активной вкладке «Шаги» — сброс на главный экран каталога
  useTabReset('practices', () => {
    setSub(null)
    setEnteredFromToday(false)
    setSelectedThemeId(null)
  })

  // Закрытие вложенного экрана (Rituals/Ascezas) — тихо обновляем каталог
  const prevSub = useRef(sub)
  useEffect(() => {
    if (prevSub.current !== null && sub === null) {
      silentRefreshPractices()
    }
    prevSub.current = sub
  }, [sub, silentRefreshPractices])

  if (selectedThemeId) {
    return (
      <ThemeCarouselScreen
        user={user}
        themeId={selectedThemeId}
        onBack={() => setSelectedThemeId(null)}
      />
    )
  }

  if (sub === 'rituals') {
    return <Rituals user={user} onBack={backToList} />
  }

  if (sub === 'ascezas') {
    return <Ascezas user={user} onBack={backToList} />
  }

  if (sub === 'journal') {
    return <DailyJournalFlow userId={user.id} onClose={backToList} />
  }

  if (sub === 'daimon') {
    return <DaimonFlow userId={user.id} onClose={() => setSub(null)} onGuestLogin={onGuestLogin} />
  }

  // Убранные практики (Настроение, Альтер-эго) — мягкий редирект на «Сегодня»
  // LilaDiscoverFlow и GuidedSelfDiscoveryFlow удалены — редирект на Даймон
  const REMOVED_SUBS = new Set(['mood', 'alter-ego'])
  const REDIRECT_TO_DAIMON = new Set(['lila-discover', 'self-discovery'])
  if (REDIRECT_TO_DAIMON.has(sub)) {
    setSub('daimon')
    return null
  }
  if (REMOVED_SUBS.has(sub)) {
    onReturnToToday?.()
    return null
  }

  if (isLoading) {
    return <PracticesCatalogLoading />
  }

  if (loadError) {
    return (
      <div className="w-full max-w-md px-[var(--mx-screen-x)]" role="alert">
        <div className="mx-steps-header-row">
          <h1 className="font-display mx-type-page text-cream lowercase">практики.</h1>
        </div>
        <p className="mt-6 text-[13px] leading-relaxed text-muted">
          Не удалось загрузить практики. Попробуйте ещё раз.
        </p>
        <button
          type="button"
          onClick={() => loadPractices(true)}
          className="mt-5 min-h-11 rounded-full bg-cream px-4 py-2 text-[13px] font-semibold text-emerald-deep"
        >
          Повторить
        </button>
      </div>
    )
  }

  const catalogPractices = buildPracticeViewModels({ rituals, ascezas })

  if (searchOpen) {
    return (
      <div className="mx-practices-catalog-shell w-full max-w-md px-[var(--mx-screen-x)]">
        <PracticeSearchOverlay
          practices={catalogPractices}
          themes={themes}
          onOpenPractice={practice => {
            platform.haptic('light')
            setSub(practice.sub)
          }}
          onOpenTheme={theme => {
            platform.haptic('light')
            setSelectedThemeId(theme.id)
          }}
          onClose={() => setSearchOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="mx-practices-catalog-shell w-full max-w-md px-[var(--mx-screen-x)]">
      <div className="mx-steps-header-row">
        <h1 className="font-display mx-type-page text-cream lowercase">практики.</h1>
        <button
          type="button"
          className="mx-steps-search-btn"
          aria-label="Открыть поиск"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={20} strokeWidth={1.5} />
        </button>
      </div>
      <PracticeCatalogV2
        practices={catalogPractices}
        themes={themes}
        themeLoading={themeLoading}
        themesError={themesError}
        onRetryThemes={() => loadThemes({ force: true })}
        onOpenCollection={collection => {
          platform.haptic('light')
          if (collection.source) setSub(collection.source)
        }}
        onOpenPractice={practice => {
          platform.haptic('light')
          setSub(practice.sub)
        }}
        onOpenJournal={() => {
          platform.haptic('light')
          setSub('journal')
        }}
        onOpenTheme={theme => {
          platform.haptic('light')
          setSelectedThemeId(theme.id)
        }}
        onOpenAllThemes={() => {
          platform.haptic('light')
          if (themes[0]) setSelectedThemeId(themes[0].id)
        }}
      />
    </div>
  )
}
