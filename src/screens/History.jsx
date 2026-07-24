import { useEffect, useState } from 'react'
import { api } from '../lib/api'

// ── История: лента дней из чек-инов и активности, как history. у stoic. ──

const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function dayTitle(iso) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Вчера'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export default function History({ user }) {
  const [days, setDays] = useState(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.checkin.history(user.id, 30).catch(() => []),
      api.analytics.get(user.id, 30).catch(() => null),
    ]).then(([checkins, analytics]) => {
      const byDate = {}
      for (const c of checkins || []) {
        byDate[c.date] = { ...(byDate[c.date] || {}), checkin: c }
      }
      for (const d of analytics?.daily_activity || []) {
        if (d.count > 0 || byDate[d.date]) {
          byDate[d.date] = { ...(byDate[d.date] || {}), activity: d }
        }
      }
      const list = Object.entries(byDate)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => (a.date < b.date ? 1 : -1))
      setDays(list)
    })
  }, [user])

  if (days === null) return <p className="text-cream/40 text-sm px-6 pt-6">Загрузка...</p>

  if (days.length === 0) {
    return (
      <div className="rounded-[24px] bg-emerald px-6 py-10 text-center mt-2">
        <h3 className="font-display text-[18px] text-cream mb-2">Пока пусто</h3>
        <p className="text-[14px] text-cream/45 leading-snug">
          Пройди чек-ин или закрой ритуал —
          <br />и здесь появится первая запись пути.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5 mt-1">
      {days.map((d) => (
        <div key={d.date}>
          <div className="text-[13px] text-cream/40 font-semibold mb-2 px-1">{dayTitle(d.date)}</div>
          <div className="rounded-3xl bg-emerald p-5 space-y-3">
            {d.checkin && (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-bold text-gold bg-gold/10 rounded-full px-3 py-1">
                    настроение: {MOOD_WORDS[(d.checkin.mood || 3) - 1]}
                  </span>
                  <span className="text-[12px] font-semibold text-cream/50 bg-cream/5 rounded-full px-3 py-1">
                    энергия {d.checkin.energy}/5
                  </span>
                  <span className="text-[12px] font-semibold text-cream/50 bg-cream/5 rounded-full px-3 py-1">
                    фокус {d.checkin.focus}/5
                  </span>
                </div>
                {d.checkin.note && (
                  <p className="text-[14px] text-cream/70 leading-snug mt-3 whitespace-pre-line">
                    {d.checkin.note.length > 220 ? d.checkin.note.slice(0, 220) + '…' : d.checkin.note}
                  </p>
                )}
              </div>
            )}
            {d.activity && d.activity.count > 0 && (
              <div className="text-[13px] font-semibold text-cream/45">
                ✦ ритуалов закрыто: {d.activity.count}
                {d.activity.breaks > 0 && (
                  <span className="text-cream/35"> · срывов аскез: {d.activity.breaks}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
