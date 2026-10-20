/**
 * Загрузка «Пути героя» с сервера (#1112, этап 3).
 *
 * GET /api/content/hero-journey → { course, prologue, chapters, trials, finale }
 * — тот же формат, что src/data/heroJourney.js, но image.enter/done — строки-ключи.
 *
 * Данные кешируются на сессию: повторно не грузятся при каждом переходе.
 * Картинки разрешаются через словарь src/data/heroJourneyImages.js.
 * В демо-режиме (?demo=1) используются встроенные демо-данные
 * (src/data/demoContent.js) — без запроса к серверу.
 */
import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { isPreviewDemoMode } from './demoMode'
import { resolveHeroImage } from '../data/heroJourneyImages'
import { HERO_JOURNEY_TRIALS, HERO_JOURNEY_CHAPTERS } from '../data/heroJourney'
import { DEMO_HERO_JOURNEY } from '../data/demoContent'
import cover from '../assets/hero-journey/course-cover@2x.webp'

// Сессионный кеш: загружается один раз за сессию.
let cachedCourse = null
let cachedPromise = null

/**
 * Разрешает картинки в server-данных: заменяет строковые ключи
 * image.enter / image.done на импортированные webp.
 * Если ключа нет — null (шаг показывается без картинки).
 */
function resolveTrialImages(trial) {
  if (!trial) return trial
  const image = { ...trial.image }
  if (image.enter) image.enter = resolveHeroImage(image.enter)
  if (image.done) image.done = resolveHeroImage(image.done)
  return { ...trial, image }
}

/**
 * Объединяет server-данные с локальными структурными данными
 * (frame, overlap, focus, compact), если сервер их не вернул.
 */
function mergeTrialWithLocal(serverTrial) {
  const local = HERO_JOURNEY_TRIALS.find(t => t.id === serverTrial.id)
  if (!local) return resolveTrialImages(serverTrial)
  const serverImage = serverTrial.image || {}
  const localImage = local.image || {}
  return resolveTrialImages({
    ...serverTrial,
    image: {
      ...localImage,
      ...serverImage,
      enter: serverImage.enter || localImage.enter,
      done: serverImage.done || localImage.done,
    },
  })
}

function buildCourseFromServer(data) {
  const trials = (data.trials || []).map(mergeTrialWithLocal)
  const finale = data.finale ? resolveTrialImages(data.finale) : null
  return {
    id: 'hero-journey',
    title: data.course?.title || 'Путь героя',
    subtitle: data.course?.subtitle || '16 шагов · 4 главы',
    description: data.course?.description || '',
    label: 'ПРАКТИКУМ · 16 ШАГОВ',
    cover,
    imageWidth: 480,
    imageHeight: 960,
    steps: trials,
    chapters: data.chapters || HERO_JOURNEY_CHAPTERS,
    prologue: data.prologue || null,
    finale,
  }
}

function buildDemoCourse() {
  return DEMO_HERO_JOURNEY
}

async function loadHeroJourney() {
  if (cachedCourse) return cachedCourse
  if (cachedPromise) return cachedPromise

  cachedPromise = api.content
    .heroJourney()
    .then(data => {
      cachedCourse = buildCourseFromServer(data)
      return cachedCourse
    })
    .finally(() => {
      cachedPromise = null
    })

  return cachedPromise
}

export function useHeroJourneyContent() {
  const [course, setCourse] = useState(() => {
    if (isPreviewDemoMode()) return buildDemoCourse()
    return cachedCourse
  })
  const [loading, setLoading] = useState(() => !course && !isPreviewDemoMode())
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (isPreviewDemoMode()) {
      setCourse(buildDemoCourse())
      setLoading(false)
      return
    }
    if (cachedCourse) {
      setCourse(cachedCourse)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const data = await loadHeroJourney()
      setCourse(data)
    } catch (e) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const retry = useCallback(() => {
    cachedCourse = null
    cachedPromise = null
    load()
  }, [load])

  return { course, loading, error, retry }
}

// Для тестов: сброс кеша.
export function resetHeroJourneyCache() {
  cachedCourse = null
  cachedPromise = null
}
