import { useLayoutEffect, useRef, useState } from 'react'
import { platform } from '../platform'
import { Face, EMOTIONS } from '../screens/CheckIn'

const HEAVY_EMOTIONS = ['тревожно', 'подавлен', 'страшно']

const LEVELS = [1, 2, 3, 4, 5]

/*
 * Эмоция хранится строкой. Одиночный выбор — одно слово («тревожно»),
 * множественный — выбранные через запятую («тревожно, вымотан»).
 * Хелперы ниже работают с обоими форматами; одиночный выбор даёт ту же
 * строку, что и раньше.
 */
function parseEmotionList(emotion) {
  if (!emotion || typeof emotion !== 'string') return []
  return emotion
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function toggleEmotion(emotion, item) {
  const list = parseEmotionList(emotion)
  const index = list.indexOf(item)
  if (index >= 0) {
    list.splice(index, 1)
  } else {
    list.push(item)
  }
  return list.length ? list.join(', ') : null
}

/**
 * Шаг «Эмоции» — §5.2 блок 4.
 * Вертикальный столбец pill по уровням mood, горизонтальный свайп со snap.
 * Общий компонент для чек-ина (CheckIn.jsx) и практики «Настроение» (MoodPractice.jsx).
 *
 * variant="grid" — вечерний «Разбор дня»: сетка 2 колонки, 10 плиток,
 * без смайлика над вопросом. Набор эмоций определяется initialLevel.
 */
export default function EmotionStep({
  initialLevel = 3,
  emotion,
  onEmotionChange,
  onHeavyEmotionClick,
  testId = 'checkin-emotion-pill',
  variant = 'carousel',
  emotions,
}) {
  const emotionSet = emotions || EMOTIONS

  // ── Grid-вариант (вечерний разбор) ──
  // Множественный выбор (как Stoic): тап по плитке добавляет/снимает её;
  // выбранные эмоции хранятся в строке через запятую («тревожно, вымотан»).
  if (variant === 'grid') {
    const items = emotionSet[initialLevel] || emotionSet[3] || []
    const selectedList = parseEmotionList(emotion)

    return (
      <div className="mx-emotion-grid" role="group" aria-label="Что ближе всего к тому, что ты чувствуешь?">
        {items.map(item => {
          const selected = selectedList.includes(item)

          return (
            <button
              key={item}
              type="button"
              data-testid={testId}
              data-emotion={item}
              aria-pressed={selected}
              onClick={() => {
                platform.haptic('light')
                onEmotionChange(toggleEmotion(emotion, item))
              }}
              className={`mx-emotion-grid__tile ${selected ? 'is-selected' : ''}`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          )
        })}
      </div>
    )
  }

  // ── Carousel-вариант (утро, практика «Настроение») ──
  const [activeLevel, setActiveLevel] = useState(initialLevel)
  const scrollRef = useRef(null)
  const rafRef = useRef(null)

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const column = container.children[initialLevel - 1]
    if (column) {
      const target = column.offsetLeft + column.offsetWidth / 2 - container.clientWidth / 2
      container.scrollLeft = Math.max(0, target)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleScroll() {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const container = scrollRef.current
      if (!container) return
      const center = container.scrollLeft + container.clientWidth / 2
      let closest = 0
      let minDist = Infinity
      Array.from(container.children).forEach((child, i) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2
        const dist = Math.abs(childCenter - center)
        if (dist < minDist) {
          minDist = dist
          closest = i
        }
      })
      const newLevel = closest + 1
      setActiveLevel(prev => (prev !== newLevel ? newLevel : prev))
    })
  }

  return (
    <div className="mx-emotion-step">
      <div className="mx-emotion-step__face">
        <Face level={activeLevel} size={30} showFrame active={false} />
      </div>

      <div
        className="mx-emotion-carousel"
        ref={scrollRef}
        onScroll={handleScroll}
        aria-label="Уровни настроения"
      >
        {LEVELS.map(level => (
          <div
            key={level}
            className={`mx-emotion-column ${activeLevel === level ? 'is-active' : 'is-adjacent'}`}
            data-level={level}
          >
            {(emotionSet[level] || []).map(item => (
              <button
                key={item}
                type="button"
                data-testid={testId}
                data-emotion={item}
                onClick={() => {
                  platform.haptic('light')
                  onEmotionChange(emotion === item ? null : item)
                }}
                className={`mx-emotion-pill ${emotion === item ? 'is-selected' : ''}`}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        ))}
      </div>

      {HEAVY_EMOTIONS.includes(emotion) && onHeavyEmotionClick ? (
        <button type="button" onClick={onHeavyEmotionClick} className="mx-emotion-heavy">
          Поговорить об этом с Собеседником →
        </button>
      ) : null}
    </div>
  )
}
