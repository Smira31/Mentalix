import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { ArrowUpRight, AlignJustify, User } from 'lucide-react'
import Today from './screens/Today'
import Path from './screens/Path'
import Analytics from './screens/Analytics'
import MentalixChat from './screens/Mentalix'
import Profile from './screens/Profile'

function ContrastIcon({ active }) {
  return (
    <div
      className="w-6 h-6 rounded-full border-2"
      style={{
        borderColor: active ? '#0E211D' : 'rgba(150,205,176,0.7)',
        background: `linear-gradient(90deg, ${active ? '#0E211D' : 'rgba(150,205,176,0.7)'} 50%, transparent 50%)`,
      }}
    />
  )
}

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
  { key: 'today', label: 'Сегодня', icon: 'contrast' },
  { key: 'path', label: 'Мой путь', icon: ArrowUpRight },
  { key: 'analytics', label: 'Аналитика', icon: AlignJustify },
  { key: 'mentalix', label: 'Mentalix', icon: 'monogram' },
  { key: 'profile', label: 'Профиль', icon: User },
]

export default function App() {
  const [user, setUser] = useState(null)

  const initialTab = new URLSearchParams(window.location.search).get('tab')
  const validTabs = ['today', 'path', 'analytics', 'mentalix', 'profile']
  const [tab, setTab] = useState(validTabs.includes(initialTab) ? initialTab : 'today')

  useEffect(() => {
    WebApp.ready()
    WebApp.expand()
    const tgUser = WebApp.initDataUnsafe?.user
    if (tgUser) setUser(tgUser)
  }, [])

  function switchTab(key) {
    if (key === tab) return
    WebApp.HapticFeedback?.impactOccurred('light')
    setTab(key)
  }

  return (
    <div className="min-h-screen bg-emerald-deep text-cream flex flex-col items-center font-body">
      <div className="pt-10 pb-4 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border border-gold flex items-center justify-center mb-3">
          <span className="font-display text-xl text-gold">M</span>
        </div>
        {user && tab === 'today' ? (
          <>
            <h1 className="font-display text-xl">
              {greeting()}{user.first_name ? `, ${user.first_name}` : ''}
            </h1>
            <p className="text-cream/50 text-xs">система, а не мотивация</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl">Менталикс</h1>
            <p className="text-cream/50 text-xs">система, а не мотивация</p>
          </>
        )}
      </div>

      <div key={tab} className="flex-1 w-full flex flex-col items-center animate-fade-in pb-28">
        {!user && (
          <p className="text-cream/40 text-sm px-6 text-center pt-8">
            Открой приложение через кнопку в боте, чтобы Менталикс увидел тебя
          </p>
        )}
        {user && tab === 'today' && <Today user={user} />}
        {user && tab === 'path' && <Path user={user} />}
        {user && tab === 'analytics' && <Analytics user={user} />}
        {user && tab === 'mentalix' && <MentalixChat user={user} />}
        {user && tab === 'profile' && <Profile user={user} />}
      </div>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 max-w-md mx-auto w-full">
          <div className="flex justify-around items-center bg-emerald/90 backdrop-blur-md border border-emerald-light/30 rounded-[28px] px-2 py-2 shadow-lg shadow-black/30">
            {TABS.map((t) => {
              const active = tab === t.key
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
                      'flex items-center justify-center rounded-full transition-all duration-300 ease-out',
                      active
                        ? 'w-11 h-11 bg-gold -translate-y-1 shadow-lg shadow-gold/25'
                        : 'w-10 h-10 bg-emerald-light/50',
                    ].join(' ')}
                  >
                    {t.icon === 'contrast' && <ContrastIcon active={active} />}
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
