import { useRef, useState } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import { platform } from '../platform'
import { useEdgeSwipeBack } from '../lib/gestures/useEdgeSwipeBack'
import { useBackButton } from '../platform/telegram.hooks'
import { RoundBackButton } from './NestedScreenHeader'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import SemanticGlyph, { semanticKindForAsceza, semanticKindForRitual } from './SemanticGlyph'
import { isRitualDoneToday } from '../lib/practiceDoneToday'
import { ProgressGlassMenu, ProgressGlassMenuItem } from './ProgressGlassMenu'
import './PracticeDetail.css'

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
        <ChevronDown
          size={18}
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>
      {open && <div className="mx-practice-detail__accordion-content">{children}</div>}
    </div>
  )
}

export default function PracticeDetail({ kind, practice, onBack, onLog, onBreak, onDelete }) {
  const screenRef = useRef(null)
  const [confirming, setConfirming] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEdgeSwipeBack(screenRef, onBack)
  useBackButton(onBack)
  const isRitual = kind === 'ritual'
  const done = isRitual ? isRitualDoneToday(practice.today_level) : practice.today_status === 'held'
  const glyphKind = isRitual
    ? semanticKindForRitual(practice.name)
    : semanticKindForAsceza(practice)
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
    platform.haptic('success')
    if (done) {
      await onLog(practice.id, null)
      return
    }
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
    <div
      ref={screenRef}
      className="mx-practice-detail-screen w-full max-w-md px-[var(--mx-screen-x)] animate-fade-in"
    >
      <div className="mx-practice-detail-screen__header">
        <RoundBackButton onClick={onBack} />
        <div className="mx-practice-detail__menu-wrap">
          <button
            type="button"
            className="mx-practice-detail__menu"
            aria-label="Действия"
            aria-expanded={menuOpen}
            data-testid="practice-detail-menu"
            onClick={() => setMenuOpen(value => !value)}
          >
            …
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Закрыть меню"
                className="mx-practice-detail__menu-overlay"
                onClick={() => setMenuOpen(false)}
              />
              <ProgressGlassMenu
                role="menu"
                aria-label="Действия"
                style={{ position: 'absolute', top: '44px', right: 0 }}
              >
                <ProgressGlassMenuItem
                  icon={Trash2}
                  label="Удалить"
                  danger
                  testId="practice-detail-delete"
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirming(true)
                  }}
                />
              </ProgressGlassMenu>
            </>
          )}
        </div>
      </div>
      <h1 className="font-display mx-type-page text-cream lowercase mb-5">
        {practice.name.toLowerCase()}.
      </h1>

      <div className="mx-practice-detail__accordions">
        <AccordionRow testId="practice-accordion-why" label="Зачем">
          {why && <p>{why}</p>}
        </AccordionRow>
        <AccordionRow testId="practice-accordion-how" label="Как">
          {how && <p className="whitespace-pre-line">{how}</p>}
        </AccordionRow>
        <AccordionRow testId="practice-accordion-note" label="Заметка">
          {note && <p>{note}</p>}
        </AccordionRow>
      </div>

      {!isRitual && (
        <button
          type="button"
          className="mx-practice-detail__quiet-action"
          onClick={() => onBreak(practice)}
        >
          Сорвался сегодня
        </button>
      )}

      <button
        type="button"
        className="mx-practice-detail__mark"
        data-testid="practice-detail-toggle"
        aria-pressed={done}
        onClick={toggle}
      >
        {done ? 'Отмечено сегодня ✓' : 'Отметить сегодня'}
      </button>

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
