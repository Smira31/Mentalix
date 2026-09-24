import { useState } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import { platform } from '../platform'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import { semanticKindForAsceza, semanticKindForRitual, SemanticGlyph } from './SemanticGlyph'

function AccordionRow({ testId, label, children }) {
  const [open, setOpen] = useState(false)
  if (!children) return null
  return (
    <div className="mx-practice-detail__accordion">
      <button
        type="button"
        className="mx-practice-detail__accordion-toggle"
        aria-expanded={open}
        data-testid={testId}
        onClick={() => setOpen(value => !value)}
      >
        <span>{label}</span>
        <ChevronDown size={18} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>
      {open && <div className="mx-practice-detail__accordion-content">{children}</div>}
    </div>
  )
}

export default function PracticeDetail({
  kind,
  practice,
  onBack,
  onLog,
  onBreak,
  onDelete,
}) {
  const [confirming, setConfirming] = useState(false)
  const isRitual = kind === 'ritual'
  const done = isRitual ? Boolean(practice.today_level) : practice.today_status === 'held'
  const glyphKind = isRitual ? semanticKindForRitual(practice.name) : semanticKindForAsceza(practice)
  const why = practice.goal || practice.reason
  const how = isRitual
    ? [
        practice.min_version && `Минимум: ${practice.min_version}`,
        practice.optimal_version && `Оптимум: ${practice.optimal_version}`,
      ]
        .filter(Boolean)
        .join('\n')
    : practice.description ||
      [
        practice.trigger && `Триггер: ${practice.trigger}`,
        practice.replacement && `Замена: ${practice.replacement}`,
        practice.relapse_cost && `Цена срыва: ${practice.relapse_cost}`,
      ]
        .filter(Boolean)
        .join('\n')
  const note = practice.note || practice.notes || practice.today_note

  async function toggle() {
    if (done) return
    platform.haptic('success')
    const level = isRitual
      ? practice.optimal_version
        ? 'optimal'
        : practice.min_version
          ? 'min'
          : 'optimal'
      : 'held'
    await onLog(practice.id, level)
  }

  return (
    <div className="mx-practice-detail-screen w-full max-w-md px-[var(--mx-screen-x)] animate-fade-in">
      <div className="mx-practice-detail-screen__header">
        <button type="button" className="mx-practice-detail__back" onClick={onBack}>
          ‹ <span>назад</span>
        </button>
        <button
          type="button"
          className="mx-practice-detail__delete"
          aria-label={`Удалить ${practice.name}`}
          onClick={() => setConfirming(true)}
        >
          <Trash2 size={18} />
        </button>
      </div>

      <button
        type="button"
        className={`mx-practice-detail__toggle ${done ? 'is-done' : ''}`}
        data-testid="practice-detail-toggle"
        aria-pressed={done}
        onClick={toggle}
      >
        <span className="mx-practice-detail__glyph">
          <SemanticGlyph kind={glyphKind} className="w-full h-full" />
        </span>
        <span className="mx-practice-detail__name">{practice.name}</span>
        <span className="mx-practice-detail__state">{done ? 'отмечено сегодня' : 'отметить сегодня'}</span>
      </button>

      <div className="mx-practice-detail__accordions">
        <AccordionRow testId="practice-accordion-why" label="Зачем">
          <p>{why}</p>
        </AccordionRow>
        <AccordionRow testId="practice-accordion-how" label="Как">
          <p className="whitespace-pre-line">{how}</p>
        </AccordionRow>
        <AccordionRow testId="practice-accordion-note" label="Заметка">
          <p>{note}</p>
        </AccordionRow>
      </div>

      {!isRitual && (
        <button type="button" className="mx-practice-detail__quiet-action" onClick={() => onBreak(practice)}>
          Сорвался сегодня
        </button>
      )}

      {confirming && (
        <DeleteConfirmationDialog
          itemType={isRitual ? 'ритуал' : 'аскезу'}
          itemName={practice.name}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            platform.haptic('rigid')
            onDelete(practice.id)
            setConfirming(false)
          }}
        />
      )}
    </div>
  )
}

export { AccordionRow }
