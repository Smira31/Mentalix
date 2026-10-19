import { HERO_JOURNEY_COURSE, HERO_JOURNEY_TRIALS } from '../heroJourney'
import cover from '../../assets/hero-journey/course-cover@2x.webp'

export default {
  ...HERO_JOURNEY_COURSE,
  id: 'hero-journey',
  label: 'ПРАКТИКУМ · 16 ШАГОВ',
  // Обложка 1:2 для колонки карточки (~119×240): берём файл @2x (480×960)
  // для Retina, чёрный фон сливается с фоном колонки, кадр — cover по центру.
  cover,
  // Размеры нужны карточке, чтобы вёрстка не прыгала при загрузке.
  imageWidth: 480,
  imageHeight: 960,
  steps: HERO_JOURNEY_TRIALS,
}
