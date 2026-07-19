import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import Today from './screens/Today'
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

  return (
    <div className="min-h-screen bg-emerald-deep text-cream flex flex-col items-center font-body">
      <div className="pt-10 pb-4 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border border-gold flex items-center justify-center mb-3">
          <span className="font-display text-xl text-gold">M</span>
        </div>
        <h1 className="font-display text-xl">Менталикс</h1>
        <p className="text-cream/50 text-xs">система, а не мотивация</p>
      </div>

      <div className="flex-1 w-full flex flex-col items-center">
        {!user && (
          <p className="text-cream/40 text-sm px-6 text-center pt-8">
            Открой приложение через кнопку в боте, чтобы Менталикс увидел тебя
          </p>
        )}

        {user && tab === 'today' && <Today user={user} />}
        {user && tab === 'path' && <Placeholder title="Мой путь" hint="Цели и прогресс появятся здесь" />}
        {user && tab === 'analytics' && <Placeholder title="Аналитика" hint="Связь состояния, привычек и целей" />}
        {user && tab === 'mentalix' && <Placeholder title="Mentalix" hint="Проактивный ассистент скоро начнёт замечать паттерны" />}
        {user && tab === 'profile' && <Placeholder title="Профиль" hint={`Привет, ${user.first_name}`} />}
      </div>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-emerald-deep border-t border-cream/10 flex justify-around py-2 max-w-md mx-auto w-full">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
                tab === t.key ? 'text-gold' : 'text-cream/40'
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
