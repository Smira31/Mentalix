import journalHero from '../../assets/illustrations/journal-hero.webp'

export function JournalHeroArt() {
  return (
    <img
      src={journalHero}
      alt=""
      aria-hidden="true"
      focusable="false"
      draggable={false}
      className="mx-steps-journal__art-img"
    />
  )
}
