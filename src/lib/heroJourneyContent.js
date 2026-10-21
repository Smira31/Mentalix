/**
 * Загрузка «Пути героя» с сервера (#1112, этап 3).
 *
 * GET /api/content/hero-journey → { course, prologue, chapters, trials, finale }
 * — тот же формат, что src/data/heroJourney.js, но image.enter/done — строки-ключи.
 *
 * Данные кешируются на сессию: повторно не грузятся при каждом переходе.
 * Картинки разрешаются через словарь src/data/heroJourneyImages.js.
 *
 * Закрытые главы во фронтенд не переносятся: сервер отдаёт весь курс только
 * авторизованному пользователю. Демо/превью показывает встроенную публичную
 * часть (глава I из src/data/demoContent.js) сразу и подхватывает серверный
 * ответ, когда доступ есть; отказ доступа или сбой сети оставляют демо-версию.
 */
import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { isPreviewDemoMode } from './demoMode.js'
import { resolveHeroImage } from '../data/heroJourneyImages.js'
import {
  HERO_JOURNEY_TRIALS,
  HERO_JOURNEY_CHAPTERS,
  HERO_JOURNEY_FINALE,
} from '../data/heroJourney.js'
import { DEMO_HERO_JOURNEY } from '../data/demoContent.js'
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

/* Финал держит собственный кадр картинки: сервер отдаёт тексты, локально —
 * frame/overlap. Без этого объединения завершение курса теряет кадрирование. */
function mergeFinaleWithLocal(serverFinale) {
  if (!serverFinale) return null
  const localImage = HERO_JOURNEY_FINALE.image || {}
  const serverImage = serverFinale.image || {}
  return resolveTrialImages({
    ...serverFinale,
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
  const finale = mergeFinaleWithLocal(data.finale)
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

/* Демо-данные держат картинки ключами: словарь подключается здесь, чтобы
 * src/data/demoContent.js оставался чистым модулем данных. */
function buildDemoCourse() {
  const { coverKey, ...rest } = DEMO_HERO_JOURNEY
  return {
    ...rest,
    cover: resolveHeroImage(coverKey) || cover,
    steps: (rest.steps || []).map(resolveTrialImages),
    finale: resolveTrialImages(rest.finale),
  }
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
    .catch(error => {
      /* Демо/превью: сервер закрыт (401 verified_identity_required) или
         недоступен — показываем встроенную публичную часть курса. В обычной
         сборке отказ остаётся ошибкой загрузки с «Повторить». */
      if (!isPreviewDemoMode()) throw error
      cachedCourse = buildDemoCourse()
      return cachedCourse
    })
    .finally(() => {
      cachedPromise = null
    })

  return cachedPromise
}

export function useHeroJourneyContent(enabled = true) {
  /* enabled=false — тексты «Пути героя» не нужны: этим экраном Библиотека
     открывает и другие практикумы, у них свои данные. */
  const [course, setCourse] = useState(() => {
    if (!enabled) return null
    if (isPreviewDemoMode()) return buildDemoCourse()
    return cachedCourse
  })
  const [loading, setLoading] = useState(() => enabled && !course && !isPreviewDemoMode())
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!enabled) {
      setCourse(null)
      setLoading(false)
      setError(false)
      return
    }
    if (cachedCourse) {
      setCourse(cachedCourse)
      setLoading(false)
      return
    }
    /* Демо/превью: встроенная публичная часть курса видна сразу, без ожидания
       сети; серверный курс заменяет её, если доступ есть. */
    const demo = isPreviewDemoMode()
    if (demo) setCourse(buildDemoCourse())
    else setLoading(true)
    setError(false)
    try {
      const data = await loadHeroJourney()
      setCourse(data)
    } catch {
      if (!demo) setError(true)
    } finally {
      setLoading(false)
    }
  }, [enabled])

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
