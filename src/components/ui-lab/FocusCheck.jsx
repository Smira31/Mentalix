import { useState } from 'react'
import journalMarkdown from '../../../docs/working/ui-lab/EXPERIMENT_JOURNAL.md?raw'
import './FocusCheck.css'

const EXPERIMENT_ID = 'UI-EXP-003'
const PREVIEW_HREF = '?ui_lab=practice-catalog'
const RESULT_LABELS = {
  accept: 'Принять',
  repeat: 'Повторить',
  defer: 'Отложить',
  reject: 'Отклонить',
}

function getExperimentRow(markdown, id) {
  const row = markdown.split('\n').find(line => line.includes(`\`${id}\``))
  if (!row) throw new Error(`Experiment ${id} is missing from EXPERIMENT_JOURNAL.md`)
  const cells = row
    .split('|')
    .map(cell => cell.trim())
    .filter(Boolean)
  return {
    id: cells[0].replaceAll('`', ''),
    date: cells[1],
    scope: cells[2],
    evidence: cells[4],
    status: cells[5],
    nextStep: cells[6],
  }
}

function checklistFromNextStep(nextStep) {
  const text = nextStep
    .replaceAll('**', '')
    .replace(/До gate.*$/i, '')
    .trim()
  return text
    .replace(/^Проверить на реальном Telegram\/iPhone:\s*/i, '')
    .split(/,\s*|\s+и\s+/)
    .map(item => item.trim().replace(/\.$/, ''))
    .filter(Boolean)
}

const experiment = getExperimentRow(journalMarkdown, EXPERIMENT_ID)
const checklist = checklistFromNextStep(experiment.nextStep)

async function persistDecision(decision) {
  const response = await fetch('/__ui_lab/decision', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ experimentId: EXPERIMENT_ID, decision }),
  })
  if (!response.ok) throw new Error('Запись доступна только в локальном UI Lab tooling')
  return response.json()
}

export default function FocusCheck() {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState('')

  async function choose(decision) {
    setSaving(decision)
    setMessage('')
    try {
      await persistDecision(decision)
      setMessage(`Результат «${RESULT_LABELS[decision]}» записан в оба журнала.`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving('')
    }
  }

  return (
    <section
      className="mx-focus-check"
      aria-labelledby="focus-check-title"
      data-experiment-id={EXPERIMENT_ID}
    >
      <div className="mx-focus-check__eyebrow">UI Lab · focused check</div>
      <div className="mx-focus-check__heading">
        <div>
          <h2 id="focus-check-title">{EXPERIMENT_ID} · Ярусный каталог</h2>
          <p>Один экран для ручного gate. Production не подключён.</p>
        </div>
        <span className="mx-focus-check__status">{experiment.status}</span>
      </div>
      <div className="mx-focus-check__meta">
        <span>Последний Preview</span>
        <a href={PREVIEW_HREF} data-testid="focus-check-open-preview">
          Открыть UI Lab эксперимент →
        </a>
      </div>
      <div className="mx-focus-check__card">
        <div>
          <span className="mx-focus-check__label">Что проверить</span>
          <p className="mx-focus-check__source">Из EXPERIMENT_JOURNAL.md · {experiment.date}</p>
        </div>
        <ul>
          {checklist.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="mx-focus-check__actions" aria-label="Результат проверки">
        {Object.entries(RESULT_LABELS).map(([decision, label]) => (
          <button
            key={decision}
            type="button"
            disabled={Boolean(saving)}
            onClick={() => choose(decision)}
          >
            {saving === decision ? 'Записываю…' : label}
          </button>
        ))}
      </div>
      <p className="mx-focus-check__feedback" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  )
}

export { checklistFromNextStep, getExperimentRow }
