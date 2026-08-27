import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { MotifArt } from '../components/Motif'
import EmptyState from '../components/EmptyState'
import MarkdownText from '../components/MarkdownText'
import { buildBadges } from '../lib/badges'

// ── История: лента дней из чек-инов и активности, как history. у stoic. ──
// Утренняя мысль живёт в note, вечерний разбор — в lessons и wins.
// Каждый блок показывается, только если в нём что-то есть.
// Вехи и записи по темам — отдельные недатированные блоки ниже ленты:
// у бейджей и тем нет даты в контракте бэкенда, честного слияния в общую
// хронологию по датам без этого не сделать (MXL-HISTORY-UNIFIED-FEED-001).

const MOOD_WORDS = ['тяжко', 'так себе', 'нормально', 'хорошо', 'отлично']
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function dayTitle(iso) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Вчера'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function HistoryDetail({ day, onBack }) {
  const checkin = day.checkin
  const wins = checkin?.wins || []

  return (
    <section aria-label={`Запись за ${dayTitle(day.date)}`} className="mt-1 animate-fade-in">
      <div className="grid min-h-[42px] grid-cols-[1fr_auto_1fr] items-center">
        <button
          type="button"
          onClick={onBack}
          className="justify-self-start rounded-full px-3 py-2 text-[13px] font-semibold text-muted active:text-gold"
        >
          Назад
        </button>
        <h2 className="font-display text-[20px] text-cream">{dayTitle(day.date)}</h2>
        <span aria-hidden="true" />
      </div>

      <div className="mt-5 space-y-4 rounded-3xl bg-emerald p-5">
        {checkin ? (
          <>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-gold/10 px-3 py-1 text-[12px] font-bold text-gold">
                настроение: {MOOD_WORDS[(checkin.mood || 3) - 1]}
              </span>
              {checkin.energy && (
                <span className="rounded-full bg-cream/5 px-3 py-1 text-[12px] font-semibold text-muted">
                  энергия {checkin.energy}/5
                </span>
              )}
              {checkin.focus && (
                <span className="rounded-full bg-cream/5 px-3 py-1 text-[12px] font-semibold text-muted">
                  фокус {checkin.focus}/5
                </span>
              )}
              {checkin.emotion && (
                <span className="rounded-full bg-cream/5 px-3 py-1 text-[12px] font-semibold text-muted">
                  {checkin.emotion}
                </span>
              )}
            </div>

            {checkin.note && (
              <div>
                <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">Утренняя запись</div>
                <MarkdownText content={checkin.note} className="space-y-2 text-[15px] leading-relaxed text-cream" />
              </div>
            )}

            {checkin.lessons && (
              <div className="rounded-2xl bg-emerald-light p-4">
                <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">Уроки дня</div>
                <MarkdownText content={checkin.lessons} className="space-y-2 text-[14px] leading-relaxed text-cream" />
              </div>
            )}

            {wins.length > 0 && (
              <div className="rounded-2xl bg-emerald-light p-4">
                <div className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-muted">Чем горжусь</div>
                <ul className="space-y-2">
                  {wins.map((win, index) => (
                    <li key={`${day.date}-${index}`} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">
                        {index + 1}
                      </span>
                      <MarkdownText content={win} className="min-w-0 space-y-1 text-[14px] leading-snug text-cream" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!checkin.note && !checkin.lessons && wins.length === 0 && (
              <p className="text-[14px] leading-relaxed text-muted">В этот день сохранено состояние и активность, но текстовой записи нет.</p>
            )}
          </>
        ) : (
          <p className="text-[14px] leading-relaxed text-muted">В этот день отмечена активность, но check-in не сохранён.</p>
        )}

        {day.activity?.count > 0 && (
          <p className="text-[13px] font-semibold text-muted">
            Ритуалов закрыто: {day.activity.count}
            {day.activity.breaks > 0 && <span className="text-faint"> · срывов аскез: {day.activity.breaks}</span>}
          </p>
        )}
      </div>
    </section>
  )
}

export default function History({ user }) {
  const [days, setDays] = useState(null)
  const [badges, setBadges] = useState(null)
  const [themeEntries, setThemeEntries] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)

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

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.profile.get(user.id).catch(() => null),
      api.rituals.list(user.id).catch(() => []),
      api.ascezas.list(user.id).catch(() => []),
    ]).then(([stats, rituals, ascezas]) => {
      setBadges(buildBadges({ stats, rituals, ascezas }).filter(b => b.done))
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    api.themes
      .list(user.id)
      .catch(() => [])
      .then(list => {
        const reflected = (list || []).filter(t => t.reflected_days > 0)
        if (reflected.length === 0) {
          setThemeEntries([])
          return
        }
        Promise.all(reflected.map(t => api.themes.get(t.id, user.id).catch(() => null))).then(
          themes => {
            const entries = []
            for (const theme of themes) {
              if (!theme) continue
              for (const d of theme.days || []) {
                if (d.reflection) {
                  entries.push({
                    themeId: theme.id,
                    themeTitle: theme.title,
                    day: d.day,
                    text: d.reflection,
                  })
                }
              }
            }
            setThemeEntries(entries)
          }
        )
      })
  }, [user])

  if (days === null) return <p className="text-muted text-sm px-5 pt-6">Загрузка...</p>

  if (selectedDay) {
    return <HistoryDetail day={selectedDay} onBack={() => setSelectedDay(null)} />
  }

  const milestonesBlock = badges && badges.length > 0 && (
    <div className="mt-8">
      <div className="text-[13px] text-muted font-semibold mb-2 px-1">Вехи пути</div>
      <div className="rounded-3xl bg-emerald p-5 grid grid-cols-3 gap-2">
        {badges.map(b => (
          <div
            key={b.id}
            className="rounded-2xl p-3 flex flex-col items-center text-center bg-gold/10 border border-gold/25"
          >
            <MotifArt name={b.motif} size={56} className="mb-2" />
            <span className="text-[11px] font-bold leading-tight text-cream">{b.title}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const themeEntriesBlock = themeEntries && themeEntries.length > 0 && (
    <div className="mt-8">
      <div className="text-[13px] text-muted font-semibold mb-2 px-1">Записи по темам</div>
      <div className="space-y-3">
        {themeEntries.map(e => (
          <div key={`${e.themeId}-${e.day}`} className="rounded-3xl bg-emerald p-5">
            <div className="text-[12px] font-bold text-gold mb-1">
              {e.themeTitle} · день {e.day}
            </div>
            <MarkdownText
              content={e.text}
              className="space-y-2 text-[14px] text-muted leading-snug"
            />
          </div>
        ))}
      </div>
    </div>
  )

  if (days.length === 0) {
    return (
      <>
        <EmptyState
          glyph={<MotifArt name="sledopyt" size={110} className="mx-auto mb-4" />}
          className="px-6 py-10 mt-2"
        >
          <h3 className="font-display text-[18px] text-cream mb-2">Пока пусто</h3>
          <p className="text-[14px] text-muted leading-snug">
            Пройди чек-ин или закрой ритуал —
            <br />и здесь появится первая запись пути.
          </p>
        </EmptyState>
        {milestonesBlock}
        {themeEntriesBlock}
      </>
    )
  }

  return (
    <div className="space-y-5 mt-1">
      {days.map(d => {
        const wins = d.checkin?.wins || []
        return (
          <div key={d.date}>
            <div className="text-[13px] text-muted font-semibold mb-2 px-1">{dayTitle(d.date)}</div>
            <button
              type="button"
              onClick={() => setSelectedDay(d)}
              aria-label={`Открыть запись за ${dayTitle(d.date)}`}
              className="w-full rounded-3xl bg-emerald p-5 space-y-3 text-left active:scale-[0.99] transition-transform"
            >
              {d.checkin && (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-bold text-gold bg-gold/10 rounded-full px-3 py-1">
                      настроение: {MOOD_WORDS[(d.checkin.mood || 3) - 1]}
                    </span>
                    <span className="text-[12px] font-semibold text-muted bg-cream/5 rounded-full px-3 py-1">
                      энергия {d.checkin.energy}/5
                    </span>
                    <span className="text-[12px] font-semibold text-muted bg-cream/5 rounded-full px-3 py-1">
                      фокус {d.checkin.focus}/5
                    </span>
                  </div>

                  {d.checkin.note && (
                    <MarkdownText
                      className="space-y-2 text-[14px] text-muted leading-snug mt-3"
                      content={
                        d.checkin.note.length > 220
                          ? d.checkin.note.slice(0, 220) + '…'
                          : d.checkin.note
                      }
                    />
                  )}

                  {d.checkin.lessons && (
                    <div className="rounded-2xl bg-emerald-light p-4 mt-3">
                      <div className="text-[12px] font-bold text-muted uppercase tracking-wide mb-2">
                        Уроки дня
                      </div>
                      <MarkdownText
                        content={d.checkin.lessons}
                        className="space-y-2 text-[14px] text-cream leading-relaxed"
                      />
                    </div>
                  )}

                  {wins.length > 0 && (
                    <div className="rounded-2xl bg-emerald-light p-4 mt-2.5">
                      <div className="text-[12px] font-bold text-muted uppercase tracking-wide mb-2.5">
                        Чем горжусь
                      </div>
                      <ul className="space-y-2">
                        {wins.map((w, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-gold/15 text-gold text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <MarkdownText
                              content={w}
                              className="min-w-0 space-y-1 text-[14px] text-cream leading-snug"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {d.activity && d.activity.count > 0 && (
                <div className="text-[13px] font-semibold text-muted">
                  ✦ ритуалов закрыто: {d.activity.count}
                  {d.activity.breaks > 0 && (
                    <span className="text-faint"> · срывов аскез: {d.activity.breaks}</span>
                  )}
                </div>
              )}
            </button>
          </div>
        )
      })}

      {milestonesBlock}
      {themeEntriesBlock}
    </div>
  )
}
