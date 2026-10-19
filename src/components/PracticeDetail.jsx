import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { platform } from '../platform'
import { useEdgeSwipeBack } from '../lib/gestures/useEdgeSwipeBack'
import { useBackButton } from '../platform/telegram.hooks'
import { RoundBackButton } from './NestedScreenHeader'
import DeleteConfirmationDialog from './DeleteConfirmationDialog'
import PracticeIcon from './PracticeIcon'
import { semanticKindForAsceza, semanticKindForRitual } from './SemanticGlyph'
import { isRitualDoneToday } from '../lib/practiceDoneToday'
import {
  PRACTICE_WORDING,
  RESTORE_LINK_LABEL,
  buildEditPatch,
  canRestoreYesterday,
} from '../lib/practiceWording'
import PracticeFieldFlow from './practices/PracticeFieldFlow'
import PracticeSignScreen from './practices/PracticeSignScreen'
import PracticeWeek from './practices/PracticeWeek'
import './PracticeDetail.css'

function AccordionRow({ testId, label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
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

/*
 * Необязательная строка «+ …»: тап открывает экран-поле журнала
 * (PracticeFieldFlow) и сохраняет значение в практику.
 */
function OptionalFieldRow({ field, value, onOpen }) {
  return (
    <button
      type="button"
      className={`mx-practice-detail__field${value ? ' is-set' : ''}`}
      data-testid={`practice-detail-field-${field.key}`}
      onClick={onOpen}
    >
      <span className="mx-practice-detail__field-label">
        {value ? field.label : `+ ${field.label}`}
      </span>
      {value && <span className="mx-practice-detail__field-value">{value}</span>}
    </button>
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
  systemBack = true,
}) {
  const screenRef = useRef(null)
  const [confirming, setConfirming] = useState(false)
  const [sub, setSub] = useState(null)
  const [pulse, setPulse] = useState(false)
  const pulseTimer = useRef(null)
  useEdgeSwipeBack(screenRef, onBack)
  // «Назад» с вложенных экранов карточки (поле, знак, правка) возвращает
  // в карточку, а не в список: пока открыт sub или диалог — закрываем его.
  useBackButton(() => {
    if (sub) {
      setSub(null)
    } else if (confirming) {
      setConfirming(false)
    } else {
      onBack()
    }
  }, true)

  useEffect(() => () => clearTimeout(pulseTimer.current), [])
  const isRitual = kind === 'ritual'
  const wording = PRACTICE_WORDING[kind]
  const done = isRitual ? isRitualDoneToday(practice.today_level) : practice.today_status === 'held'
  // Ритуал с двумя ступенями отмечается уровнем (минимум / оптимум);
  // у остальных практик остаётся одна кнопка отметки.
  const hasLevels = isRitual && Boolean(practice.min_version && practice.optimal_version)
  // Знак выбирается и хранится вместе с практикой; без него — по названию.
  const glyphKind =
    practice.glyph ||
    (isRitual ? semanticKindForRitual(practice.name) : semanticKindForAsceza(practice))
  // У аскезы «Зачем» — только смысл (goal); граница (reason) живёт в «Как».
  // fallback на reason у аскезы дублировал бы текст «Граница».
  const why = isRitual ? (practice.goal || practice.reason) : practice.goal
  // «Как» — минимум у ритуала и граница у аскезы (practice.reason).
  // Оптимум и триггер с заменой живут необязательными строками «+ …».
  const howContent = isRitual ? practice.min_version : practice.reason
  const howLabel =
    wording.cardMinimumLabel.charAt(0).toUpperCase() + wording.cardMinimumLabel.slice(1)
  const optionalFields = wording.optionalFields || []
  // «Оптимум» — часть карточки «Как» (рядом с минимумом), а не строка «Зачем».
  const optimalField = optionalFields.find(field => field.key === 'optimal_version')
  const hasHow = Boolean(howContent) || Boolean(optimalField)
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
      <RoundBackButton onClick={onBack} className="mx-practice-detail__back" />

      {/* Блок-герой 220: концентрические круги + иконка в круге 96 */}
      <div
        className={`mx-practice-detail__hero${done ? ' is-done' : ''}${pulse ? ' is-pulsing' : ''}`}
      >
        <span className="mx-practice-detail__hero-ring" />
        <span className="mx-practice-detail__hero-ring" />
        <span className="mx-practice-detail__hero-ring" />
        <span className="mx-practice-detail__hero-icon">
          <PracticeIcon glyph={glyphKind} className="w-full h-full" />
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
        <AccordionRow testId="practice-accordion-why" label="Зачем" defaultOpen>
          {why && <p>{why}</p>}
        </AccordionRow>

        {optionalFields
          .filter(field => field !== optimalField)
          .map(field => (
            <OptionalFieldRow
              key={field.key}
              field={field}
              value={practice[field.key]}
              onOpen={() => {
                platform.haptic('light')
                setSub({ type: 'field', field })
              }}
            />
          ))}

        {hasHow && (
          <AccordionRow testId="practice-accordion-how" label={howLabel}>
            {howContent && <p className="whitespace-pre-line">{howContent}</p>}
            {optimalField && (
              <OptionalFieldRow
                field={optimalField}
                value={practice[optimalField.key]}
                onOpen={() => {
                  platform.haptic('light')
                  setSub({ type: 'field', field: optimalField })
                }}
              />
            )}
          </AccordionRow>
        )}
        <AccordionRow testId="practice-accordion-note" label="Заметка">
          {note && <p>{note}</p>}
        </AccordionRow>

        {wording.guide && (
          <AccordionRow testId="practice-accordion-guide" label="Как это работает">
            <p className="mx-practice-detail__guide-line">
              <strong>Срок</strong> — {wording.guide.duration}.
            </p>
            <p className="mx-practice-detail__guide-line">
              <strong>Отметка</strong> — {wording.guide.markDay}.
            </p>
            <p className="mx-practice-detail__guide-line">
              <strong>Пропуск</strong> — {wording.guide.missed}.
            </p>
            <p className="mx-practice-detail__guide-line">
              <strong>Остановка</strong> — {wording.guide.stop}.
            </p>
          </AccordionRow>
        )}
      </div>

      {/* ЭТА НЕДЕЛЯ: неделя кружками и правило про один пропуск */}
      <section className="mx-practice-detail__week" data-testid="practice-detail-week">
        <p className="mx-practice-detail__week-title">Эта неделя</p>
        <PracticeWeek streak={practice.streak || 0} />
        <p className="mx-practice-detail__week-hint">1 пропуск в неделю не прерывает серию</p>
      </section>

      {/* Тихие ссылки одной строкой под неделей */}
      <div className="mx-practice-detail__quiet-links">
        {canRestore && (
          <button
            type="button"
            className="mx-practice-detail__quiet-link"
            data-testid="practice-restore-yesterday"
            onClick={() => {
              platform.haptic('light')
              onRestore?.(practice)
            }}
          >
            {RESTORE_LINK_LABEL}
          </button>
        )}
        {!isRitual && (
          <button
            type="button"
            className="mx-practice-detail__quiet-link"
            data-testid="practice-break-link"
            onClick={() => onBreak(practice)}
          >
            Не получилось сегодня
          </button>
        )}
      </div>

      {/* Тихие действия: Изменить · Знак · Удалить */}
      <div className="mx-practice-detail__actions">
        <button
          type="button"
          className="mx-practice-detail__action"
          data-testid="practice-detail-edit"
          onClick={() => setSub({ type: 'edit' })}
        >
          Изменить
        </button>
        <span className="mx-practice-detail__actions-sep" aria-hidden="true">·</span>
        <button
          type="button"
          className="mx-practice-detail__action"
          data-testid="practice-detail-sign"
          onClick={() => setSub({ type: 'sign' })}
        >
          Знак
        </button>
        <span className="mx-practice-detail__actions-sep" aria-hidden="true">·</span>
        <button
          type="button"
          className="mx-practice-detail__action mx-practice-detail__action--danger"
          data-testid="practice-detail-delete"
          onClick={() => setConfirming(true)}
        >
          Удалить
        </button>
      </div>

      {/* Кнопка отметки закреплена внизу, над нижним меню — видна всегда */}
      <div className="mx-practice-detail__fixed">
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
      </div>

      {sub?.type === 'edit' && (
        <PracticeFieldFlow
          label={wording.editLabel}
          steps={wording.ownSteps}
          initialValues={[practice.name, wording.minimumValue(practice)]}
          onCancel={() => setSub(null)}
          systemBack={systemBack}
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
          systemBack={systemBack}
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
          systemBack={systemBack}
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
