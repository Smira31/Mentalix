import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const jsxSource = await readFile(
  new URL('../../src/screens/HeroJourneyMap.jsx', import.meta.url),
  'utf8'
)
const cssSource = await readFile(
  new URL('../../src/screens/HeroJourneyMap.css', import.meta.url),
  'utf8'
)

test('StepComplete — колонка без скролла, кнопка «Продолжить» прижата к низу', () => {
  // Кнопка «Продолжить» остаётся на месте (testid не менялся) и лежит в нижней группе.
  assert.match(jsxSource, /data-testid="hero-complete-map"/)
  assert.match(jsxSource, /mx-hj-step-intro__bottom mx-hj-complete__bottom/)
  assert.match(jsxSource, /cta-pill mx-hj-step-intro__cta/)
  assert.doesNotMatch(jsxSource, /К карте пути/)
  // Футер вне колонки больше не используется: кнопка внутри flex-колонки.
  assert.doesNotMatch(jsxSource, /mx-hj-complete__footer/)
  assert.match(jsxSource, /bodyClassName="mx-hj-step-complete"/)
  assert.match(cssSource, /\.mx-hj-step-complete \{[\s\S]*?flex: 1;[\s\S]*?min-height: 0;/)
  // Нижняя группа прижата к низу (margin-top: auto).
  assert.match(cssSource, /\.mx-hj-step-intro__bottom \{[\s\S]*?margin-top: auto;/)
})

test('Гибкий герой на завершении: 110–300 px, градиент под кнопками Telegram', () => {
  assert.match(
    cssSource,
    /\.mx-hj-step-complete \.mx-hj-hero--flex \{[\s\S]*?min-height: 110px;[\s\S]*?max-height: 300px;/
  )
  assert.match(
    cssSource,
    /\.mx-hj-step-complete \.mx-hj-hero__scrim \{[\s\S]*?height: 80px;[\s\S]*?rgba\(5, 4, 3, 0\.85\)/
  )
})

test('Запиши/Одно действие: одна круглая кнопка ×/›, крестика в шапке нет', () => {
  // Крестик в правом верхнем углу удалён вместе со стилями.
  assert.doesNotMatch(jsxSource, /mx-hj-step-close/)
  assert.doesNotMatch(jsxSource, /hero-step-close/)
  assert.doesNotMatch(cssSource, /mx-hj-step-close/)
  // Кнопка: пустое поле — крестик «×» (закрывает), после ввода — шеврон «›».
  assert.match(jsxSource, /submitIcon=\{hasText \? 'chevron' : 'x'\}/)
  assert.match(jsxSource, /submitLabel=\{hasText \? 'Дальше' : 'Закрыть'\}/)
  assert.doesNotMatch(jsxSource, /Пропустить/)
})

test('Пролог: оговорки и строки про космонавта нет ни в данных, ни в JSX', () => {
  assert.doesNotMatch(jsxSource, /mx-hj-about__note/)
  assert.doesNotMatch(cssSource, /mx-hj-about__note/)
  assert.doesNotMatch(jsxSource, /hero-about-note/)
  assert.doesNotMatch(jsxSource, /prologue\.note/)
})

test('Текст завершения: итог не жирный, ~90% белого; тизер 14 px, ~70% белого', () => {
  assert.match(
    cssSource,
    /\.mx-hj-complete__phrase \{[\s\S]*?font-size: max\(14px[\s\S]*?font-weight: 400;[\s\S]*?color: rgb\(var\(--c-text\) \/ 0\.9\);/
  )
  assert.match(
    cssSource,
    /\.mx-hj-complete__teaser \{[\s\S]*?font-size: 14px;[\s\S]*?color: rgb\(var\(--c-text\) \/ 0\.7\);/
  )
})

test('карточка главы на экране завершения во всю ширину контента', () => {
  // карточка имеет width: 100%
  assert.match(cssSource, /\.mx-hj-complete__chapter-card[\s\S]*?width:\s*100%/)
  // сегменты растянуты на всю ширину карточки
  assert.match(cssSource, /\.mx-hj-complete__chapter-segs[\s\S]*?width:\s*100%/)
  // подпись по центру
  assert.match(cssSource, /\.mx-hj-complete__chapter-card[\s\S]*?text-align:\s*center/)
})

test('Длительность шага убрана со вступления и карточки «Следующий шаг»', () => {
  assert.doesNotMatch(jsxSource, /≈ 6 мин/)
  assert.doesNotMatch(jsxSource, /mx-hj-step-intro__flow/)
  assert.doesNotMatch(jsxSource, /next-card__meta/)
  assert.doesNotMatch(cssSource, /__flow|next-card__meta/)
})
