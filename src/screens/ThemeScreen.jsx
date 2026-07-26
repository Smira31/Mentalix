import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { ChevronLeft, Lock, Check } from 'lucide-react'
import { ArtLantern, ArtDoor } from '../components/Art'

// ── Тема недели: семь дней размышлений, по дню за раз ──
// Первые дни открыты всем, дальше — по подписке.

export default function ThemeScreen({ user, themeId, onBack }) {
  const [data, setData] = useState(null)
  const [day, setDay] = useState(1)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !themeId) return
    api.themes
      .get(themeId, user.id)
      .then((d) => {
        setData(d)
        setDay(Math.min(d.current_day || 1, d.days.length))
      })
      .catch(console.error)
  }, [user, themeId])

  useEffect(() => {
    if (!data) return
    const d = data.days.find((x) => x.day === day)
    setText(d?.reflection || '')
  }, [day, data])

  async function save() {
    if (!data) return
    setSaving(true)
    try {
      await api.themes.reflect(themeId, user.id, day, text)
      platform.haptic('success')
      const fresh = await api.themes.get(themeId, user.id)
      setData(fresh)
      if (day < data.days.length) setDay(day + 1)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (!data) return <p className="text-cream/40 text-sm px-6 pt-6">Загрузка...</p>

  const current = data.days.find((x) => x.day === day)
  const doneCount = data.days.filter((x) => x.reflection).length
  const finished = doneCount === data.days.length

  return (
    <div className="w-full max-w-md px-5 pb-40 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => { platform.haptic('light'); onBack() }}
          aria-label="Назад"
          className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center active:scale-95 transition-transform border-0"
        >
          <ChevronLeft size={20} className="text-cream/60" />
        </button>
        <div className="flex-1">
          <div className="text-[11px] text-cream/35 font-bold uppercase tracking-wider">Тема недели</div>
          <h2 className="font-display text-[19px] text-cream lowercase leading-tight">{data.title}</h2>
        </div>
      </div>

      {/* дни: точки-переключатели */}
      <div className="flex gap-1.5 mb-5">
        {data.days.map((d) => {
          const active = d.day === day
          return (
            <button
              key={d.day}
              onClick={() => { platform.haptic('light'); setDay(d.day) }}
              className={[
                'flex-1 h-9 rounded-full text-[12px] font-bold border-0 flex items-center justify-center transition-colors',
                active ? 'bg-cream text-emerald-deep' : d.reflection ? 'bg-gold/20 text-gold' : 'bg-emerald text-cream/40',
              ].join(' ')}
            >
              {d.locked ? <Lock size={12} /> : d.reflection && !active ? <Check size={13} strokeWidth={3} /> : d.day}
            </button>
          )
        })}
      </div>

      {/* карточка дня */}
      <div className="rounded-[28px] bg-emerald px-6 py-8 text-center">
        {current?.locked ? (
          <>
            <ArtLantern size={110} className="mx-auto mb-4" />
            <h3 className="font-display text-[20px] text-cream leading-tight">День {day} под замком</h3>
            <p className="text-[14px] text-cream/50 mt-3 leading-relaxed">
              Первые {data.free_days} дня открыты всем. Остальные пять — часть Библиотеки.
            </p>
            <button
              onClick={() => platform.haptic('light')}
              className="cta-pill text-[15px] px-9 py-3.5 mt-6"
            >
              Скоро откроется
            </button>
          </>
        ) : (
          <>
            <div className="text-[12px] text-cream/35 font-bold mb-3">День {day} из {data.days.length}</div>
            <p className="font-display text-[19px] text-cream leading-snug">{current?.text}</p>
            {current?.prompt && (
              <p className="text-[14px] text-gold/80 font-semibold mt-5 leading-snug">{current.prompt}</p>
            )}
          </>
        )}
      </div>

      {/* размышление */}
      {!current?.locked && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Записать мысль..."
            rows={4}
            className="w-full rounded-3xl bg-emerald text-cream placeholder-cream/30 p-5 text-[15px] leading-relaxed outline-none border border-cream/10 focus:border-gold/40 resize-none font-body mt-3"
          />
          <button
            onClick={save}
            disabled={saving || !text.trim()}
            className="cta-pill w-full py-4 text-[16px] mt-3 disabled:opacity-30"
          >
            {saving ? 'Сохраняю...' : current?.reflection ? 'Обновить мысль' : 'Обдумал'}
          </button>
        </>
      )}

      {finished && (
        <div className="rounded-[28px] bg-emerald px-6 py-8 text-center mt-4 animate-fade-in">
          <ArtDoor size={120} className="mx-auto mb-4" />
          <h3 className="font-display text-[20px] text-cream leading-tight">Тема пройдена</h3>
          <p className="text-[14px] text-cream/50 mt-2">Семь дней размышлений — это уже практика.</p>
        </div>
      )}
    </div>
  )
}
