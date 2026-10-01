import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { invalidateTodayData } from '../lib/todayDataCache'
import { invalidatePracticesData } from '../lib/practicesDataCache'
import { isLinkedWebWriteBlocked, LINKED_WEB_WRITE_NOTICE } from '../lib/webAuthLimits'
import PracticeListFlow from '../components/practices/PracticeListFlow'

export default function Rituals({ user, onBack }) {
  const [rituals, setRituals] = useState([])
  const [loading, setLoading] = useState(true)
  const [writeError, setWriteError] = useState(null)

  useEffect(() => {
    if (!user) return
    api.rituals
      .list(user.id)
      .then(setRituals)
      .catch(error => console.error(error))
      .finally(() => setLoading(false))
  }, [user])

  async function logRitual(ritualId, level, restoreDaysAgo = null) {
    try {
      const updated = await api.rituals.log(ritualId, user.id, level, restoreDaysAgo)
      setWriteError(null)
      setRituals(previous =>
        previous.map(r =>
          r.id === ritualId
            ? {
                ...r,
                ...updated,
                // Восстановленный вчерашний день не отмечает сегодняшний.
                ...(restoreDaysAgo === null
                  ? { today_level: updated.today_level ?? level }
                  : {}),
              }
            : r
        )
      )
      invalidateTodayData(user.id)
      invalidatePracticesData(user.id)
      return updated
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) setWriteError(LINKED_WEB_WRITE_NOTICE)
      return null
    }
  }

  // Восстановление пропущенного дня: уровень выбирается в листе.
  async function restoreRitual(ritualId, { restoreDaysAgo, value }) {
    return logRitual(ritualId, value, restoreDaysAgo)
  }

  async function createRitual(draft) {
    try {
      const ritual = await api.rituals.create(user.id, draft)
      setRituals(previous => [...previous, ritual])
      return ritual
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) {
        setWriteError(LINKED_WEB_WRITE_NOTICE)
        return null
      }
      return null
    }
  }

  async function updateRitual(ritualId, patch) {
    try {
      const updated = await api.rituals.update(ritualId, user.id, patch)
      setWriteError(null)
      setRituals(previous => previous.map(r => (r.id === ritualId ? { ...r, ...updated } : r)))
      invalidateTodayData(user.id)
      invalidatePracticesData(user.id)
      return updated
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) setWriteError(LINKED_WEB_WRITE_NOTICE)
      return null
    }
  }

  async function deleteRitual(ritualId) {
    try {
      await api.rituals.remove(ritualId)
      setRituals(previous => previous.filter(r => r.id !== ritualId))
      setWriteError(null)
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) setWriteError(LINKED_WEB_WRITE_NOTICE)
    }
  }

  return (
    <PracticeListFlow
      kind="ritual"
      items={rituals}
      loading={loading}
      onLog={logRitual}
      onCreate={createRitual}
      onUpdate={updateRitual}
      onDelete={deleteRitual}
      onRestore={restoreRitual}
      onBack={onBack}
      writeError={writeError}
    />
  )
}
