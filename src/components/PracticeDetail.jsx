import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Grid2x2, PenLine, Trash2 } from 'lucide-react'
import { platform } from '../platform'
import { useEdgeSwipeBack } from '../lib/gestures/useEdgeSwipeBack'
import { useBackButton } from '../platform/telegram.hooks'
import { RoundBackButton } from './NestedScreenHeader'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import SemanticGlyph, { semanticKindForAsceza, semanticKindForRitual } from './SemanticGlyph'
import { isRitualDoneToday } from '../lib/practiceDoneToday'
import { PRACTICE_WORDING, buildEditPatch } from '../lib/practiceWording'
import { ProgressGlassMenu, ProgressGlassMenuItem } from './ProgressGlassMenu'
import PracticeFieldFlow from './practices/PracticeFieldFlow'
import PracticeSignScreen from './practices/PracticeSignScreen'
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

export default function PracticeDetail({
  kind,
  practice,
  onBack,
  onLog,
  onUpdate,
  onBreak,
  onDelete,
}) {
  const screenRef = useRef(null)
  const [confirming, setConfirming] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sub, setSub] = useState(null)
  const [pulse, setPulse] = useState(false)
  const pulseTimer = useRef(null)
  useEdgeSwipeBack(screenRef, onBack)
  useBackButton(onBack)

  useEffect(() => () => clearTimeout(pulseTimer.current), [])
  const isRitual = kind === 'ritual'
  const wording = PRACTICE_WORDING[kind]
  const done = isRitual ? isRitualDoneToday(practice.today_level) : practice.today_status === 'held'
  // Знак выбирается в меню «…» и хранится вместе с практикой; без него — по названию.
  const glyphKind =
    practice.glyph ||
    (isRitual ? semanticKindForRitual(practice.name) : semanticKindForAsceza(practice))
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
    // Отметка оживляет герой коротким импульсом иконки.
    setPulse(true)
    clearTimeout(pulseTimer.current)
    pulseTimer.current = setTimeout(() => setPulse(false), 520)
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
                  icon={PenLine}
                  label="Изменить"
                  testId="practice-detail-edit"
                  onClick={() => {
                    setMenuOpen(false)
                    setSub('edit')
                  }}
                />
                <ProgressGlassMenuItem
                  icon={Grid2x2}
                  label="Знак"
                  testId="practice-detail-sign"
                  onClick={() => {
                    setMenuOpen(false)
                    setSub('sign')
                  }}
                />
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

      {/* Блок-герой 220: концентрические круги + иконка в круге 96 */}
      <div
        className={`mx-practice-detail__hero${done ? ' is-done' : ''}${pulse ? ' is-pulsing' : ''}`}
      >
        <span className="mx-practice-detail__hero-ring" />
        <span className="mx-practice-detail__hero-ring" />
        <span className="mx-practice-detail__hero-ring" />
        <span className="mx-practice-detail__hero-icon">
          <SemanticGlyph kind={glyphKind} className="w-full h-full" />
        </span>
      </div>

      <p className="mx-practice-detail__streak-label">
        {wording.statusLabel(practice.streak || 0)}
      </p>
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
        {done ? wording.markedButton : wording.markButton}
      </button>

      {sub === 'edit' && (
        <PracticeFieldFlow
          label={wording.editLabel}
          steps={wording.ownSteps}
          initialValues={[practice.name, wording.minimumValue(practice)]}
          onCancel={() => setSub(null)}
          onSubmit={values => {
            const patch = buildEditPatch(kind, values[0], values[1])
            return onUpdate(practice.id, patch).then(updated => {
              if (updated) {
                platform.haptic('success')
                setSub(null)
              }
              return updated
            })
          }}
        />
      )}

      {sub === 'sign' && (
        <PracticeSignScreen
          title={wording.signTitle}
          subtitle={wording.signSubtitle}
          current={glyphKind}
          onCancel={() => setSub(null)}
          onPick={glyph =>
            onUpdate(practice.id, { glyph }).then(updated => {
              if (updated) {
                platform.haptic('success')
                setSub(null)
              }
              return updated
            })
          }
        />
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
