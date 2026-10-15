import { useCallback, useEffect, useRef, useState } from 'react'

import { api } from '../../lib/api'
import { proBlockedState, proErrorKey, proStatePayload } from './proApiState'
import { formatWeekRange, isoDay } from './weekLabel'
import { PAYMENT_UI_ENABLED } from '../../lib/paymentConfig'

import './ProAnalyticsCard.css'

/*
 * Mentalix Pro: карточка входа в разбор недели («Прогресс → Аналитика»).
 *
 * Оболочка и композиция — образец владельца, карточка «Твои практики»:
 * те же классы `.mx-progress-card` и та же композиция «кольцо слева, текст
 * справа» (`.mx-progress-practices__empty*`, §5.5 DESIGN_SYSTEM). Своих
 * отступов, радиусов и типографики карточка не задаёт — они берутся из
 * классов образца.
 *
 * Кольцо показывает готовность РАЗБОРА (не выполнение плана) по данным
 * существующего контракта — GET /api/pro/report:
 *   not_generated / consent_required — пустое кольцо, «Подведи итоги недели»;
 *   ready                            — кольцо целиком в акценте, «Разбор готов»;
 *   отказ доступа (402/404)          — нейтральное кольцо без ложного «разбора нет»;
 *   ошибка запроса                   — нейтральное кольцо и повтор загрузки.
 *
 * Процентов сборки нет: готовность — это состояние данных, а не нажатие
 * кнопки. Карточка делает только GET; генерация (POST) и включение согласия
 * остаются экранам Pro. Незнакомый статус не выдаётся ни за «готово», ни за
 * «разбора нет». Поздние ответы отбрасываются по номеру запроса, а смена
 * профиля перемонтирует карточку (key по профилю в Analytics) — чужой разбор
 * показать нельзя.
 *
 * Состояние сборки карточка статусом GET не трактует: GET /api/pro/report его
 * не сообщает — generation_in_progress приходит только кодом ошибки POST 409,
 * а разбирает его экран разбора ограниченным опросом GET
 * (`src/lib/proGenerationPolling.js`). Это задокументированное ограничение
 * backend-контракта: пока в GET-ответе нет признака сборки, «идёт сборка» из
 * аналитики недостижимо, и новый endpoint для этого не выдумывается.
 */

const RING_COPY = {
  loading: { title: 'Разбор недели', hint: 'Проверяем готовность разбора' },
  not_generated: { title: 'Подведи итоги недели', hint: 'Разбор соберётся из записей недели' },
  ready: { title: 'Разбор готов', hint: 'Посмотри, что получилось за неделю' },
  blocked: { title: 'Разбор недели', hint: 'Открой, чтобы узнать подробнее' },
  error: { title: 'Не удалось загрузить', hint: 'Проверь связь и повтори загрузку' },
}

/* Состояние данных → состояние кольца. Незнакомый статус — не готовность. */
function ringState(status) {
  if (status === 'ready') return 'ready'
  if (status === 'not_generated' || status === 'consent_required') return 'not_generated'
  return 'error'
}

/* Диапазон недели — только из двух распознанных ISO-дней разбора. */
function weekRange(payload) {
  const start = isoDay(payload.week_start)
  const end = isoDay(payload.week_end)

  return start && end ? { start, end } : null
}

export default function ProAnalyticsCard({ onOpen, onOpenSubscription, refreshToken = 0 }) {
  const [state, setState] = useState('loading')
  const [week, setWeek] = useState(null)
  const [hasPro, setHasPro] = useState(null)
  const aliveRef = useRef(true)
  // Поздний ответ загрузки не затирает новое состояние карточки.
  const loadSeqRef = useRef(0)

  const load = useCallback(() => {
    const seq = ++loadSeqRef.current
    api.pro
      .getReport()
      .then(data => {
        if (!aliveRef.current || seq !== loadSeqRef.current) return
        const payload = proStatePayload(data)
        if (!payload) {
          // Ответ без состояния Pro: данные не доставлены — нейтральное
          // состояние с повтором, а не «разбора нет».
          setWeek(null)
          setState('error')
          return
        }
        setWeek(weekRange(payload))
        setState(ringState(payload.status))
      })
      .catch(error => {
        if (!aliveRef.current || seq !== loadSeqRef.current) return
        setWeek(null)
        setState(proBlockedState(proErrorKey(error)) ? 'blocked' : 'error')
      })
  }, [])

  // PAY-UI-001: при включённом флаге проверяем has_pro для кнопки «Оформить Pro»
  useEffect(() => {
    if (!PAYMENT_UI_ENABLED) return
    api.subscription
      .get()
      .then(s => {
        if (aliveRef.current) setHasPro(Boolean(s?.has_pro))
      })
      .catch(() => {})
  }, [refreshToken])

  useEffect(() => {
    aliveRef.current = true
    load()
    return () => {
      aliveRef.current = false
    }
  }, [load, refreshToken])

  const copy = RING_COPY[state]
  // Период — по датам разбора; без них подпись нейтральная, а не «за неделю».
  const period = week ? formatWeekRange(week.start, week.end) : 'Итоги недели'

  return (
    <article
      className={`mx-progress-card mx-pro-analytics-card mx-pro-analytics-card--${state}`}
      data-testid="progress-pro-card"
      data-state={state}
    >
      <span className="mx-progress-card__head mx-pro-analytics-card__head">
        <span className="mx-progress-card__title mx-pro-analytics-card__title">
          Разбор и план недели
        </span>
        <span
          className="mx-progress-card__subtitle mx-pro-analytics-card__subtitle"
          data-testid="pro-card-period"
        >
          {period}
        </span>
      </span>

      <button
        type="button"
        className="mx-progress-practices__empty mx-pro-analytics-card__open"
        data-testid="pro-card-open"
        aria-label={`Разбор и план недели. ${copy.title}`}
        onClick={onOpen}
      >
        <span
          className="mx-progress-practices__empty-ring mx-pro-analytics-card__ring"
          aria-hidden="true"
        ></span>
        <span className="mx-progress-practices__empty-text">
          <span className="mx-progress-practices__empty-dot" aria-hidden="true" />
          <span className="mx-progress-practices__empty-title" data-testid="pro-card-title">
            {copy.title}
          </span>
          <span className="mx-progress-practices__empty-hint" data-testid="pro-card-hint">
            {copy.hint}
          </span>
        </span>
      </button>

      {state === 'error' && (
        <button
          type="button"
          className="mx-pro-analytics-card__retry"
          data-testid="pro-card-retry"
          onClick={load}
        >
          Повторить загрузку
        </button>
      )}

      {/* PAY-UI-001: кнопка «Оформить Pro» — только при включённом флаге
          и без активного Pro. Остальное в карточке не меняется. */}
      {PAYMENT_UI_ENABLED && hasPro === false && onOpenSubscription && (
        <button
          type="button"
          className="mx-pro-analytics-card__buy-pro"
          data-testid="pro-card-buy-pro"
          onClick={onOpenSubscription}
        >
          Оформить Pro
        </button>
      )}
    </article>
  )
}
