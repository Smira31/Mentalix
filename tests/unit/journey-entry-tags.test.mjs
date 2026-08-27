import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const apiSource = await readFile(new URL('../../src/lib/api.js', import.meta.url), 'utf8')
const journeySource = await readFile(
  new URL('../../src/screens/JourneySearch.jsx', import.meta.url),
  'utf8'
)

test('Journey API сохраняет owner id и дату entry при замене tags', () => {
  assert.match(apiSource, /replaceTags: \(userId, date, tagIds\)/)
  assert.match(apiSource, /\/journey\/entries\/\$\{date\}\/tags/)
  assert.match(apiSource, /user_id: userId, tag_ids: tagIds/)
})

test('Journey search передаёт видимые emotion и date range filters при автоматическом поиске', () => {
  assert.match(journeySource, /emotion: emotion \|\| undefined/)
  assert.match(journeySource, /from_date: fromDate \|\| undefined/)
  assert.match(journeySource, /to_date: toDate \|\| undefined/)
})

test('Journey закрывает private API для legacy web-ID до server-side sessions', () => {
  assert.match(
    journeySource,
    /const canUsePrivateJourney = platformName === 'telegram' && Number\(user\?\.id\) > 0/
  )
  assert.match(journeySource, /if \(!canUsePrivateJourney\) return undefined/)
  assert.match(
    journeySource,
    /Личные записи и теги доступны в Telegram Mini App с проверенной подписью\./
  )
  assert.match(journeySource, /пока для неё не появятся server-side\s+sessions\./)
})

test('Journey предоставляет доступный inline editor tags без смены основной навигации', () => {
  assert.match(journeySource, /Изменить теги/)
  assert.match(journeySource, /Теги для записи \$\{entry\.date\}/)
  assert.match(journeySource, /Выбери до 8 личных тегов/)
  assert.match(journeySource, /aria-pressed=\{selected\}/)
  assert.match(journeySource, /api\.journey\.replaceTags\(user\.id, entry\.date, entryTagIds\)/)
  assert.match(journeySource, /Запись не была изменена/)
})
