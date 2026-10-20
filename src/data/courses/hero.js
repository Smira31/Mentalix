import { HERO_JOURNEY_TRIALS, HERO_JOURNEY_CHAPTERS } from '../heroJourney'
import cover from '../../assets/hero-journey/course-cover@2x.webp'

// Тексты курса (title, subtitle, description, prologue, finale) приходят с сервера
// (src/lib/heroJourneyContent.js). Здесь — структурные данные для карточки курса
// в Библиотеке и для courseContent() до загрузки серверных данных.
export default {
  id: 'hero-journey',
  title: 'Путь героя',
  subtitle: '16 шагов · 4 главы',
  description:
    '16 шагов о том, как не прожить жизнь на автопилоте. В каждом шаге: прочитать, записать, сделать одно действие.',
  label: 'ПРАКТИКУМ · 16 ШАГОВ',
  cover,
  imageWidth: 480,
  imageHeight: 960,
  steps: HERO_JOURNEY_TRIALS,
  chapters: HERO_JOURNEY_CHAPTERS,
  prologue: null,
  finale: null,
}
