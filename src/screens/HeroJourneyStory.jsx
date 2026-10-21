import { useCallback, useRef } from 'react'

import MarkdownText from '../components/MarkdownText'
import HeroJourneySheet from '../components/HeroJourneySheet'
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
 * Сегментного прогресса по листам нет (задача владельца): верх экрана отдан
 * кадру шага, счёт листов ведут «Назад» и сама кнопка «›».
 *
 * Индекс открытого листа живёт в шаге (HeroJourneyMap): «Назад» из шапки и
 * системный BackButton Telegram с листов 2+ ведут на предыдущий лист, с листа
 * 1 — на карту; тапы и свайпы листают внутри компонента, как раньше.
 *
 * Разметку сцены держит общий компонент HeroJourneySheet — тот же, что рисует
 * вступление шага без листов: мысль листа (последний абзац, целиком жирный)
 * стоит сразу под текстом вместе с ним, кнопка «вперёд» одна на оба экрана.
 */
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
    <HeroJourneySheet
      illustration={index === 0 ? illustration : null}
      viewportTestId="hero-story-viewport"
      sheetTestId="hero-story-page"
      page={index + 1}
      label={
        page.label && <div className="mx-hj-eyebrow mx-hj-story__label">{page.label}</div>
      }
      /* key — проявление листа при смене: сдвига и карусели нет. */
      body={
        body && (
          <MarkdownText key={index} content={body} className="mx-hj-story__text" />
        )
      }
      thought={thought}
      gestures={{
        onClick: handleTap,
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
      }}
      action={{ testId: 'hero-story-next', label: 'Дальше', onClick: forward }}
    />
  )
}
