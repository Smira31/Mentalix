import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    WebApp.ready()
    WebApp.expand()
    const tgUser = WebApp.initDataUnsafe?.user
    if (tgUser) setUser(tgUser)
  }, [])

  return (
    <div className="min-h-screen bg-emerald-deep text-cream flex flex-col items-center justify-center px-6 text-center font-body">
      <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center mb-6">
        <span className="font-display text-3xl text-gold">M</span>
      </div>

      <h1 className="font-display text-3xl mb-2">Менталикс</h1>
      <p className="text-cream/60 text-sm mb-8">система, а не мотивация</p>

      {user && (
        <p className="text-cream/40 text-xs font-mono mb-8">
          привет, {user.first_name}
        </p>
      )}

      <div className="border border-cognac/40 rounded-xl px-6 py-4 text-sm text-cream/70 max-w-xs">
        Трекеры настроения, привычек и месячного пути появятся здесь на следующем шаге
      </div>
    </div>
  )
}
