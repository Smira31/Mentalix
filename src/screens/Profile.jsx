import { useEffect, useState } from 'react'
import { CalendarDays, Flame, Leaf, Moon, PartyPopper, Sprout, Star, Trophy } from 'lucide-react'
import { api } from '../lib/api'
import { useSynced } from '../lib/store'
import { buildSeriesViewModel } from '../lib/series'
import {
  ProfileBody,
  ProfileGroup,
  ProfileCard,
  ProfileRow,
  ProfileNote,
} from './settings/ProfileUi'

// ============================================================
// О ТЕБЕ
//
// День рождения, история и воспоминания — как у Stoic.
// День рождения хранится локально (useSynced), т.к. на бэкенде
// нет поля для него. История и воспоминания — из api.profile.get.
// ============================================================

const BIRTHDAY_KEY = 'mx-birthday'

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatBirthday(value) {
  if (!value) return null
  const [m, d] = value.split('-').map(Number)
  if (!m || !d) return null
  return `${d} ${MONTHS[m - 1]}`
}

function daysUntilNextBirthday(value) {
  if (!value) return null
  const [m, d] = value.split('-').map(Number)
  if (!m || !d) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), m - 1, d)
  if (next < today) next = new Date(now.getFullYear() + 1, m - 1, d)
  return Math.ceil((next - today) / (1000 * 60 * 60 * 24))
}

// Воспоминания — вехи по количеству чек-инов и дней в системе.
function getMilestones(stats) {
  if (!stats) return []
  const milestones = []
  const checkins = stats.total_checkins || 0
  const days = stats.days_active || 0

  if (checkins >= 1) milestones.push({ Icon: Sprout, title: 'Первый чек-ин', desc: 'Начало пути' })
  if (checkins >= 10) milestones.push({ Icon: Leaf, title: '10 чек-инов', desc: 'Десять отметок' })
  if (checkins >= 50) milestones.push({ Icon: Flame, title: '50 чек-инов', desc: 'Полсотни отметок' })
  if (checkins >= 100) milestones.push({ Icon: Star, title: '100 чек-инов', desc: 'Сотня отметок' })
  if (days >= 7) milestones.push({ Icon: CalendarDays, title: 'Неделя в системе', desc: '7 дней' })
  if (days >= 30) milestones.push({ Icon: Moon, title: 'Месяц в системе', desc: '30 дней' })
  if (days >= 100) milestones.push({ Icon: Trophy, title: '100 дней в системе', desc: 'Сотня дней' })

  return milestones
}

export default function Profile({ user }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [birthdayRaw, setBirthdayRaw] = useSynced(BIRTHDAY_KEY, '')
  const [bestStreak, setBestStreak] = useState(null)

  useEffect(() => {
    if (!user) return
    let active = true

    api.profile
      .get(user.id)
      .then(data => {
        if (!active) return
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError(true)
        setLoading(false)
      })

    // Серия считается той же функцией, что огонёк в шапке Today
    // (buildSeriesViewModel), а не бэкенд-полем stats.best_streak.
    Promise.all([
      api.checkin.history(user.id, 90).catch(() => []),
      api.rituals.list(user.id).catch(() => []),
      api.ascezas.list(user.id).catch(() => []),
      api.moodPractices.list(user.id).catch(() => []),
      api.practiceDays.list(user.id),
    ])
      .then(([checkins, rituals, ascezas, moodPractices, practiceDays]) => {
        if (!active) return
        const model = buildSeriesViewModel({
          checkins: Array.isArray(checkins) ? checkins : [],
          rituals: Array.isArray(rituals) ? rituals : [],
          ascezas: Array.isArray(ascezas) ? ascezas : [],
          moodPractices: Array.isArray(moodPractices) ? moodPractices : [],
          practiceDays: Array.isArray(practiceDays) ? practiceDays : [],
        })
        setBestStreak(model.bestStreak)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [user, reloadToken])

  function retryProfile() {
    setLoading(true)
    setError(false)
    setReloadToken(token => token + 1)
  }

  const birthdayFormatted = formatBirthday(birthdayRaw)
  const daysToBirthday = daysUntilNextBirthday(birthdayRaw)
  const milestones = getMilestones(stats)

  return (
    <ProfileBody>
      {/* Имя и аватар */}
      <div className="flex items-center gap-3.5 mt-4 mb-6" data-testid="profile-about-header">
        <div className="w-12 h-12 rounded-full border border-[rgb(var(--c-border))] bg-[rgb(var(--c-card2))] flex items-center justify-center shrink-0">
          <span className="font-display text-[16px] text-cream">
            {user.first_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-[20px] text-cream leading-tight truncate">
            {user.first_name}
          </h2>
          {stats && (
            <p className="text-[12px] text-muted mt-0.5" data-testid="profile-about-stats">
              {stats.days_active} дней в системе · {stats.total_checkins} чек-инов
            </p>
          )}
        </div>
      </div>

      {loading && <p className="text-muted text-[13px]">Загрузка…</p>}

      {error && (
        <ProfileNote role="alert">
          Не удалось загрузить профиль.{' '}
          <button type="button" onClick={retryProfile} className="mx-profile-text-button">
            Повторить
          </button>
        </ProfileNote>
      )}

      {/* День рождения */}
      <ProfileGroup label="День рождения">
        <ProfileCard>
          <ProfileRow
            title="Дата рождения"
            subtitle={
              birthdayFormatted
                ? daysToBirthday === 0
                  ? (
                      <>
                        С днём рождения!{' '}
                        <PartyPopper size={13} aria-hidden="true" className="inline align-[-2px]" />
                      </>
                    )
                  : daysToBirthday != null
                    ? `До дня рождения ${daysToBirthday} ${daysToBirthday === 1 ? 'день' : daysToBirthday < 5 ? 'дня' : 'дней'}`
                    : null
                : null
            }
            right={
              <input
                type="date"
                value={birthdayRaw ? `2000-${birthdayRaw}` : ''}
                onChange={e => {
                  const val = e.target.value
                  // Храним только месяц-день, год не важен.
                  if (val) {
                    const [, m, d] = val.split('-')
                    setBirthdayRaw(`${m}-${d}`)
                  } else {
                    setBirthdayRaw('')
                  }
                }}
                className="mx-profile-date-input"
                aria-label="Дата рождения"
                data-testid="profile-birthday-input"
              />
            }
          />
        </ProfileCard>
      </ProfileGroup>

      {/* История */}
      {stats && (
        <ProfileGroup label="История">
          <ProfileCard>
            <ProfileRow title="Дней в системе" value={stats.days_active || 0} />
            <ProfileRow title="Всего чек-инов" value={stats.total_checkins || 0} />
            {bestStreak != null && (
              <ProfileRow
                title="Лучшая серия"
                value={`${bestStreak} ${bestStreak === 1 ? 'день' : 'дней'}`}
              />
            )}
            {stats.current_streak != null && (
              <ProfileRow
                title="Текущая серия"
                value={`${stats.current_streak} ${stats.current_streak === 1 ? 'день' : 'дней'}`}
              />
            )}
          </ProfileCard>
        </ProfileGroup>
      )}

      {/* Воспоминания */}
      {milestones.length > 0 && (
        <ProfileGroup label="Воспоминания">
          <div className="mx-profile-milestones" data-testid="profile-milestones">
            {milestones.map(m => (
              <div key={m.title} className="mx-profile-milestone">
                <span className="mx-profile-milestone__icon" aria-hidden="true">
                  <m.Icon size={22} strokeWidth={1.75} />
                </span>
                <span className="mx-profile-milestone__text">
                  <span className="mx-profile-milestone__title">{m.title}</span>
                  <span className="mx-profile-milestone__desc">{m.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </ProfileGroup>
      )}
    </ProfileBody>
  )
}
