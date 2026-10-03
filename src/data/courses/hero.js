import { HERO_JOURNEY_COURSE, HERO_JOURNEY_TRIALS } from '../heroJourney'
import image from '../../assets/library/placeholder-road.svg'

export default {
  ...HERO_JOURNEY_COURSE,
  id: 'hero-journey',
  label: 'КУРС · 16 ШАГОВ',
  image,
  steps: HERO_JOURNEY_TRIALS,
}
