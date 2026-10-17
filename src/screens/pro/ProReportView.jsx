import { useEffect, useRef, useState } from 'react'

import { api } from '../../lib/api'
import {
  ProPollCancelledError,
  pollGenerationReady,
} from '../../lib/proGenerationPolling'
import PageTitle from '../../components/ui/PageTitle'
import Card from '../../components/ui/Card'
import PillButton from '../../components/ui/PillButton'
import ProConsentCard from './ProConsentCard'
import ProStateCard from './ProStateCard'
import ProWaiting from './ProWaiting'
import ProDetails from './ProDetails'
import ProAchievementCard from './ProAchievementCard'
import { proBlockedState, proErrorKey, proErrorMessage, proStatePayload } from './proApiState'
import { formatDayList, formatSources, formatWeekRange, isoDay } from './weekLabel'

import './proText.css'
import './ProReport.css'

/*
 * «Мой разбор» (PRO-002b): недельный AI-разбор.
 *
 * Состояния по контракту GET /api/pro/report: consent_required → приглашение
 * включить согласие (существующий поток /api/mentalix/consent); not_generated
 * → кнопка «Собрать разбор» (POST); ready → текст разбора с обязательным
 * дисклеймером и кнопкой «План недели». Терминальные состояния доступа —
 * 402 pro_required и 404 pro_report_disabled → отдельная карточка, не
 * бесконечная загрузка; недостаток данных (insufficient_data) — отдельное
 * состояние. Ошибки двух форматов: body.detail и body.code.
 * После POST-ответа 409 generation_in_progress — ограниченный опрос GET
 * (окно — 60 с, как таймаут AI-генерации), повторная POST-генерация не
 * отправляется. Генерация запускается только явным действием пользователя.
 * Поздние ответы загрузки отбрасываются по номеру запроса.
 */

const CONFIDENCE_LABELS = { low: 'предположение', medium: 'судя по записям' }

const KNOWN_STATUSES = new Set(['consent_required', 'not_generated', 'ready'])

/*
 * Диапазон недели строится только из двух распознанных ISO-дней. Если дату
 * сервер не прислал (или она не распознана), заголовка недели нет вовсе —
 * «неделя NaN undefined» в интерфейсе не появляется.
 */
function weekRange(payload) {
  const start = isoDay(payload.week_start)
  const end = isoDay(payload.week_end)

  return start && end ? { start, end } : null
}

function ReportList({ items }) {
  return (
    <ul className="mx-pro-report__list">
      {items.map((item, index) => (
        <li key={`${item.text}-${index}`}>
          <p className="mx-pro-text">{item.text}</p>
          {item.days?.length > 0 && (
            <p className="mx-pro-report__item-days">{formatDayList(item.days)}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

function PatternList({ items }) {
  return (
    <ul className="mx-pro-report__list">
      {items.map((item, index) => (
        <li key={`${item.text}-${index}`}>
          <p className="mx-pro-text">{item.text}</p>
          <p className="mx-pro-report__item-days">
            {CONFIDENCE_LABELS[item.confidence] || 'предположение'}
            {item.based_on?.length > 0 ? ` · ${formatDayList(item.based_on)}` : ''}
          </p>
        </li>
      ))}
    </ul>
  )
}

export default function ProReportView({ user, onOpenPlan }) {
  const [status, setStatus] = useState(null) // null — загрузка
  const [report, setReport] = useState(null)
  const [week, setWeek] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [blocked, setBlocked] = useState(null)
  const [insufficient, setInsufficient] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [consentSaving, setConsentSaving] = useState(false)
  const [message, setMessage] = useState('')
  // Отказ сборки: текст из ответа бэкенда и «Попробовать ещё раз» — не пустой
  // экран и не молча вернувшаяся кнопка.
  const [generateError, setGenerateError] = useState(null)
  const [crisisReply, setCrisisReply] = useState(null)
  const aliveRef = useRef(true)
  // Поздний ответ загрузки не затирает новое состояние экрана.
  const loadSeqRef = useRef(0)

  useEffect(() => {
    aliveRef.current = true
    load()
    return () => {
      aliveRef.current = false
    }
  }, [])

  function load() {
    const seq = ++loadSeqRef.current
    setLoadFailed(false)
    setInsufficient(false)
    api.pro
      .getReport()
      .then(data => {
        if (!aliveRef.current || seq !== loadSeqRef.current) return
        const payload = proStatePayload(data)
        if (!payload) {
          // Ответ без состояния Pro (пусто, массив, чужой формат): данные не
          // доставлены. Показываем состояние ошибки с повтором, ничего не
          // форматируем и не запускаем сборку.
          setLoadFailed(true)
          return
        }
        setWeek(weekRange(payload))
        setStatus(payload.status)
        setReport(payload.report || null)
        setBlocked(null)
      })
      .catch(error => {
        if (!aliveRef.current || seq !== loadSeqRef.current) return
        const block = proBlockedState(proErrorKey(error))
        if (block) {
          setBlocked(block)
          return
        }
        console.error(error)
        setLoadFailed(true)
      })
  }

  function applyResult(data, seq) {
    if (!aliveRef.current || seq !== loadSeqRef.current) return
    const payload = proStatePayload(data)
    if (!payload) {
      // Ответ на сборку без состояния Pro: состояние перечитывается GET-ом
      // (та же ручка, что и при «сервер обновился»); повторная POST-генерация
      // не отправляется.
      load()
      return
    }
    if (payload.status === 'crisis') {
      setCrisisReply(payload.reply || null)
      return
    }
    setWeek(weekRange(payload))
    setStatus(payload.status)
    setReport(payload.report || null)
  }

  async function handleGenerate() {
    if (generating) return
    const seq = ++loadSeqRef.current
    setGenerating(true)
    setMessage('')
    setGenerateError(null)
    setInsufficient(false)
    try {
      const res = await api.pro.createReport()
      applyResult(res, seq)
    } catch (error) {
      const key = proErrorKey(error)
      if (!aliveRef.current || seq !== loadSeqRef.current) return
      const block = proBlockedState(key)
      if (block) {
        setBlocked(block)
      } else if (key === 'generation_in_progress') {
        // Повторная POST-генерация не выполняется: ограниченный опрос GET.
        try {
          const final = await pollGenerationReady(() => api.pro.getReport(), {
            isCancelled: () => !aliveRef.current,
          })
          applyResult(final, seq)
        } catch (pollError) {
          if (pollError instanceof ProPollCancelledError) return
          if (!aliveRef.current) return
          setMessage('Разбор ещё собирается — это занимает до минуты. Открой экран чуть позже.')
        }
      } else if (key === 'consent_required') {
        setStatus('consent_required')
      } else if (key === 'insufficient_data') {
        setInsufficient(true)
      } else {
        // 502 report_generation_failed и прочие 5xx: показываем фразу бэкенда,
        // а не свой текст — состояние разбора при этом не теряется.
        console.error(error)
        setGenerateError(
          proErrorMessage(error, 'Не получилось собрать разбор. Попробуй ещё раз.')
        )
      }
    } finally {
      if (aliveRef.current) setGenerating(false)
    }
  }

  async function handleEnableConsent() {
    if (consentSaving || !user?.id) return
    setConsentSaving(true)
    setMessage('')
    try {
      await api.mentalix.setContextConsent(user.id, true)
      if (!aliveRef.current) return
      // После включения согласия GET вернул бы not_generated —
      // следующий шаг: кнопка «Собрать разбор».
      setStatus('not_generated')
    } catch {
      if (aliveRef.current) setMessage('Не удалось включить согласие. Попробуй ещё раз.')
    } finally {
      if (aliveRef.current) setConsentSaving(false)
    }
  }

  // Недоставленное состояние или отказ доступа — не «загрузка»: экран уже
  // показывает карточку состояния с действием.
  const loading = status === null && !loadFailed && !blocked

  return (
    <div>
      <PageTitle>мой разбор.</PageTitle>
      {week && !crisisReply && (
        <p className="font-label mx-pro-caption mt-2" data-testid="pro-report-week">
          {formatWeekRange(week.start, week.end)}
        </p>
      )}

      {loading && <ProWaiting label="Загружаем…" testId="pro-report-loading" />}

      {blocked && <ProStateCard title={blocked.title} text={blocked.text} testId="pro-blocked-state" />}

      {loadFailed && (
        <Card className="mt-4 p-4">
          <p className="mx-pro-note">Не удалось загрузить состояние разбора.</p>
          <PillButton
            variant="dark"
            testId="pro-report-retry"
            onClick={load}
            className="mt-3 w-full"
          >
            Повторить
          </PillButton>
        </Card>
      )}

      {insufficient && (
        <ProStateCard
          title="Недостаточно данных"
          text="За эту неделю слишком мало записей для разбора. Разбор следующей недели соберётся из новых записей."
          actionLabel="Понятно"
          onAction={() => setInsufficient(false)}
          testId="pro-insufficient-state"
        />
      )}

      {!loading && !loadFailed && !blocked && status === 'consent_required' && (
        <ProConsentCard onEnable={handleEnableConsent} saving={consentSaving} note={message} />
      )}

      {!loading && !loadFailed && !blocked && status === 'not_generated' && !generating && !generateError && (
        <section className="mx-pro-intro" data-testid="pro-report-intro">
          <p className="mx-pro-text">
            Разбор недели собирает твои записи — темы, повторяющиеся трудности и достижения — и
            предлагает направление на следующую неделю.
          </p>
          <p className="mx-pro-note">
            Пока разбор не собран. Ты можешь собрать его сейчас или вернуться к нему позже.
          </p>
          <PillButton
            variant="light"
            testId="pro-generate-report"
            onClick={handleGenerate}
            disabled={generating}
            className="mx-pro-intro__action w-full"
          >
            {generating ? 'Собираем разбор…' : 'Собрать разбор'}
          </PillButton>
        </section>
      )}

      {!loading && !loadFailed && !blocked && status !== null && !KNOWN_STATUSES.has(status) && (
        <ProStateCard
          title="Неожиданное состояние"
          text="Сервер вернул незнакомый статус разбора. Попробуй обновить экран."
          actionLabel="Повторить"
          onAction={load}
          testId="pro-unknown-state"
        />
      )}

      {/* Ожидание сборки: спокойный индикатор и одна строка вместо кнопки —
          бэкенд делает AI-вызов (при неудаче — повтор), это занимает минуты. */}
      {!loading && !loadFailed && !blocked && status === 'not_generated' && generating && (
        <ProWaiting
          testId="pro-report-waiting"
          label="Собираю разбор… это может занять до минуты."
        />
      )}

      {/* Отказ сборки: фраза бэкенда и явный повтор — экран не остаётся пустым
          и не показывает молча прежнюю кнопку. */}
      {!loading && !loadFailed && !blocked && generateError && (
        <ProStateCard
          text={generateError}
          actionLabel="Попробовать ещё раз"
          onAction={handleGenerate}
          actionTestId="pro-generate-retry"
          testId="pro-generate-error"
        />
      )}

      {crisisReply && (
        <Card className="mt-4 p-4">
          <p className="mx-pro-text">{crisisReply}</p>
        </Card>
      )}

      {status === 'ready' && report && (
        <div className="mx-pro-report">
          {/* Направление — главный блок сверху: это ориентир на следующую
              неделю, а не доказанная закономерность. */}
          <section className="mx-pro-report__direction" data-testid="pro-report-direction">
            <p className="mx-pro-report__section-label">Направление на неделю</p>
            <p className="mx-pro-report__direction-text">{report.focus_next_week}</p>
          </section>

          {/* Достижения — отдельная карточка на каждое: одна мысль на
              карточку. Без достижений — спокойный текст, не пустой блок. */}
          <section data-testid="pro-report-achievements">
            <h2 className="mx-pro-report__section-label">Достижения</h2>
            {report.achievements?.length > 0 ? (
              <div className="mx-pro-report__cards">
                {report.achievements.map((item, index) => (
                  <ProAchievementCard
                    key={`${item.text}-${index}`}
                    achievement={item}
                    weekStart={week?.start}
                  />
                ))}
              </div>
            ) : (
              <p className="mx-pro-note mx-pro-report__empty">
                На этой неделе достижений не нашлось.
              </p>
            )}
          </section>

          {(report.themes?.length > 0 ||
            report.difficulties?.length > 0 ||
            report.patterns?.length > 0) && (
            <div className="mx-pro-report__details" data-testid="pro-report-details">
              {report.themes?.length > 0 && (
                <ProDetails title="Темы" testId="pro-details-themes">
                  <ul className="mx-pro-report__list">
                    {report.themes.map(theme => (
                      <li key={theme}>
                        <p className="mx-pro-text">{theme}</p>
                      </li>
                    ))}
                  </ul>
                </ProDetails>
              )}

              {report.difficulties?.length > 0 && (
                <ProDetails title="Трудности" testId="pro-details-difficulties">
                  <ReportList items={report.difficulties} />
                </ProDetails>
              )}

              {report.patterns?.length > 0 && (
                <ProDetails title="Наблюдения" testId="pro-details-patterns">
                  <PatternList items={report.patterns} />
                </ProDetails>
              )}
            </div>
          )}

          {report.reflection_questions?.length > 0 && (
            <section className="mx-pro-report__questions" data-testid="pro-report-questions">
              <h2 className="mx-pro-report__section-label">Вопросы для размышления</h2>
              <ul className="mx-pro-report__question-list">
                {report.reflection_questions.map(question => (
                  <li key={question} className="mx-pro-report__question">
                    {question}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mx-pro-report__meta">
            <p className="mx-pro-caption">{formatSources(report.sources)}</p>
            <p className="mx-pro-caption">{report.disclaimer}</p>
          </div>

          <div className="mx-pro-report__action">
            <PillButton
              variant="light"
              testId="pro-open-plan"
              onClick={onOpenPlan}
              className="w-full"
            >
              Перейти к плану недели
            </PillButton>
          </div>
        </div>
      )}

      {message && !crisisReply && (
        <p role="status" className="mx-pro-note mt-3">
          {message}
        </p>
      )}
    </div>
  )
}
