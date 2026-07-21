import { useEffect, useState, Component } from 'react'
import WebApp from '@twa-dev/sdk'
import { ArrowUpRight, AlignJustify, User } from 'lucide-react'
import Today from './screens/Today'
import Path from './screens/Path'
import Analytics from './screens/Analytics'
import MentalixChat from './screens/Mentalix'
import Profile from './screens/Profile'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="px-6 pt-10 text-cream">
          <p className="text-red-400 text-sm mb-2 font-mono">Ошибка на экране:</p>
          <p className="text-cream/70 text-xs break-words">{String(this.state.error?.message || this.state.error)}</p>
        </div>
      )
    }
    return this.props.children
  }
}

function ContrastIcon({ active }) {
  return (
    <div
      className="w-6 h-6 rounded-full border-2"
      style={{
        borderColor: active ? '#C9A227' : 'rgba(243,233,221,0.45)',
        background: `linear-gradient(90deg, ${active ? '#C9A227' : 'rgba(243,233,221,0.45)'} 50%, transparent 50%)`,
      }}
    />
  )
}

function MonogramIcon({ active }) {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        active ? 'border-gold' : 'border-cream/45'
      }`}
    >
      <span className={`font-display text-xs ${active ? 'text-gold' : 'text-cream/45'}`}>M</span>
    </div>
  )
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
        <h1 className="font-display text-xl">Менталикс</h1>
        <p className="text-cream/50 text-xs">система, а не мотивация</p>
      </div>

      <div key={tab} className="flex-1 w-full flex flex-col items-center animate-fade-in">
        {!user && (
          <p className="text-cream/40 text-sm px-6 text-center pt-8">
            Открой приложение через кнопку в боте, чтобы Менталикс увидел тебя
          </p>
        )}
        <ErrorBoundary>
          {user && tab === 'today' && <Today user={user} />}
          {user && tab === 'path' && <Path user={user} />}
          {user && tab === 'analytics' && <Analytics user={user} />}
          {user && tab === 'mentalix' && <MentalixChat user={user} />}
          {user && tab === 'profile' && <Profile user={user} />}
        </ErrorBoundary>
      </div>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 px-3 pb-6 pt-2 max-w-md mx-auto w-full">
          <div className="flex justify-around items-center bg-emerald-light/40 backdrop-blur-md border border-cream/10 rounded-[28px] px-2 py-2.5 shadow-lg">
            {TABS.map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => switchTab(t.key)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-[11px] transition-all duration-200 active:scale-90 ${
                    active ? 'bg-cognac/30 text-gold' : 'text-cream/45'
                  }`}
                >
                  {t.icon === 'contrast' && 
