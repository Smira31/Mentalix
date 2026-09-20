import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  DARK_ACCENT_COLORS,
  DEFAULT_ACCENT,
  LIGHT_ACCENT_COLORS,
  LIGHT_DEFAULT_ACCENT,
  getAccentColors,
  parseAccent,
} from '../../src/lib/accentColor.js'

const css = await readFile(new URL('../../src/index.css', import.meta.url), 'utf8')


test('temporary accent palette keeps the existing defaults and adds comparison options', () => {
  assert.equal(DEFAULT_ACCENT, 'ice')
  assert.equal(LIGHT_DEFAULT_ACCENT, 'sage')
  assert.deepEqual(Object.keys(DARK_ACCENT_COLORS), ['ice', 'azure'])
  assert.deepEqual(Object.keys(LIGHT_ACCENT_COLORS), ['sage', 'graphite', 'mint'])
  assert.equal(DARK_ACCENT_COLORS.ice.hex, '#C8C8C8')
  assert.equal(DARK_ACCENT_COLORS.azure.hex, '#6FB7E0')
  assert.equal(LIGHT_ACCENT_COLORS.sage.hex, '#484848')
  assert.equal(LIGHT_ACCENT_COLORS.graphite.hex, '#1F1F1F')
  assert.equal(LIGHT_ACCENT_COLORS.mint.hex, '#96CDB0')
})

test('accent parsing is theme-aware and rejects an option from the other theme', () => {
  assert.equal(getAccentColors('dark'), DARK_ACCENT_COLORS)
  assert.equal(getAccentColors('light'), LIGHT_ACCENT_COLORS)
  assert.equal(parseAccent('azure', 'dark'), 'azure')
  assert.equal(parseAccent('mint', 'light'), 'mint')
  assert.equal(parseAccent('mint', 'dark'), DEFAULT_ACCENT)
  assert.equal(parseAccent('azure', 'light'), LIGHT_DEFAULT_ACCENT)
  assert.equal(parseAccent('unknown', 'dark'), DEFAULT_ACCENT)
  assert.equal(parseAccent('unknown', 'light'), LIGHT_DEFAULT_ACCENT)
})

test('CSS exposes the theme-specific overrides for every temporary option', () => {
  assert.match(css, /\[data-accent='azure'\][\s\S]*--c-gold:\s*111\s+183\s+224/)
  assert.match(css, /\[data-theme='light'\]\[data-accent='sage'\][\s\S]*--c-gold:\s*72\s+72\s+72/)
  assert.match(css, /\[data-theme='light'\]\[data-accent='graphite'\][\s\S]*--c-gold:\s*31\s+31\s+31/)
  assert.match(css, /\[data-theme='light'\]\[data-accent='mint'\][\s\S]*--c-gold:\s*150\s+205\s+176/)
  assert.match(css, /\[data-theme='light'\]\[data-accent='terracotta'\]/)
})
