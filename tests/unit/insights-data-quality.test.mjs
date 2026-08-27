import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { sanitizeCheckins, sanitizeTrendsData } from '../../src/lib/trendsDataSanitizer.js'

const analyticsSource = await readFile(new URL('../../src/screens/Analytics.jsx', import.meta.url), 'utf8')


test('sanitizeCheckins исключает malformed даты и удерживает одну последнюю валидную запись на дату', () => {
  const checkins = sanitizeCheckins([
    { date: 'not-a-date', mood: 5, energy: 5 },
    { date: '2026-08-26', mood: 3, energy: 4, emotion: ' спокойно ' },
    { date: '2026-08-26', mood: 4, energy: 9, emotion: 'ясно' },
    { date: '2026-08-27', mood: 8, energy: 2, anxiety: 0, focus: 5 },
  ])

  assert.deepEqual(checkins, [
    { date: '2026-08-26', mood: 4, energy: null, anxiety: null, focus: null, emotion: 'ясно', review_completed_at: null },
    { date: '2026-08-27', mood: null, energy: 2, anxiety: null, focus: 5, emotion: null, review_completed_at: null },
  ])
})

test('Analytics UI использует единые периоды, раскрывает evidence dates и не считает неполные группы достаточной выборкой', () => {
  assert.match(analyticsSource, /ANALYTICS_PERIODS\.map/)
  assert.match(analyticsSource, /Даты в основе наблюдения/)
  assert.match(analyticsSource, /sourceDates\.map\(formatSourceDate\)/)
  assert.match(analyticsSource, /withValues\.length < MIN_GROUP/)
  assert.match(analyticsSource, /withoutValues\.length < MIN_GROUP/)
  assert.match(analyticsSource, /не диагнозы и не доказанные причины/)
})

test('sanitizeTrendsData сохраняет только bounded metrics и evidence с валидными уникальными датами', () => {
  const data = sanitizeTrendsData({
    analytics: {
      period_days: 365,
      rituals: [{ id: 1, name: '  Утро  ', completion_rate: 140 }, { id: null, name: 'Без id', completion_rate: 10 }],
      ascezas: [{ id: 2, name: 'Пауза', clean_rate: -4, held_days: 120, breaks: 2.6, streak: 91 }],
      daily_activity: [
        { date: '2026-08-27', count: -2, breaks: 1, held_ascezas: 2 },
        { date: '2026-08-27', count: 5, breaks: 0, held_ascezas: 0 },
        { date: 'bad', count: 99 },
      ],
      observations: [
        { kind: 'ritual_rate', text: '  Есть отметки. ', sampleSize: 2.4, sourceDates: ['2026-08-27', 'bad', '2026-08-27', '2026-08-25'], caveat: '  Только описание. ' },
        { text: '' },
      ],
    },
    checkins: [],
  })

  assert.equal(data.analytics.period_days, 14)
  assert.deepEqual(data.analytics.rituals, [{ id: 1, name: 'Утро', completion_rate: 100 }])
  assert.deepEqual(data.analytics.ascezas, [{ id: 2, name: 'Пауза', category: null, streak: 90, clean_rate: 0, held_days: 90, breaks: 3 }])
  assert.deepEqual(data.analytics.daily_activity, [{ date: '2026-08-27', count: 5, breaks: 0, held_ascezas: 0 }])
  assert.deepEqual(data.analytics.observations, [{
    kind: 'ritual_rate',
    text: 'Есть отметки.',
    sampleSize: 2,
    sourceDates: ['2026-08-25', '2026-08-27'],
    caveat: 'Только описание.',
  }])
})
