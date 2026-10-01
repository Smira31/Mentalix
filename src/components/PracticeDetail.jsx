import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Grid2x2, PenLine, Trash2 } from 'lucide-react'
import { platform } from '../platform'
import { useEdgeSwipeBack } from '../lib/gestures/useEdgeSwipeBack'
import { useBackButton } from '../platform/telegram.hooks'
import { RoundBackButton } from './NestedScreenHeader'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import SemanticGlyph, { semanticKindForAsceza, semanticKindForRitual } from './SemanticGlyph'
import { isRitualDoneToday } from '../lib/practiceDoneToday'
import {
  PRACTICE_WORDING,
  RESTORE_LINK_LABEL,
  buildEditPatch,
  canRestoreYesterday,
} from '../lib/practiceWording'
import { ProgressGlassMenu, ProgressGlassMenuItem } from './ProgressGlassMenu'
import PracticeFieldFlow from './practices/PracticeFieldFlow'
import PracticeSignScreen from './practices/PracticeSignScreen'
import PracticeWeek from './practices/PracticeWeek'
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
  onRestore,
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
  // Ритуал с двумя ступенями отмечается уровнем (минимум / оптимум);
  // у остальных практик остаётся одна кнопка отметки.
  const hasLevels = isRitual && Boolean(practice.min_version && practice.optimal_version)
  // Знак выбирается в меню «…» и хранится вместе с практикой; без него — по названию.
  const glyphKind =
    practice.glyph ||
    (isRitual ? semanticKindForRitual(practice.name) : semanticKindForAsceza(practice))
  const why = practice.goal || practice.reason
  // «Как» — только обязательная часть: минимум у ритуала и описание у аскезы.
  // Оптимум и триггер с заменой живут необязательными строками «+ …».
  const how = isRitual
    ? [practice.min_version && `Минимум: ${practice.min_version}`]
        .filter(Boolean)
        .join('\n')
    : practice.description || ''
  const optionalFields = wording.optionalFields || []
  const canRestore = canRestoreYesterday(practice, kind)
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

  // Отметка уровня: повторный тап по активной ступени снимает отметку.
  async function logLevel(level) {
    platform.haptic('success')
    if (practice.today_level === level) {
      await onLog(practice.id, null)
      return
    }
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
                    setSub({ type: 'edit' })
                  }}
                />
                <ProgressGlassMenuItem
                  icon={Grid2x2}
                  label="Знак"
                  testId="practice-detail-sign"
                  onClick={() => {
                    setMenuOpen(false)
                    setSub({ type: 'sign' })
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

      {/* Карточка «Зачем»: смысл практики и необязательные строки «+ …» */}
      <div className="mx-practice-detail__accordions">
        <AccordionRow testId="practice-accordion-why" label="Зачем">
          {why && <p>{why}</p>}
        </AccordionRow>

        {optionalFields.map(field => {
          const value = practice[field.key]
          return (
            <button
              type="button"
              key={field.key}
              className={`mx-practice-detail__field${value ? ' is-set' : ''}`}
              data-testid={`practice-detail-field-${field.key}`}
              onClick={() => {
                platform.haptic('light')
                setSub({ type: 'field', field })
              }}
            >
              <span className="mx-practice-detail__field-label">
                {value ? field.label : `+ ${field.label}`}
              </span>
              {value && <span className="mx-practice-detail__field-value">{value}</span>}
            </button>
          )
        })}

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

      {/* ЭТА НЕДЕЛЯ: неделя кружками и правило про один пропуск */}
      <section className="mx-practice-detail__week" data-testid="practice-detail-week">
        <p className="mx-practice-detail__week-title">Эта неделя</p>
        <PracticeWeek streak={practice.streak || 0} />
        <p className="mx-practice-detail__week-hint">1 пропуск в неделю не рвёт серию</p>
      </section>

      {/* Вчера не отмечено — тихая ссылка на восстановление дня */}
      {canRestore && (
        <button
          type="button"
          className="mx-practice-detail__restore"
          data-testid="practice-restore-yesterday"
          onClick={() => {
            platform.haptic('light')
            onRestore?.(practice)
          }}
        >
          {RESTORE_LINK_LABEL}
        </button>
      )}

      {hasLevels ? (
        <div className="mx-practice-detail__levels">
          {[
            { value: 'min', caption: 'Минимум', text: practice.min_version },
            { value: 'optimal', caption: 'Оптимум', text: practice.optimal_version },
          ].map(item => (
            <button
              type="button"
              key={item.value}
              className={`mx-practice-detail__level${
                practice.today_level === item.value ? ' is-active' : ''
              }`}
              aria-pressed={practice.today_level === item.value}
              data-testid={`practice-detail-level-${item.value}`}
              onClick={() => logLevel(item.value)}
            >
              <span className="mx-practice-detail__level-caption">{item.caption}</span>
              <span className="mx-practice-detail__level-text">{item.text}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          className="mx-practice-detail__mark"
          data-testid="practice-detail-toggle"
          aria-pressed={done}
          onClick={toggle}
        >
          {done ? wording.markedButton : wording.markButton}
        </button>
      )}

      {sub?.type === 'edit' && (
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

      {sub?.type === 'sign' && (
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

      {/* Необязательное поле: экран-поле журнала на один шаг */}
      {sub?.type === 'field' && (
        <PracticeFieldFlow
          label={sub.field.flowLabel}
          steps={[sub.field.step]}
          initialValues={[practice[sub.field.key] || '']}
          onCancel={() => setSub(null)}
          onSubmit={values =>
            onUpdate(practice.id, { [sub.field.key]: values[0] }).then(updated => {
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
