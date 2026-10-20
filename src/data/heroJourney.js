/**
 * Путь героя — авторский курс Mentalix.
 * Основа: общие идеи мономифа (Дж. Кэмпбелл) и аналитической психологии (К. Г. Юнг).
 *
 * Курс: 16 шагов в 4 главах + финал «Возвращение».
 *
 * Тексты шагов, пролога, финала и описания загружаются с сервера
 * (GET /api/content/hero-journey) — см. src/lib/heroJourneyContent.js.
 * Здесь остаются только структурные данные (id, номер, картинка-ключ,
 * кадр) для helper-функций и разрешения картинок.
 */

/* image.frame.done: top — срез пустого верха в пикселях исходника;
 * width/height — оставшийся кадр. Вступления используют исходный кадр. */

// ── 16 шагов курса (порядок = номер шага 1–16) ──
// Тексты (intro, writePrompt, actionPrompt, doneTitle и т.д.) приходят с сервера.
// Здесь — только id, номер и данные картинки для словаря.
export const HERO_JOURNEY_TRIALS = [
  { id: 'uncertainty', number: 1, image: { enter: 'uncertainty-enter', done: 'uncertainty-done', frame: { done: { top: 197, width: 1170, height: 703 } }, overlap: 0.08 } },
  { id: 'temporality', number: 2, image: { enter: 'temporality-enter', done: 'temporality-done', frame: { done: { top: 64, width: 1170, height: 836 } }, overlap: 0.08 } },
  { id: 'choice', number: 3, image: { enter: 'choice-enter', done: 'choice-done', frame: { done: { top: 0, width: 1170, height: 900 } }, overlap: 0.08 } },
  { id: 'abundance', number: 4, image: { enter: 'abundance-enter', done: 'abundance-done', frame: { done: { top: 96, width: 1170, height: 804 } }, overlap: 0.08 } },
  { id: 'body', number: 5, image: { enter: 'body-enter', done: 'body-done', frame: { done: { top: 42, width: 780, height: 478 } }, overlap: 0.12 } },
  { id: 'phone', number: 6 },
  { id: 'autopilot', number: 7 },
  { id: 'digital-avatar', number: 8, image: { enter: 'digital-avatar-enter', done: 'digital-avatar-done', frame: { done: { top: 76, width: 1170, height: 824 } }, focus: '45% 40%', overlap: 0.12, compact: true } },
  { id: 'comparison', number: 9, image: { enter: 'comparison-enter', done: 'comparison-done', frame: { done: { top: 0, width: 1170, height: 900 } }, focus: '30% 40%', overlap: 0.22 } },
  { id: 'mirror', number: 10, image: { enter: 'mirror-enter', done: 'mirror-done', frame: { done: { top: 0, width: 1170, height: 900 } }, focus: '40% 40%', overlap: 0.22 } },
  { id: 'loneliness', number: 11, image: { enter: 'loneliness-enter', done: 'loneliness-done', frame: { done: { top: 0, width: 1170, height: 900 } }, focus: '35% 40%', overlap: 0.22 } },
  { id: 'relationships', number: 12, image: { enter: 'relationships-enter', done: 'relationships-done', frame: { done: { top: 0, width: 1170, height: 900 } }, focus: '40% 30%', compact: true, overlap: 0.22 } },
  { id: 'lost-supports', number: 13, image: { enter: 'lost-supports-enter', done: 'lost-supports-done', frame: { done: { top: 146, width: 1170, height: 754 } }, focus: '50% 40%', overlap: 0.08 } },
  { id: 'age-crises', number: 14, image: { enter: 'age-crises-enter', done: 'age-crises-done', frame: { done: { top: 93, width: 1170, height: 807 } }, focus: '55% 40%', overlap: 0.12 } },
  { id: 'meaning', number: 15, image: { enter: 'meaning-enter', done: 'meaning-done', frame: { done: { top: 110, width: 1170, height: 790 } }, focus: '45% 35%', overlap: 0.08 } },
  { id: 'self-assembly', number: 16, image: { enter: 'self-assembly-enter', done: 'self-assembly-done', frame: { done: { top: 42, width: 1170, height: 858 } }, focus: '40% 40%', overlap: 0.12 } },
]

export const HERO_JOURNEY_TOTAL_STEPS = HERO_JOURNEY_TRIALS.length

export const HERO_JOURNEY_CHAPTERS = [
  { key: 'call', roman: 'I', trialIds: ['uncertainty', 'temporality', 'choice', 'abundance'] },
  { key: 'threshold', roman: 'II', trialIds: ['body', 'phone', 'autopilot', 'digital-avatar'] },
  { key: 'trials', roman: 'III', trialIds: ['comparison', 'mirror', 'loneliness', 'relationships'] },
  { key: 'death', roman: 'IV', trialIds: ['lost-supports', 'age-crises', 'meaning', 'self-assembly'] },
]

export function findTrial(id) {
  return HERO_JOURNEY_TRIALS.find(trial => trial.id === id) || null
}

export function previousTrial(id) {
  const index = HERO_JOURNEY_TRIALS.findIndex(trial => trial.id === id)
  return index > 0 ? HERO_JOURNEY_TRIALS[index - 1] : null
}

export function trialByNumber(number) {
  return HERO_JOURNEY_TRIALS.find(trial => trial.number === number) || null
}

export function chapterForTrial(id) {
  return HERO_JOURNEY_CHAPTERS.find(chapter => chapter.trialIds.includes(id)) || null
}

export function trialsForChapter(chapter) {
  if (!chapter) return []
  return chapter.trialIds.map(findTrial).filter(Boolean)
}
