import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../../src/screens/SeriesBadges.jsx', import.meta.url), 'utf8')

test('SeriesBadges uses the shared BackButton for returning to Today', () => {
  assert.match(source, /import BackButton from ['"]\.\.\/components\/BackButton['"]/)
  assert.match(source, /<BackButton onClick=\{onBack\} label="Сегодня" \/>/)
  assert.doesNotMatch(source, /from ['"]lucide-react['"][^\n]*\bX\b/)
  assert.doesNotMatch(source, /className="mx-path-close"/)
})
