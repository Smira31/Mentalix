/**
 * Словарь картинок «Пути героя»: ключ → импортированный webp.
 *
 * Сервер отдаёт image.enter / image.done как строки-ключи (например
 * "uncertainty-enter"). Этот файл — единственное место, где хранятся
 * соответствие ключей и импортированных файлов. Если ключа нет —
 * показываем шаг без картинки, не падаем (см. resolveHeroImage).
 */
import uncertaintyEnter from '../assets/hero-journey/uncertainty-enter.webp'
import uncertaintyDone from '../assets/hero-journey/uncertainty-done.webp'
import temporalityEnter from '../assets/hero-journey/temporality-enter.webp'
import temporalityDone from '../assets/hero-journey/temporality-done.webp'
import choiceEnter from '../assets/hero-journey/choice-enter.webp'
import choiceDone from '../assets/hero-journey/choice-done.webp'
import abundanceEnter from '../assets/hero-journey/abundance-enter.webp'
import abundanceDone from '../assets/hero-journey/abundance-done.webp'
import comparisonEnter from '../assets/hero-journey/comparison-enter.webp'
import comparisonDone from '../assets/hero-journey/comparison-done.webp'
import mirrorEnter from '../assets/hero-journey/mirror-enter.webp'
import mirrorDone from '../assets/hero-journey/mirror-done.webp'
import lonelinessEnter from '../assets/hero-journey/loneliness-enter.webp'
import lonelinessDone from '../assets/hero-journey/loneliness-done.webp'
import relationshipsEnter from '../assets/hero-journey/relationships-enter.webp'
import relationshipsDone from '../assets/hero-journey/relationships-done.webp'
import lostSupportsEnter from '../assets/hero-journey/lost-supports-enter.webp'
import lostSupportsDone from '../assets/hero-journey/lost-supports-done.webp'
import ageCrisesEnter from '../assets/hero-journey/age-crises-enter.webp'
import ageCrisesDone from '../assets/hero-journey/age-crises-done.webp'
import meaningEnter from '../assets/hero-journey/meaning-enter.webp'
import meaningDone from '../assets/hero-journey/meaning-done.webp'
import selfAssemblyEnter from '../assets/hero-journey/self-assembly-enter.webp'
import selfAssemblyDone from '../assets/hero-journey/self-assembly-done.webp'
import returnImage from '../assets/hero-journey/return.webp'
import bodyEnter from '../assets/hero-journey/body-enter.webp'
import bodyDone from '../assets/hero-journey/body-done.webp'
import digitalAvatarEnter from '../assets/hero-journey/digital-avatar-enter.webp'
import digitalAvatarDone from '../assets/hero-journey/digital-avatar-done.webp'
import courseCover from '../assets/hero-journey/course-cover@2x.webp'

export const HERO_JOURNEY_IMAGES = {
  'uncertainty-enter': uncertaintyEnter,
  'uncertainty-done': uncertaintyDone,
  'temporality-enter': temporalityEnter,
  'temporality-done': temporalityDone,
  'choice-enter': choiceEnter,
  'choice-done': choiceDone,
  'abundance-enter': abundanceEnter,
  'abundance-done': abundanceDone,
  'comparison-enter': comparisonEnter,
  'comparison-done': comparisonDone,
  'mirror-enter': mirrorEnter,
  'mirror-done': mirrorDone,
  'loneliness-enter': lonelinessEnter,
  'loneliness-done': lonelinessDone,
  'relationships-enter': relationshipsEnter,
  'relationships-done': relationshipsDone,
  'lost-supports-enter': lostSupportsEnter,
  'lost-supports-done': lostSupportsDone,
  'age-crises-enter': ageCrisesEnter,
  'age-crises-done': ageCrisesDone,
  'meaning-enter': meaningEnter,
  'meaning-done': meaningDone,
  'self-assembly-enter': selfAssemblyEnter,
  'self-assembly-done': selfAssemblyDone,
  'return': returnImage,
  'body-enter': bodyEnter,
  'body-done': bodyDone,
  'digital-avatar-enter': digitalAvatarEnter,
  'digital-avatar-done': digitalAvatarDone,
  'course-cover': courseCover,
}

/**
 * Подставляет картинку по строковому ключу из server-данных.
 * Если ключа нет — возвращает null (шаг показывается без картинки).
 */
export function resolveHeroImage(key) {
  if (!key) return null
  return HERO_JOURNEY_IMAGES[key] || null
}
