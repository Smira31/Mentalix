import hero from '../assets/onboarding-hero.png'

export default function OnboardingHero({ className = '' }) {
  // Renders the supplied hero image centered and contained.
  // Layout and classes preserved; visual tweaks applied via CSS.
  return (
    <div className={`mx-onboarding-hero ${className}`} aria-hidden="true">
      <img src={hero} alt="" className="mx-onboarding-hero-img" />
    </div>
  )
}
