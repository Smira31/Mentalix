import { useCallback, useEffect, useState } from 'react'

import { cloud } from '../platform/telegram.hooks'
import { readLocal, writeLocal, dropLocal } from './store'
import { getUserDataScope, migrateHeroJourneyProgress } from './userDataScope'
import {
  HERO_PROGRESS_KEY,
  heroProgressKey,
  emptyProgress,
  parseProgress,
  mergeProgress,
} from './heroJourneyState'

export { isStepAvailable, isStepCompleted } from './heroJourneyState'

/* JSON в обоих хранилищах; локальные ключи изолированы по пользователю.
 * Telegram допускает в CloudStorage только буквы, цифры, _ и -.
 * Старый облачный ключ уже изолирован самим Telegram-аккаунтом.
 */
export function useHeroJourneyProgress(userId = getUserDataScope()) {
  const key = heroProgressKey(userId)
  const cloudKey = key.replaceAll(':', '_')
  const [snapshot, setSnapshot] = useState(() => {
    migrateHeroJourneyProgress(userId)
    return { key, raw: readLocal(key, JSON.stringify(emptyProgress())) }
  })

  useEffect(() => {
    let alive = true
    migrateHeroJourneyProgress(userId)
    const local = mergeProgress(readLocal(key), null)
    writeLocal(key, local)

    async function restore() {
      let remote = await cloud.get(cloudKey)
      let legacy = false
      if (remote == null) {
        remote = await cloud.get(HERO_PROGRESS_KEY)
        legacy = remote != null
      }
      if (!alive || remote == null) return
      const merged = mergeProgress(readLocal(key), remote)
      writeLocal(key, merged)
      setSnapshot({ key, raw: merged })
      const saved = await cloud.set(cloudKey, merged)
      if (alive && legacy && saved) await cloud.remove(HERO_PROGRESS_KEY)
    }
    restore()
    return () => {
      alive = false
    }
  }, [cloudKey, key, userId])

  const progress = parseProgress(snapshot.key === key ? snapshot.raw : readLocal(key))

  const update = useCallback(
    fn => {
      const next = JSON.stringify(fn(parseProgress(readLocal(key))))
      writeLocal(key, next)
      setSnapshot({ key, raw: next })
      cloud.set(cloudKey, next)
    },
    [cloudKey, key]
  )

  const completeStep = useCallback(
    (stepId, { signs: markedSigns, reflection, action } = {}) => {
      update(p => ({
        ...p,
        completed: { ...p.completed, [stepId]: new Date().toISOString() },
        ...(markedSigns ? { signs: { ...p.signs, [stepId]: markedSigns } } : {}),
        ...(reflection !== undefined
          ? { reflections: { ...p.reflections, [stepId]: reflection } }
          : {}),
        ...(action !== undefined ? { actions: { ...p.actions, [stepId]: action } } : {}),
      }))
    },
    [update]
  )

  const setSigns = useCallback(
    (stepId, signs) => {
      update(p => ({ ...p, signs: { ...p.signs, [stepId]: signs } }))
    },
    [update]
  )

  return { progress, completeStep, setSigns }
}

export function readHeroDraft(key) {
  try {
    const raw = readLocal(key)
    if (raw === null) return null
    const value = JSON.parse(raw)
    return {
      reflection: typeof value?.reflection === 'string' ? value.reflection : '',
      action: typeof value?.action === 'string' ? value.action : '',
    }
  } catch {
    return { reflection: '', action: '' }
  }
}

export function clearHeroDraft(key) {
  dropLocal(key)
}
