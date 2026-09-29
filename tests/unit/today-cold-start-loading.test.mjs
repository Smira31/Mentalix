import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const todaySource = await readFile(new URL('../../src/screens/Today.jsx', import.meta.url), 'utf8')

test('Today: loading=true на холодном старте без снимка (не пустой экран без обратной связи)', () => {
  // loading должен быть true когда нет снимка и нет previewFixture.
  // Это гарантирует скелетон («Загрузка…») вместо пустого экрана
  // пока Render free tier просыпается (~50 с).
  assert.match(
    todaySource,
    /const \[loading, setLoading\] = useState\(\s*\(\) => !previewFixture && \(initialSub === 'contextualCheckin' \|\| !initialTodaySnapshot\)/
  )
})

test('Today: connecting-состояние для «Подключаемся…» после скелетона', () => {
  assert.match(todaySource, /const \[connecting, setConnecting\] = useState\(false\)/)
})

test('Today: скелетон сменяется на «Подключаемся…» через 2 с, не вечная загрузка', () => {
  // Таймер 2 с переводит loading → false, connecting → true.
  // Не применяется при наличии снимка (данные уже есть) и для
  // contextualCheckin (нужен checkin до выбора режима).
  assert.match(todaySource, /setTimeout\(\(\) => \{[\s\S]*setLoading\(false\)[\s\S]*setConnecting\(true\)[\s\S]*\}, 2000\)/)
})

test('Today: connecting сбрасывается при завершении загрузки (успех или ошибка)', () => {
  assert.match(
    todaySource,
    /} finally \{[\s\S]*if \(active\) \{[\s\S]*setLoading\(false\)[\s\S]*setConnecting\(false\)[\s\S]*\}/
  )
})

test('Today: retry сбрасывает connecting', () => {
  assert.match(
    todaySource,
    /function retryTodayData\(\)[\s\S]*setConnecting\(false\)/
  )
})

test('Today: «Подключаемся…» показывается в основном контенте при connecting', () => {
  assert.match(todaySource, /data-testid="today-connecting"/)
  assert.match(todaySource, /Подключаемся…/)
})

test('Today: connecting не блокирует рендер — показывается внутри экрана «Сегодня»', () => {
  // Индикатор — отдельный <p> в основном return, а не замена всего экрана.
  // Экран «Сегодня» (день, карточки, тема) остаётся видимым.
  const connectingBlock = todaySource.match(
    /\{connecting && \([\s\S]*?data-testid="today-connecting"[\s\S]*?Подключаемся…[\s\S]*?\)\}/
  )
  assert.ok(connectingBlock, 'connecting-индикатор должен быть в основном return')
  // Не должен быть в блоке if (loading) или if (loadError)
  const loadingBlock = todaySource.match(/if \(loading\) \{[\s\S]*?return \(/)
  assert.ok(loadingBlock)
  assert.ok(
    !loadingBlock[0].includes('today-connecting'),
    '«Подключаемся…» не должен быть в блоке loading (это другой экран)'
  )
})
