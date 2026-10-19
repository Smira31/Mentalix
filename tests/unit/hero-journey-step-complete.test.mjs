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

test('StepComplete — колонка без скролла, зазор над «Продолжить» ограничен', () => {
  // Кнопка «Продолжить» остаётся на месте (testid не менялся) и лежит в нижней группе.
  assert.match(jsxSource, /data-testid="hero-complete-map"/)
  assert.match(jsxSource, /mx-hj-step-intro__bottom mx-hj-complete__bottom/)
  assert.match(jsxSource, /cta-pill mx-hj-step-intro__cta/)
  assert.doesNotMatch(jsxSource, /К карте пути/)
  // Футер вне колонки больше не используется: кнопка внутри flex-колонки.
  assert.doesNotMatch(jsxSource, /mx-hj-complete__footer/)
  assert.match(jsxSource, /bodyClassName="mx-hj-step-complete"/)
  assert.match(cssSource, /\.mx-hj-step-complete \{[\s\S]*?flex: 1;[\s\S]*?min-height: 0;/)
  // Вступление сохраняет свою нижнюю группу; «Продолжить» прижата к низу
  // колонки (margin-top: auto), но не ближе 24 px к итогу.
  assert.match(cssSource, /\.mx-hj-step-intro__bottom \{[\s\S]*?margin-top: auto;/)
  assert.match(
    cssSource,
    /\.mx-hj-complete__bottom \{\s*margin-top: auto;\s*padding-top: var\(--mx-space-6\);/
  )
})

test('Кадр done сохраняет ширину и верхнюю линию; граница смягчена на 24 px', () => {
  assert.match(jsxSource, /frame=\{trial\.image\?\.frame\?\.done\}/)
  const introSource = jsxSource.slice(
    jsxSource.indexOf('function StepIntro('),
    jsxSource.indexOf('const HEADER_VIEW_LABELS')
  )
  assert.doesNotMatch(introSource, /frame=|mx-hj-hero--cropped/)
  // Свободная высота высоких экранов уходит в растянутый контейнер кадра
  // (grow), чтобы «Продолжить» не отрывалась от итога большим зазором.
  assert.match(
    cssSource,
    /\.mx-hj-step-complete \.mx-hj-hero--cropped\.mx-hj-hero--compact \{\s*flex: 1 1 auto;\s*aspect-ratio: var\(--mx-hj-frame-ratio\);\s*max-height: none;/
  )
  assert.match(
    cssSource,
    /\.mx-hj-step-complete \.mx-hj-hero--cropped \.mx-hj-hero__frame img \{[\s\S]*?height: auto;[\s\S]*?margin-top: var\(--mx-hj-frame-top\);[\s\S]*?animation: none;/
  )
  assert.match(
    cssSource,
    /\.mx-hj-step-complete \.mx-hj-hero__scrim \{\s*height: var\(--mx-space-6\);[\s\S]*?rgba\(5, 4, 3, 0\.35\)/
  )
})

test('У каждой из 15 иллюстраций задан отдельный кадр только для done', async () => {
  const dataSource = await readFile(
    new URL('../../src/data/heroJourney.js', import.meta.url),
    'utf8'
  )
  const frames = [
    ...dataSource.matchAll(/frame:\s*\{\s*done:\s*\{\s*top: (\d+), width: (\d+), height: (\d+)/g),
  ]
  assert.equal(frames.length, 15)
  assert.doesNotMatch(dataSource, /frame:\s*\{\s*enter:/)
  for (const [, top, width, height] of frames) {
    assert.ok(Number(top) >= 0 && Number(top) <= 197)
    assert.equal(Number(top) + Number(height), Number(width) === 780 ? 520 : 900)
  }
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

test('Вступление: длинный текст скроллится внутри блока, не под кнопкой', () => {
  // Скролл-обёртка внутри текстового блока: скрим ::before остаётся на блоке
  // (он выходит выше блока и был бы обрезан собственным overflow).
  assert.match(jsxSource, /className="mx-hj-step-intro__text">/)
  assert.match(jsxSource, /className="mx-hj-step-intro__text-scroll"/)
  assert.match(
    cssSource,
    /\.mx-hj-step-intro__text-scroll \{[\s\S]*?flex: 1;[\s\S]*?min-height: 0;[\s\S]*?overflow-y: auto;/
  )
  // Отступ снизу — под высоту кнопки «Начать шаг»: последний абзац
  // доскролливается до конца и не уходит под кнопку.
  assert.match(
    cssSource,
    /\.mx-hj-step-intro__text-scroll \{[\s\S]*?padding-bottom: calc\(var\(--cta-pill-height, 52px\) \+ var\(--mx-space-4\)\);/
  )
})

test('Завершение: блок «Твоя опора» показывает ответ из «Одно действие»', () => {
  assert.match(jsxSource, /const actionAnswer = progress\.actions\[trial\.id\] \|\| ''/)
  // Пустой ответ блок не показывает.
  assert.match(jsxSource, /\{actionAnswer && \(/)
  assert.match(jsxSource, /mx-hj-complete__support-label">Твоя опора</)
  assert.match(jsxSource, /mx-hj-complete__support-text">\{actionAnswer\}</)
  // Текст — до двух строк, дальше «…».
  assert.match(cssSource, /\.mx-hj-complete__support-text \{[\s\S]*?-webkit-line-clamp: 2;/)
})

test('Карта: закрытая глава — замок вместо счётчика, открытая — стрелка «›»', () => {
  assert.match(jsxSource, /const locked = !anyStarted && !hasCurrentStep/)
  assert.match(jsxSource, /mx-hj-chapter\$\{locked \? ' mx-hj-chapter--locked' : ''\}/)
  assert.match(jsxSource, /mx-hj-chapter__lock/)
  assert.match(jsxSource, /mx-hj-chapter__chevron/)
  // Закрытая глава серым: заголовок и римская цифра.
  assert.match(
    cssSource,
    /\.mx-hj-chapter--locked \.mx-hj-chapter__roman \{[\s\S]*?color: rgb\(var\(--c-muted\)\);/
  )
})

test('«Продолжить» на завершении: текст и отдельная стрелка «›», зазор 8 px', () => {
  assert.match(jsxSource, /cta-pill mx-hj-step-intro__cta mx-hj-complete__cta/)
  assert.match(jsxSource, /<span>Продолжить<\/span>/)
  assert.match(jsxSource, /<ChevronRight size=\{16\} aria-hidden="true" \/>/)
  assert.match(cssSource, /\.mx-hj-complete__cta \{\s*gap: 8px;\s*\}/)
})
