import { HERO_JOURNEY_COURSE, HERO_JOURNEY_TRIALS } from '../heroJourney'
import image from '../../assets/library/hero-path-cover.webp'

export default {
  ...HERO_JOURNEY_COURSE,
  id: 'hero-journey',
  label: 'КУРС · 16 ШАГОВ',
  image,
  // Обложка 1:2 — размеры нужны карточке, чтобы вёрстка не прыгала при загрузке.
  imageWidth: 480,
  imageHeight: 960,
  steps: HERO_JOURNEY_TRIALS,
}
