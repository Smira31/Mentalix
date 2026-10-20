import { useCallback, useRef } from 'react'

import MarkdownText from '../components/MarkdownText'
import RoundSubmitButton from '../components/RoundSubmitButton'
import { platform } from '../platform'
import { isHorizontalSwipe } from '../lib/gestures/swipeThresholds'

import './HeroJourneyStory.css'

/* Горизонтальный жест короче порога — это тап, а не свайп. */
const SWIPE_MIN_DISTANCE = 40
/* Тап левее трети ширины — назад, правее половины — вперёд; полоса между ними
   намеренно молчит, чтобы промах у краёв зон ничего не переключал. */
const BACK_ZONE_RATIO = 1 / 3
const FORWARD_ZONE_RATIO = 0.5
/* Click после свайпа гасим по времени: браузер шлёт его тем же касанием. */
const SWIPE_CLICK_GUARD_MS = 400

/*
 * Вводка шага листами, как в сторис (необязательное поле шага pages, 3–5
 * листов { label, text }). Лист 1 идёт с иллюстрацией шага, остальные — только
 * текст: та же типографика, что в читалке статей Библиотеки. Переходы: тап по
 * правой половине и свайп влево — вперёд, тап по левой трети и свайп вправо —
 * назад, внизу белая круглая кнопка «›» — вперёд. Автопереключения по таймеру
 * нет; после последнего листа открывается «Запиши» (onForward).
 *
 * Индекс открытого листа живёт в шаге (HeroJourneyMap): «Назад» из шапки и
 * системный BackButton Telegram с листов 2+ ведут на предыдущий лист, с листа
 * 1 — на карту; тапы и свайпы листают внутри компонента, как раньше.
 *
 * Мысль листа: последний абзац текста, целиком жирный (**…**), рендерится
 * отдельно — крупно, прижат к низу листа над кнопкой «›»
 * (.mx-hj-story__thought в CSS).
 *
 * Компонент рисует только части колонки `.mx-hj-step-intro` (полоска, сцена
 * листа, нижняя группа): оболочку <Screen> и flex-колонку держит шаг.
 */

/* Последний абзац, целиком жирный (**…**), — «мысль листа»: показывается
   отдельно, крупно внизу листа; остальной текст — как обычные абзацы. */
function splitSheetThought(text) {
  const parts = String(text).split(/\n\n+/)
  const last = parts[parts.length - 1].trim()
  const bold = last.match(/^\*\*([\s\S]+)\*\*$/)
  if (!bold) return { body: text, thought: null }
  return { body: parts.slice(0, -1).join('\n\n'), thought: bold[1].trim() }
}

export default function HeroJourneyStory({
  pages,
  illustration = null,
  onForward,
  onBack,
  index,
  onIndexChange,
}) {
  const touchStart = useRef(null)
  const swipeAt = useRef(0)

  const page = pages[index]
  const isLast = index === pages.length - 1
  const { body, thought } = splitSheetThought(page.text)

  const forward = useCallback(() => {
    if (isLast) {
      onForward()
      return
    }
    platform.haptic('light')
    onIndexChange(index + 1)
  }, [isLast, onForward, index, onIndexChange])

  const back = useCallback(() => {
    if (index === 0) {
      onBack()
      return
    }
    platform.haptic('light')
    onIndexChange(index - 1)
  }, [index, onBack, onIndexChange])

  function handleTap(event) {
    if (Date.now() - swipeAt.current < SWIPE_CLICK_GUARD_MS) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    if (ratio <= BACK_ZONE_RATIO) {
      back()
      return
    }
    if (ratio >= FORWARD_ZONE_RATIO) forward()
  }

  function handleTouchStart(event) {
    const touch = event.changedTouches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(event) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    /* Вертикальное движение не трогаем: так текст листа прокручивается. */
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || !isHorizontalSwipe(dx, dy)) return
    swipeAt.current = Date.now()
    if (dx < 0) forward()
    else back()
  }

  return (
    <>
      {/* Полоска прогресса по числу листов, как в сторис: пройденные и текущий
          лист — акцентом, остальные — фоновым цветом. */}
      <div className="mx-hj-story__progress" data-testid="hero-story-progress" aria-hidden="true">
        {pages.map((item, i) => (
          <span key={item.label || i} className={`mx-hj-segment ${i <= index ? 'is-done' : ''}`} />
        ))}
      </div>

      {/* Сцена листа: тап-зоны считаются по её ширине (обработчик на элементе,
          а не на документе — так жест не конфликтует с Telegram). */}
      <div
        className="mx-hj-story__viewport"
        data-testid="hero-story-viewport"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {index === 0 && illustration}

        <div className="mx-hj-step-intro__text mx-protected-text">
          <div className="mx-hj-step-intro__text-scroll">
            <div
              key={index}
              className="mx-hj-story__sheet"
              data-testid="hero-story-page"
              data-page={index + 1}
            >
              {page.label && <div className="mx-hj-eyebrow mx-hj-story__label">{page.label}</div>}
              {body && <MarkdownText content={body} className="mx-hj-story__text" />}
            </div>
          </div>
        </div>

        {/* Мысль листа — последний жирный абзац: крупно, прижата к низу
            сцены над кнопкой «›». */}
        {thought && (
          <p key={index} data-testid="hero-story-thought" className="mx-hj-story__thought mx-protected-text">
            {thought}
          </p>
        )}
      </div>

      <div className="mx-hj-story__bottom">
        <RoundSubmitButton
          testId="hero-story-next"
          label="Дальше"
          icon="chevron"
          onClick={forward}
        />
      </div>
    </>
  )
}
