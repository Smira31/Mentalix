import { platform } from '../platform'
import { PRODUCTION_WEB_HOST } from '../lib/demoMode'
import { ProfileBody, ProfilePage } from './settings/ProfileUi'

const BOT_LINK_DEEPLINK = 'https://t.me/Mentalix_club_bot?start=link_web'

// DESIGN_SYSTEM.md §5.4: крупный строчный заголовок, шаги, белая главная кнопка.
const STEPS = [
  'Открой чат с ботом — там появится код. Он приходит только в личку от бота, так его нельзя перехватить.',
  `Открой ${PRODUCTION_WEB_HOST} в браузере и войди по email.`,
  'Введи код из чата, когда сайт попросит.',
]

export default function LinkWebAccount({ onBack }) {
  function openBot() {
    platform.haptic('light')
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(BOT_LINK_DEEPLINK)
    } else {
      window.open(BOT_LINK_DEEPLINK, '_blank')
    }
  }

  return (
    <ProfilePage title="связать с сайтом." onBack={onBack} testId="profile-screen-link-web">
      <ProfileBody>
        <ol className="mx-profile-steps">
          {STEPS.map((step, index) => (
            <li key={step} className="mx-profile-steps__item">
              <span className="mx-profile-steps__index" aria-hidden="true">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={openBot}
          className="mx-profile-primary"
          data-testid="link-web-bot-button"
        >
          Получить код у бота
        </button>
      </ProfileBody>
    </ProfilePage>
  )
}
