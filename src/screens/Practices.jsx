import { useCallback, useEffect, useRef, useState } from 'react'

import { platform } from '../platform'
import { fetchPracticesData, peekPracticesData } from '../lib/practicesDataCache'
import { fetchThemesData, peekThemesData } from '../lib/themesDataCache'
import { buildPracticeViewModels } from '../lib/practiceCatalogRegistry'
import { previewPracticeAction } from '../lib/demoMode'

import PracticeCatalogV2 from '../components/PracticeCatalogV2'

import './PracticeFlow.css'

import Rituals from './Rituals'
import Ascezas from './Ascezas'
import GuidedSelfDiscoveryFlow from './GuidedSelfDiscoveryFlow'
import LilaDiscoverFlow from './LilaDiscoverFlow'
import ThemeCarouselScreen from './ThemeCarouselScreen'
import MoodPractice from './MoodPractice'
import AlterEgo from './AlterEgo'

function PracticesCatalogLoading() {
  return (
    /* Loading state uses role="status" aria-live="polite" for screen readers. */
    <div
      className="mx-practices-catalog-shell mx-practices-catalog-shell--loading w-full max-w-md px-[var(--mx-screen-x)]"
      role="status"
      aria-live="polite"
    >
      <h1 className="font-display mx-type-page text-cream lowercase mb-[28px]">практики.</h1>
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
}) {
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
  const focusedFlowOpen = ['journal', 'self-discovery', 'lila-discover', 'mood'].includes(sub)
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
    return <GuidedSelfDiscoveryFlow userId={user.id} onClose={() => setSub(null)} />
  }

  if (sub === 'self-discovery') {
    return <GuidedSelfDiscoveryFlow userId={user.id} onClose={() => setSub(null)} />
  }

  if (sub === 'lila-discover') {
    return (
      <LilaDiscoverFlow
        userId={user.id}
        onBack={() => setSub(null)}
        onOpenJournal={() => setSub('journal')}
      />
    )
  }

  if (sub === 'mood') {
    return <MoodPractice user={user} onDone={() => setSub(null)} />
  }

  if (sub === 'alter-ego') {
    return <AlterEgo user={user} onBack={() => setSub(null)} />
  }

  if (isLoading) {
    return <PracticesCatalogLoading />
  }

  if (loadError) {
    return (
      <div className="w-full max-w-md px-[var(--mx-screen-x)]" role="alert">
        <h1 className="font-display mx-type-page text-cream lowercase">практики.</h1>
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

  return (
    <div className="mx-practices-catalog-shell w-full max-w-md px-[var(--mx-screen-x)]">
      <h1 className="font-display mx-type-page text-cream lowercase mb-[28px]">практики.</h1>
      <PracticeCatalogV2
        practices={catalogPractices}
        themes={themes}
        themeLoading={themeLoading}
        themesError={themesError}
        onRetryThemes={() => loadThemes({ force: true })}
        onOpenCollection={collection => {
          // Коллекция «Ритуалы»/«Аскезы» ведёт прямо в единый список практик:
          // промежуточного экрана «Твои данные» больше нет.
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
      />
    </div>
  )
}
