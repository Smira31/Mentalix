import { useEffect, useState, useCallback } from 'react'
import { platform, platformName } from './platform'
import { AlignJustify, House, Sparkles, ChevronLeft, Settings as SettingsIcon } from 'lucide-react'
import Today from './screens/Today'
import Practices from './screens/Practices'
import Analytics from './screens/Analytics'
import MentalixChat from './screens/Mentalix'
import Profile from './screens/Profile'
import Settings from './screens/Settings'
import WebAuthScreen from './screens/WebAuthScreen'

// ── Тема: тёмная вечером, светлая днём. Ручной режим хранится в localStorage ──
const THEME_KEY = 'mx-theme' // 'auto' | 'light' | 'dark'

function isDayNow() {
  const h = new Date().getHours()
  return h >= 6 && h < 18
}

function resolveLight(mode) {
  if (mode === 'light') return true
  if (mode === 'dark') return false
  return isDayNow()
}

function applyTheme(light) {
  document.body.classList.toggle('light', light)
  const bg = light ? '#F5F0E8' : '#0A0A0A'
  platform.setThemeColors?.(bg)
}

function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h <= 11) return 'доброе утро.'
  if (h >= 12 && h <= 17) return 'добрый день.'
  if (h >= 18 && h <= 22) return 'добрый вечер.'
  return 'тихой ночи.'
}

function MonogramIcon({ active }) {
  return (
    <div
      className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
        active ? 'border-cream' : 'border-cream/40'
      }`}
    >
      <span className={`font-display text-[11px] ${active ? 'text-cream' : 'text-cream/40'}`}>M</span>
    </div>
  )
}

const TABS = [
  { key: 'today', label: 'Сегодня', icon: House },
  { key: 'practices', label: 'Практики', icon: Sparkles },
  { key: 'mentor', label: 'Наставник', icon: 'monogram' },
  { key: 'trends', label: 'Тренды', icon: AlignJustify },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [overlay, setOverlay] = useState(null) // null | 'profile' | 'settings'
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_KEY) || 'auto')

  const initialTab = new URLSearchParams(window.location.search).get('tab')
  const validTabs = TABS.map((t) => t.key)
  const [tab, setTab] = useState(validTabs.includes(initialTab) ? initialTab : 'today')
  const [practicesSub, setPracticesSub] = useState(null) // экран внутри «Практик»

  // тема при старте и при смене режима; авто-режим перепроверяется раз в минуту
  useEffect(() => {
    applyTheme(resolveLight(themeMode))
    localStorage.setItem(THEME_KEY, themeMode)
    if (themeMode !== 'auto') return
    const id = setInterval(() => applyTheme(resolveLight('auto')), 60_000)
    return () => clearInterval(id)
  }, [themeMode])

  function cycleTheme() {
    platform.haptic('light')
    setThemeMode((m) => (m === 'auto' ? (isDayNow() ? 'dark' : 'light') : m === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    platform.init()
    ;(async () => {
      const existing = await platform.requestAuth()
      if (existing) setUser(existing)
      setAuthChecked(true)
    })()
  }, [])

  // запрет масштабирования внутри Telegram — единый вид мини-аппа
  useEffect(() => {
    if (platformName !== 'telegram') return
    const stopGesture = (e) => e.preventDefault()
    const stopMultiTouch = (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault()
    }
    let lastTouch = 0
    const stopDoubleTapZoom = (e) => {
      const now = Date.now()
      if (now - lastTouch <= 300) e.preventDefault()
      lastTouch = now
    }
    document.addEventListener('gesturestart', stopGesture, { passive: false })
    document.addEventListener('gesturechange', stopGesture, { passive: false })
    document.addEventListener('gestureend', stopGesture, { passive: false })
    document.addEventListener('touchstart', stopMultiTouch, { passive: false })
    document.addEventListener('touchmove', stopMultiTouch, { passive: false })
    document.addEventListener('touchend', stopDoubleTapZoom, { passive: false })
    return () => {
      document.removeEventListener('gesturestart', stopGesture)
      document.removeEventListener('gesturechange', stopGesture)
      document.removeEventListener('gestureend', stopGesture)
      document.removeEventListener('touchstart', stopMultiTouch)
      document.removeEventListener('touchmove', stopMultiTouch)
      document.removeEventListener('touchend', stopDoubleTapZoom)
    }
  }, [])

  function switchTab(key) {
    if (key === tab) return
    platform.haptic('light')
    setPracticesSub(null)
    setTab(key)
    window.scrollTo({ top: 0 })
  }

  // Сегодня → «Начать» открывает нужный раздел Практик
  const openPractice = useCallback((sub) => {
    platform.haptic('light')
    setPracticesSub(sub || null)
    setTab('practices')
  }, [])

  const goMentor = useCallback(() => {
    platform.haptic('light')
    setTab('mentor')
  }, [])

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-emerald-deep text-cream flex items-center justify-center font-body">
        <p className="text-cream/40 text-sm">Загрузка...</p>
      </div>
    )
  }

  if (!user && platformName === 'web') {
    return (
      <div className="min-h-screen bg-emerald-deep text-cream flex flex-col items-center font-body">
        <WebAuthScreen onAuthed={setUser} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-emerald-deep text-cream flex flex-col items-center font-body">
      {/* ── верхняя панель: тема · приветствие · профиль ── */}
      <div className="w-full max-w-md px-5 pt-5 pb-1 flex items-center justify-between">
        <button
          onClick={cycleTheme}
          aria-label="Переключить тему"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center text-cream/50 text-base active:scale-95 transition-transform"
        >
          ◐
        </button>
        <h1 className="font-display text-xl text-cream lowercase">
          {user && user.first_name ? `${greeting().slice(0, -1)}, ${user.first_name}.` : greeting()}
        </h1>
        <button
          onClick={() => { platform.haptic('light'); setOverlay('profile') }}
          aria-label="Профиль"
          className="w-10 h-10 rounded-full bg-emerald border border-cream/10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <span className="font-display text-sm text-cream/60">
            {user?.first_name ? user.first_name[0].toUpperCase() : 'M'}
          </span>
        </button>
      </div>

      {/* ── контент ── */}
      <div key={overlay || tab} className="flex-1 w-full flex flex-col items-center animate-fade-in pb-28">
        {!user && (
          <p className="text-cream/40 text-sm px-6 text-center pt-8">
            Открой приложение через кнопку в боте, чтобы Менталикс увидел тебя
          </p>
        )}

        {overlay === 'settings' && (
          <Settings user={user} onBack={() => setOverlay('profile')} onNavigate={() => {}} />
        )}

        {overlay === 'profile' && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-md px-5 pb-2 flex items-center justify-between">
              <button
                onClick={() => { platform.haptic('light'); setOverlay(null) }}
                aria-label="Назад"
                className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform"
              >
                <ChevronLeft size={20} className="text-cream/60" />
              </button>
              <span className="font-display text-lg text-cream lowercase">профиль.</span>
              <button
                onClick={() => { platform.haptic('light'); setOverlay('settings') }}
                aria-label="Настройки"
                className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform"
              >
                <SettingsIcon size={18} className="text-cream/60" />
              </button>
            </div>
            <Profile user={user} />
          </div>
        )}

        {!overlay && (
          <>
            {user && tab === 'today' && (
              <Today user={user} onOpenPractice={openPractice} onGoMentor={goMentor} />
            )}
            {user && tab === 'practices' && (
              <Practices user={user} initialSub={practicesSub} />
            )}
            {user && tab === 'mentor' && <MentalixChat user={user} />}
            {user && tab === 'trends' && <Analytics user={user} />}
          </>
        )}
      </div>

      {/* ── таб-бар: 5 вкладок, капсула как у stoic. ── */}
      {user && !overlay && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 max-w-md mx-auto w-full">
          <div className="flex justify-around items-center px-2 py-2 rounded-full border border-cream/10 bg-emerald/90 backdrop-blur-md">
            {TABS.map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => switchTab(t.key)}
                  aria-label={t.label}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'flex flex-col items-center gap-0.5 flex-1 py-2 rounded-full',
                    'transition-all duration-300 ease-out active:scale-90',
                    active ? 'bg-cream/10' : '',
                  ].join(' ')}
                >
                  {t.icon === 'monogram' ? (
                    <MonogramIcon active={active} />
                  ) : (
                    <t.icon
                      size={21}
                      strokeWidth={1.9}
                      className={active ? 'text-cream' : 'text-cream/40'}
                    />
                  )}
                  <span
                    className={[
                      'text-[10px] font-semibold transition-colors duration-300',
                      active ? 'text-cream' : 'text-cream/40',
                    ].join(' ')}
                  >
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
