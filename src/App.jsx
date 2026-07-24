import { useEffect, useState } from 'react'
import { platform, platformName } from './platform'
import { ArrowUpRight, AlignJustify, User, Settings as SettingsIcon, House, BookOpen, Timer as Focus_ } from 'lucide-react'
import Today from './screens/Today'
import Path from './screens/Path'
import Analytics from './screens/Analytics'
import MentalixChat from './screens/Mentalix'
import Profile from './screens/Profile'
import Settings from './screens/Settings'
import Courses from './screens/Courses'
import Focus from './screens/Focus'
import WebAuthScreen from './screens/WebAuthScreen'

function MonogramIcon({ active }) {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        active ? 'border-emerald-deep' : 'border-mint/70'
      }`}
    >
      <span className={`font-display text-xs ${active ? 'text-emerald-deep' : 'text-mint/70'}`}>M</span>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h <= 11) return 'Доброе утро'
  if (h >= 12 && h <= 17) return 'Добрый день'
  if (h >= 18 && h <= 22) return 'Добрый вечер'
  return 'Доброй ночи'
}

const TABS = [
  { key: 'today', label: 'Сегодня', icon: House },
  { key: 'path', label: 'Мой путь', icon: ArrowUpRight },
  { key: 'focus', label: 'Фокус', icon: Focus_ },
  { key: 'analytics', label: 'Аналитика', icon: AlignJustify },
  { key: 'courses', label: 'Курсы', icon: BookOpen },
  { key: 'mentalix', label: 'Mentalix', icon: 'monogram' },
  { key: 'profile', label: 'Профиль', icon: User },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const initialTab = new URLSearchParams(window.location.search).get('tab')
  const validTabs = ['today', 'path', 'focus', 'analytics', 'courses', 'mentalix', 'profile']
  const [tab, setTab] = useState(validTabs.includes(initialTab) ? initialTab : 'today')

  useEffect(() => {
    platform.init()
    ;(async () => {
      const existing = await platform.requestAuth()
      if (existing) setUser(existing)
      setAuthChecked(true)
    })()
  }, [])

  // запрещаем масштабирование пальцами внутри Telegram — единый вид мини-аппа.
  // в браузере (веб-версия) это отключено, чтобы не ломать привычные жесты
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
    setTab(key)
  }

  if (!authChecked) {
    return (
      <div
        className="min-h-screen text-cream flex items-center justify-center font-body bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      >
        <p className="text-cream/40 text-sm">Загрузка...</p>
      </div>
    )
  }

  if (!user && platformName === 'web') {
    return (
      <div
        className="min-h-screen text-cream flex flex-col items-center font-body bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      >
        <WebAuthScreen onAuthed={setUser} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-cream flex flex-col items-center font-body bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className="pt-8 pb-3 w-full relative flex flex-col items-center">
        <button
          onClick={() => setShowSettings(true)}
          aria-label="Настройки"
          className="absolute right-5 top-8 w-10 h-10 rounded-full border border-gold/50 flex items-center justify-center active:opacity-60 active:scale-95 transition-all"
        >
          <SettingsIcon size={18} className="text-gold" />
        </button>
        <div className="w-12 h-12 rounded-full border border-gold flex items-center justify-center mb-3">
          <span className="font-display text-lg text-gold">M</span>
        </div>
        {user && tab === 'today' ? (
          <h1 className="font-display text-2xl text-cream text-center leading-tight">
            {greeting()}{user.first_name ? `, ${user.first_name}` : ''}
          </h1>
        ) : (
          <h1 className="font-display text-2xl text-cream">Менталикс</h1>
        )}
      </div>

      <div key={tab} className="flex-1 w-full flex flex-col items-center animate-fade-in pb-28">
        {!user && (
          <p className="text-cream/40 text-sm px-6 text-center pt-8">
            Открой приложение через кнопку в боте, чтобы Менталикс увидел тебя
          </p>
        )}
        {showSettings ? (
          <Settings user={user} onBack={() => setShowSettings(false)} onNavigate={(key) => console.log('переход:', key)} />
        ) : (
          <>
            {user && tab === 'today' && <Today user={user} />}
            {user && tab === 'path' && <Path user={user} />}
            {user && tab === 'focus' && <Focus user={user} />}
            {user && tab === 'analytics' && <Analytics user={user} />}
            {user && tab === 'courses' && <Courses user={user} />}
            {user && tab === 'mentalix' && <MentalixChat user={user} />}
            {user && tab === 'profile' && <Profile user={user} />}
          </>
        )}
      </div>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 max-w-md mx-auto w-full">
          <div className="flex justify-around items-center px-2 py-2 rounded-[28px] border border-cream/10 bg-white/[0.03] backdrop-blur-sm">
            {TABS.map((t, i) => {
              const active = tab === t.key
              const isCenter = i === Math.floor(TABS.length / 2)
              return (
                <button
                  key={t.key}
                  onClick={() => switchTab(t.key)}
                  aria-label={t.label}
                  aria-current={active ? 'page' : undefined}
                  className="flex flex-col items-center gap-1 transition-all duration-300 ease-out active:scale-90"
                >
                  <span
                    className={[
                      'flex items-center justify-center transition-all duration-300 ease-out',
                      isCenter ? 'w-12 h-12 rounded-2xl' : 'w-11 h-11 rounded-full',
                      active ? 'bg-gold' : 'bg-emerald-light/30',
                    ].join(' ')}
                  >
                    {t.icon === 'monogram' && <MonogramIcon active={active} />}
                    {typeof t.icon !== 'string' && (
                      <t.icon
                        size={20}
                        strokeWidth={2}
                        className={active ? 'text-emerald-deep' : 'text-mint/70'}
                      />
                    )}
                  </span>
                  <span
                    className={[
                      'text-[10px] font-medium transition-all duration-300',
                      active ? 'text-gold opacity-100' : 'text-mint/50 opacity-0 h-0',
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