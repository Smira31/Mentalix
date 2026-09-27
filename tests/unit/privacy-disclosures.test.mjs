import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const settings = await readFile(
  new URL('../../src/screens/Settings.jsx', import.meta.url),
  'utf8'
)
const notice = await readFile(
  new URL('../../src/screens/PrivacyNotice.jsx', import.meta.url),
  'utf8'
)
const noticeText = notice.replace(/\s+/g, ' ')

test('Settings exposes the privacy and data disclosure to Telegram and web users', () => {
  assert.equal((settings.match(/title="Политика и данные"/g) || []).length, 2)
  assert.match(settings, /setScreen\('privacy-notice'\)/)
  assert.match(settings, /<PrivacyNotice onBack=\{\(\) => setScreen\(null\)\} \/>/)
})

test('privacy notice describes retention and deletion boundaries without a false timing promise', () => {
  assert.match(noticeText, /Автоматический срок удаления сохранённых серверных данных сейчас не настроен/)
  assert.match(noticeText, /удаляет связанные пользовательские данные\s+из активной базы Mentalix/)
  assert.match(noticeText, /не обещает мгновенную очистку резервных\s+копий и журналов провайдеров/)
  assert.match(noticeText, /Markdown и CSV содержат\s+только данные чек-инов/)
  assert.match(noticeText, /но не все категории данных/)
  assert.doesNotMatch(noticeText, /со всеми твоими данными|полный экспорт|Только вы видите/)
  assert.doesNotMatch(noticeText, /удаляются автоматически через \d+/)
})

test('privacy notice distinguishes local drafts and lock from cloud backup or encryption', () => {
  assert.match(noticeText, /черновик на устройстве, а не резервная копия в облаке/)
  assert.match(noticeText, /не шифруют серверные данные/)
  assert.match(noticeText, /не заявляем сквозное шифрование/)
})

test('privacy notice does not promise unimplemented iCloud, queue or conflict handling', () => {
  assert.match(noticeText, /Mini App не использует iCloud/)
  assert.match(noticeText, /Очередь без сети, разрешение конфликтов и правило[\s\S]*побеждает последняя запись[\s\S]*не сделаны и не обещаются/)
  assert.match(noticeText, /не редактируй одну и ту же запись\s+параллельно/)
})

test('privacy notice preserves verified Telegram-only sensitive action boundary', () => {
  assert.match(noticeText, /доступны в Telegram Mini App\s+с проверенной подписью/)
  assert.match(noticeText, /Веб-вход существует/)
  assert.doesNotMatch(noticeText, /полноценного входа на сервере.*нет/)
})
