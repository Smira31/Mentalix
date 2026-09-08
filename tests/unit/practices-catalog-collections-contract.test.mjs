import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../../src/components/PracticeCatalogV2.jsx', import.meta.url),
  'utf8'
)

test('MXL-PRACTICES-CATALOG-POLISH-001 (G3): live-ритуалы/аскезы открываются, а не disabled', () => {
  assert.match(source, /const openSource = \(\) => onOpenPractice\(\{ key: source, sub: source \}, collection\.key\)/)
  assert.doesNotMatch(source, /disabled=\{!practice\}/)
  assert.match(source, /isLive \? openSource\(\) : practice && onOpenPractice\(practice, collection\.key\)/)
})

test('MXL-PRACTICES-CATALOG-POLISH-001 (G3): пустое состояние ритуалов/аскез имеет CTA', () => {
  assert.match(source, /Здесь появятся твои ритуалы\./)
  assert.match(source, /Здесь появятся твои аскезы\./)
  assert.match(source, /Открыть ритуалы/)
  assert.match(source, /Открыть аскезы/)
})

test('MXL-PRACTICES-CATALOG-POLISH-001 (G4): rail-карточки показывают мини-счётчик completion', () => {
  assert.match(source, /practice\.progress && /)
  assert.match(source, /practice\.key === 'rituals' \? 'выполнено' : 'удержано'/)
})
