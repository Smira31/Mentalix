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
import { formatDayList, formatSources, formatWeekRange } from './weekLabel'

/*
 * «Мой разбор» (PRO-002b): недельный AI-разбор.
 *
 * Состояния по контракту GET /api/pro/report: consent_required → приглашение
 * включить согласие (существующий поток /api/mentalix/consent); not_generated
 * → кнопка «Собрать разбор» (POST); ready → текст разбора с обязательным
 * дисклеймером и кнопкой «План недели». После POST-ответа 409
 * generation_in_progress — ограниченный опрос GET, повторная POST-генерация
 * не отправляется. Генерация запускается только явным действием пользователя.
 */

const CONFIDENCE_LABELS = { low: 'предположение', medium: 'судя по записям' }

function Section({ title, children }) {
  return (
    <div className="mt-5">
      <p className="font-label text-[11px] uppercase tracking-wider text-muted">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function DatedList({ items }) {
  return (
    <Card className="p-4">
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={`${item.text}-${index}`}>
            <p className="text-[14px] leading-relaxed text-cream">{item.text}</p>
            {item.days?.length > 0 && (
              <p className="mt-1 text-[11px] text-muted">{formatDayList(item.days)}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function PatternList({ items }) {
  return (
    <Card className="p-4">
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={`${item.text}-${index}`}>
            <p className="text-[14px] leading-relaxed text-cream">{item.text}</p>
            <p className="mt-1 text-[11px] text-muted">
              {CONFIDENCE_LABELS[item.confidence] || 'предположение'}
              {item.based_on?.length > 0 ? ` · ${formatDayList(item.based_on)}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function ProReportView({ user, onOpenPlan }) {
  const [status, setStatus] = useState(null) // null — загрузка
  const [report, setReport] = useState(null)
  const [week, setWeek] = useState(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [consentSaving, setConsentSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [crisisReply, setCrisisReply] = useState(null)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    load()
    return () => {
      aliveRef.current = false
    }
  }, [])

  function load() {
    setLoadFailed(false)
    api.pro
      .getReport()
      .then(data => {
        if (!aliveRef.current) return
        setWeek({ start: data.week_start, end: data.week_end })
        setStatus(data.status)
        setReport(data.report || null)
      })
      .catch(error => {
        console.error(error)
        if (!aliveRef.current) return
        setLoadFailed(true)
      })
  }

  function applyResult(data) {
    if (!aliveRef.current) return
    if (data.status === 'crisis') {
      setCrisisReply(data.reply || null)
      return
    }
    setWeek({ start: data.week_start, end: data.week_end })
    setStatus(data.status)
    setReport(data.report || null)
  }

  async function handleGenerate() {
    if (generating) return
    setGenerating(true)
    setMessage('')
    try {
      const res = await api.pro.createReport()
      applyResult(res)
    } catch (error) {
      const key = error?.body?.code || error?.body?.detail
      if (key === 'generation_in_progress') {
        // Повторная POST-генерация не выполняется: ограниченный опрос GET.
        try {
          const final = await pollGenerationReady(() => api.pro.getReport(), {
            isCancelled: () => !aliveRef.current,
          })
          applyResult(final)
        } catch (pollError) {
          if (pollError instanceof ProPollCancelledError) return
          setMessage('Разбор ещё собирается. Открой экран чуть позже.')
        }
      } else if (key === 'consent_required') {
        setStatus('consent_required')
      } else if (key === 'insufficient_data') {
        setMessage('За эту неделю слишком мало записей для разбора.')
      } else {
        console.error(error)
        setMessage('Не удалось собрать разбор. Попробуй ещё раз.')
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

  const loading = status === null

  return (
    <div>
      <PageTitle>мой разбор.</PageTitle>
      {week && !crisisReply && (
        <p className="font-label mt-2 text-[12px] text-muted">
          {formatWeekRange(week.start, week.end)}
        </p>
      )}

      {loading && <p className="mt-6 text-[13px] text-muted">Загружаем…</p>}

      {loadFailed && (
        <Card className="mt-4 p-4">
          <p className="text-[13px] text-muted">Не удалось загрузить состояние разбора.</p>
          <PillButton variant="dark" onClick={load} className="mt-3 w-full">
            Повторить
          </PillButton>
        </Card>
      )}

      {!loading && !loadFailed && status === 'consent_required' && (
        <ProConsentCard onEnable={handleEnableConsent} saving={consentSaving} note={message} />
      )}

      {!loading && !loadFailed && status === 'not_generated' && (
        <Card className="mt-4 p-4">
          <p className="text-[14px] leading-relaxed text-cream">
            Разбор этой недели ещё не собран. Он интерпретирует твои записи: темы, повторяющиеся
            трудности и достижения.
          </p>
          <PillButton
            variant="light"
            testId="pro-generate-report"
            onClick={handleGenerate}
            disabled={generating}
            className="mt-3 w-full"
          >
            {generating ? 'Собираем разбор…' : 'Собрать разбор'}
          </PillButton>
        </Card>
      )}

      {generating && (
        <p role="status" className="mt-3 text-[12px] text-muted">
          Собираем разбор — это занимает до минуты.
        </p>
      )}

      {crisisReply && (
        <Card className="mt-4 p-4">
          <p className="text-[14px] leading-relaxed text-cream">{crisisReply}</p>
        </Card>
      )}

      {status === 'ready' && report && (
        <div>
          <Section title="Направление на неделю">
            <Card className="p-4">
              <p className="text-[15px] font-semibold leading-relaxed text-cream">
                {report.focus_next_week}
              </p>
            </Card>
          </Section>

          {report.themes?.length > 0 && (
            <Section title="Темы">
              <div className="flex flex-wrap gap-2">
                {report.themes.map(theme => (
                  <span
                    key={theme}
                    className="rounded-full bg-cream/5 px-3 py-1.5 text-[12px] text-cream"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {report.difficulties?.length > 0 && (
            <Section title="Трудности">
              <DatedList items={report.difficulties} />
            </Section>
          )}

          {report.achievements?.length > 0 && (
            <Section title="Достижения">
              <DatedList items={report.achievements} />
            </Section>
          )}

          {report.patterns?.length > 0 && (
            <Section title="Закономерности">
              <PatternList items={report.patterns} />
            </Section>
          )}

          {report.reflection_questions?.length > 0 && (
            <Section title="Вопросы для рефлексии">
              <Card className="p-4">
                <ul className="space-y-2">
                  {report.reflection_questions.map(question => (
                    <li key={question} className="text-[14px] leading-relaxed text-muted">
                      {question}
                    </li>
                  ))}
                </ul>
              </Card>
            </Section>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            {formatSources(report.sources)}
          </p>

          <p className="mt-2 text-[11px] leading-relaxed text-muted">{report.disclaimer}</p>

          <div className="mt-6">
            <PillButton
              variant="light"
              testId="pro-open-plan"
              onClick={onOpenPlan}
              className="w-full"
            >
              План недели
            </PillButton>
          </div>
        </div>
      )}

      {message && !crisisReply && (
        <p role="status" className="mt-3 text-[12px] leading-relaxed text-muted">
          {message}
        </p>
      )}
    </div>
  )
}
