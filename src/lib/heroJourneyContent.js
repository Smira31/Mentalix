/**
 * Загрузка «Пути героя» с сервера (#1112, этап 3).
 *
 * GET /api/content/hero-journey → { course, prologue, chapters, trials, finale }
 * — тот же формат, что src/data/heroJourney.js, но image.enter/done — строки-ключи.
 *
 * Данные живут до закрытия курса; смена профиля отменяет применение старого ответа.
 * Картинки разрешаются через словарь src/data/heroJourneyImages.js.
 *
 * Закрытые главы во фронтенд не переносятся: доступный курс отдаёт сервер
 * с учётом прав пользователя. Демо/превью показывает только встроенную
 * публичную часть (глава I из src/data/demoContent.js), без запросов сервера.
 * Обычный режим загружает серверный ответ; отказ не подменяется демо-версией.
 */
import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'
import { heroJourneyErrorKind, validateHeroJourneyPayload } from './heroJourneyPayload.js'
import { isPreviewDemoMode } from './demoMode.js'
import { resolveHeroImage } from '../data/heroJourneyImages.js'
import {
  HERO_JOURNEY_TRIALS,
  HERO_JOURNEY_CHAPTERS,
  HERO_JOURNEY_FINALE,
} from '../data/heroJourney.js'
import { DEMO_HERO_JOURNEY } from '../data/demoContent.js'
import cover from '../assets/hero-journey/course-cover@2x.webp'

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

export function useHeroJourneyContent(enabled = true, userId = null) {
  const demo = isPreviewDemoMode()
  const [attempt, setAttempt] = useState(0)
  const initialState = () => ({
    userId,
    course: enabled && demo ? buildDemoCourse() : null,
    source: demo ? 'demo' : null,
    loading: enabled && !demo,
    error: null,
  })
  const [state, setState] = useState(initialState)

  useEffect(() => {
    // Данные принадлежат смонтированному экрану и текущему пользователю.
    // Общего кеша нет: поздний ответ A не должен попасть к пользователю B,
    // а публичный fallback не должен навсегда подменить серверный курс.
    let active = true
    const fallback = enabled && demo ? buildDemoCourse() : null
    /* Демо/превью: встроенная публичная часть показывается сразу и без запроса —
       обёртка API перехватывает демо-запросы и контракта курса не знает.
       Вне демо серверный курс приходит как раньше: с проверкой формата и с
       причиной отказа, отличной от пустого курса. */
    setState({
      userId,
      course: fallback,
      source: demo ? 'demo' : null,
      loading: enabled && !demo,
      error: null,
    })
    if (enabled && !demo) {
      api.content.heroJourney().then(
        data => {
          try {
            const course = buildCourseFromServer(validateHeroJourneyPayload(data))
            if (active) setState({ userId, course, source: 'server', loading: false, error: null })
          } catch {
            if (active)
              setState({ userId, course: null, source: null, loading: false, error: 'load' })
          }
        },
        error => {
          if (active)
            setState({
              userId,
              course: null,
              source: null,
              loading: false,
              error: heroJourneyErrorKind(error),
            })
        }
      )
    }
    return () => {
      active = false
    }
  }, [enabled, userId, demo, attempt])

  const retry = useCallback(() => setAttempt(value => value + 1), [])
  // На самой первой отрисовке нового профиля старые серверные тексты скрыты.
  return { ...(state.userId === userId ? state : initialState()), retry }
}
