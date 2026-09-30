/** Demo deep-link for «Путь героя». */
import { isPreviewDemoMode } from './demoMode'

export const DEMO_HERO_JOURNEY_ACTION = 'hero_journey'

export function previewHeroJourneyAction() {
  if (typeof window === 'undefined') return null
  if (!isPreviewDemoMode()) return null
  const requested = new URLSearchParams(window.location.search).get('action')
  return requested === DEMO_HERO_JOURNEY_ACTION ? 'hero_journey' : null
}
