import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { heroProgressKey, heroDraftKey, parseProgress } from '../../src/lib/heroJourneyState.js'
import { libraryTopic } from '../../src/data/libraryTopics.js'

const source = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

test('Ключи Пути героя неизменны; новые курсы и пользователи изолированы', () => {
  assert.equal(heroProgressKey(42), 'mx-hero-journey-progress:42')
  assert.equal(heroProgressKey(42, 'hero-journey'), heroProgressKey(42))
  assert.equal(heroDraftKey(42, 'uncertainty'), 'mx-hero-journey-draft:42:uncertainty')
  assert.equal(heroDraftKey(42, 'uncertainty', 'hero-journey'), heroDraftKey(42, 'uncertainty'))
  assert.notEqual(heroProgressKey(42, 'second'), heroProgressKey(42))
  assert.notEqual(heroProgressKey(42, 'second'), heroProgressKey(43, 'second'))
  assert.notEqual(heroDraftKey(42, 'step', 'second'), heroDraftKey(42, 'step', 'third'))
  const saved = {
    completed: { uncertainty: new Date().toISOString() },
    reflections: { uncertainty: 'Мой ответ' },
  }
  assert.deepEqual(parseProgress(JSON.stringify(saved)).completed, saved.completed)
  assert.equal(parseProgress(saved).reflections.uncertainty, 'Мой ответ')
  const hook = source('src/lib/heroJourneyProgress.js')
  assert.match(hook, /remote == null && courseId === 'hero-journey'/)
  assert.match(hook, /key.replaceAll\(':', '_'\)/)
  assert.match(source('src/lib/userDataScope.js'), /'mx-course-'/)
})

test('Курс подаётся данными; реестр автоматически находит файлы и скрывает демо в проде', () => {
  const registry = source('src/data/courses/index.js')
  assert.match(registry, /import.meta.glob/)
  assert.match(registry, /!course.demoOnly \|\| \(demo && demoCourses\)/)
  const engine = source('src/screens/HeroJourneyMap.jsx')
  assert.doesNotMatch(engine, /from '..\/data\/heroJourney'/)
  assert.match(engine, /courseContent\(course\)/)
  assert.match(engine, /useHeroJourneyProgress\(user.id, course.id\)/)
  assert.doesNotMatch(engine, /RoundBackButton/)
  assert.match(source('src/components/CourseCatalog.jsx'), /<ThemeQuestionCarousel/)
  assert.match(source('src/screens/Library.jsx'), /courses.length > 3/)
})

test('Темы имеют человеческие названия и заменяемые placeholder SVG', () => {
  assert.equal(libraryTopic('путь-героя').title, 'Кризис и рост')
  assert.equal(libraryTopic('юнг').title, 'Юнг')
  for (const tag of ['путь-героя', 'юнг', 'rest']) {
    assert.match(libraryTopic(tag).image, /placeholder-.*\.svg$/)
  }
  const reader = source('src/screens/LibraryArticleReader.jsx')
  assert.match(reader, /useBackButton\(onBack\)/)
  assert.match(reader, /showHeader=\{false\}/)
  assert.match(reader, /mx-type-page/)
})
