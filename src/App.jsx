import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import Today from './screens/Today'
import Path from './screens/Path'
import Analytics from './screens/Analytics'
import Placeholder from './screens/Placeholder'

const TABS = [
  { key: 'today', label: 'Сегодня', icon: '◐' },
  { key: 'path', label: 'Мой путь', icon: '↗' },
  { key: 'analytics', label: 'Аналитика', icon: '▤' },
  { key: 'mentalix', label: 'Mentalix', icon: 'M' },
  { key: 'profile', label: 'Профиль', icon: '●' },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('today')

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
        <h1 className="font-display text-xl">Менталикс</h1>
        <p className="text-cream/50 text-xs">система, а не мотивация</p>
      </div>

      <div key={tab} className="flex-1 w-full flex flex-col items-center animate-fade-in">
        {!user && (
          <p className="text-cream/40 text-sm px-6 text-center pt-8">
            Открой приложение через кнопку в боте, чтобы Менталикс увидел тебя
          </p>
        )}

        {user && tab === 'today' && <Today user={user} />}
        {user && tab === 'path' && <Path user={user} />}
        {user && tab === 'analytics' && <Analytics user={user} />}
        {user && tab === 'mentalix' && <Placeholder title="Mentalix" hint="Проактивный ассистент скоро начнёт замечать паттерны" />}
        {user && tab === 'profile' && <Placeholder title="Профиль" hint={`Привет, ${user.first_name}`} />}
      </div>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-emerald-deep/95 backdrop-blur border-t border-cream/10 flex justify-around py-2 max-w-md mx-auto w-full">
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-[10px] transition-all duration-200 active:scale-90 ${
                  active ? 'bg-cognac/25 text-gold' : 'text-cream/40'
                }`}
              >
                <span className="text-base leading-none">{t.icon}</span>
                {t.label}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
