import { useCallback, useEffect, useRef, useState } from 'react'

import { platform } from '../platform'
import { api } from '../lib/api'
import { fetchPracticesData, peekPracticesData } from '../lib/practicesDataCache'
import { PRACTICE_KEYS, isPracticeAvailable } from '../config/practiceAvailability'
import { readOneOffPracticeHistory } from '../lib/oneOffPracticeHistory'
import { localDayId } from '../lib/morningPilot'
import { buildPracticeViewModels } from '../lib/practiceCatalogRegistry'

import PracticeCatalogV2 from '../components/PracticeCatalogV2'
import BackButton from '../components/BackButton'

import './PracticeFlow.css'

import Rituals from './Rituals'
import Ascezas from './Ascezas'
import BrainTrainer from './BrainTrainer'
import Focus from './Focus'
import Breathing from './Breathing'
import FirstStepFlow from './FirstStepFlow'
import MeditationFlow from './MeditationFlow'
import GuidedSelfDiscoveryFlow from './GuidedSelfDiscoveryFlow'
import LilaDiscoverFlow from './LilaDiscoverFlow'
import ProcrastinationFlow from './ProcrastinationFlow'
import NarrowFocusFlow from './NarrowFocusFlow'
import FinishFlow from './FinishFlow'
import ThemeScreen from './ThemeScreen'

export default function Practices({ user, initialSub = null, onGameChange, onReturnToToday }) {
  const [sub, setSub] = useState(initialSub)
  const [selectedCollectionKey, setSelectedCollectionKey] = useState(null)

  const returnToPracticeOrigin = () => setSub(null)

  const focusedFlowOpen = [
    'first-step',
    'no-blame',
    'narrow-focus',
    'one-finish',
    'meditation',
    'journal',
    'self-discovery',
    'lila-discover',
  ].includes(sub)

  useEffect(() => {
    onGameChange?.(focusedFlowOpen)

    return () => onGameChange?.(false)
  }, [focusedFlowOpen, onGameChange])

  const [initialPracticesData] = useState(() => (user ? peekPracticesData(user.id) : null))
  const [rituals, setRituals] = useState(initialPracticesData?.rituals ?? [])
  const [ascezas, setAscezas] = useState(initialPracticesData?.ascezas ?? [])
  const [themes, setThemes] = useState([])
  const [themeLoading, setThemeLoading] = useState(true)
  const [themesError, setThemesError] = useState(false)
  const themeRequestRef = useRef(0)
  const [selectedThemeId, setSelectedThemeId] = useState(null)
  const [isLoading, setIsLoading] = useState(!initialPracticesData)
  const [loadError, setLoadError] = useState(null)
  const completedToday = new Set(
    readOneOffPracticeHistory(user?.id)
      .filter(entry => entry.day === localDayId(new Date()))
      .map(entry => entry.practiceKey)
  )

  /*
   * initialSub приходит из навигации (открыть Practices сразу на
   * конкретном экране) — синхронизация с внешним пропом, без побочных
   * эффектов, поэтому во время рендера, а не в useEffect.
   */
  const [seenInitialSub, setSeenInitialSub] = useState(initialSub)
  if (seenInitialSub !== initialSub) {
    setSeenInitialSub(initialSub)
    setSub(initialSub)
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

  const loadThemes = useCallback(async () => {
    if (!user) return

    const requestId = ++themeRequestRef.current
    setThemeLoading(true)
    setThemesError(false)

    try {
      const themesData = await api.themes.list(user.id)
      const list = Array.isArray(themesData) ? themesData : []
      // MXL-525 G5: текущая неделя (is_current) должна идти первой в карусели.
      const sorted = list
        .slice()
        .sort((a, b) => (b.is_current === true ? 1 : 0) - (a.is_current === true ? 1 : 0))
      const currentTheme = sorted[0]

      if (!currentTheme) {
        if (themeRequestRef.current === requestId) setThemes([])
        return
      }

      const detail = await api.themes.get(currentTheme.id, user.id)
      if (themeRequestRef.current !== requestId) return

      setThemes([{ ...currentTheme, ...detail }])
      setThemesError(false)
    } catch {
      if (themeRequestRef.current !== requestId) return
      setThemes([])
      setThemesError(true)
    } finally {
      if (themeRequestRef.current === requestId) setThemeLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user || sub !== null) return
    Promise.resolve().then(loadThemes)

    return () => {
      themeRequestRef.current += 1
    }
  }, [loadThemes, sub, user])

  if (selectedThemeId) {
    return (
      <ThemeScreen user={user} themeId={selectedThemeId} onBack={() => setSelectedThemeId(null)} />
    )
  }

  if (sub === 'rituals') {
    return <Rituals user={user} onBack={() => setSub(null)} />
  }

  if (sub === 'ascezas') {
    return <Ascezas user={user} onBack={() => setSub(null)} />
  }

  if (sub === 'first-step') {
    return (
      <FirstStepFlow
        userId={user.id}
        onClose={returnToPracticeOrigin}
        onComplete={returnToPracticeOrigin}
      />
    )
  }

  if (sub === 'meditation') {
    return <MeditationFlow onClose={() => setSub(null)} />
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

  if (sub === 'no-blame') {
    return (
      <ProcrastinationFlow
        userId={user.id}
        onClose={returnToPracticeOrigin}
        onComplete={returnToPracticeOrigin}
      />
    )
  }

  if (sub === 'narrow-focus') {
    return (
      <NarrowFocusFlow
        userId={user.id}
        onClose={returnToPracticeOrigin}
        onComplete={returnToPracticeOrigin}
      />
    )
  }

  if (sub === 'one-finish') {
    return (
      <FinishFlow
        userId={user.id}
        onClose={returnToPracticeOrigin}
        onComplete={returnToPracticeOrigin}
      />
    )
  }

  if (sub === 'brain') {
    return <BrainTrainer user={user} onBack={() => setSub(null)} onActiveChange={onGameChange} />
  }

  if (sub === 'breathing') {
    return <Breathing user={user} onBack={() => setSub(null)} />
  }

  if (sub === 'focus') {
    return (
      <div className="w-full flex flex-col items-center">
        {/* MXL-PRACTICES-FOCUS-CRASH: SubHeader был удалён при переводе
            на PracticeCatalogV2 (dfa6c0e8) — здесь использовался
            несуществующий компонент и «Фокус» падал с ReferenceError.
            Возврат — через общий BackButton (Telegram: системная кнопка). */}
        <div className="w-full max-w-md px-5 flex items-start">
          <BackButton onClick={() => setSub(null)} label="Назад" />
        </div>

        <Focus user={user} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-md px-5" role="status" aria-live="polite">
        <h1 className="font-display mx-type-page text-cream lowercase">практики.</h1>
        <p className="mt-6 text-[13px] leading-relaxed text-muted">Загружаю практики…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full max-w-md px-5" role="alert">
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

  const catalogPractices = buildPracticeViewModels({ rituals, ascezas, completedToday })

  return (
    <div className="mx-practices-catalog-shell w-full max-w-md px-5">
      <div className="mx-practices-catalog-title w-full grid grid-cols-[1fr_auto_1fr] items-center min-h-[42px] mb-[28px]">
        <span aria-hidden="true" />
        <h1 className="font-display mx-type-page text-cream lowercase">практики.</h1>
        <span aria-hidden="true" />
      </div>
      <PracticeCatalogV2
        practices={catalogPractices}
        rituals={rituals}
        ascezas={ascezas}
        themes={themes}
        themeLoading={themeLoading}
        themesError={themesError}
        selectedCollectionKey={selectedCollectionKey}
        onCollectionChange={setSelectedCollectionKey}
        onOpenPractice={(practice, collectionKey = null) => {
          platform.haptic('light')
          if (practice.key === 'lila-discover') {
            setSelectedCollectionKey(null)
            setSub('lila-discover')
            return
          }
          setSelectedCollectionKey(collectionKey)
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
