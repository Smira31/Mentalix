import { ProfilePage } from './settings/ProfileUi'
import { privacyPolicy } from '../content/privacyPolicy'
import './PrivacyNotice.css'

function renderPart(part, i) {
  if (part.href) {
    return (
      <a
        key={i}
        href={part.href}
        target={part.href.startsWith('http') ? '_blank' : undefined}
        rel={part.href.startsWith('http') ? 'noreferrer' : undefined}
      >
        {part.text}
      </a>
    )
  }
  return <span key={i}>{part.text}</span>
}

function renderBlock(block, i) {
  if (block.type === 'list') {
    return (
      <ul key={i} className="mx-privacy-list">
        {block.items.map((item, j) => (
          <li key={j}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <p key={i} className="mx-privacy-text">
      {block.parts ? block.parts.map(renderPart) : block.text}
    </p>
  )
}

export default function PrivacyNotice({ onBack }) {
  return (
    <ProfilePage
      title={privacyPolicy.screenTitle}
      onBack={onBack}
      testId="profile-screen-privacy"
    >
      <p className="mx-privacy-subtitle">
        Версия {privacyPolicy.version} · действует с {privacyPolicy.effectiveDate}
      </p>

      <div className="mx-privacy-content">
        {privacyPolicy.sections.map(section => (
          <section key={section.id} className="mx-privacy-section">
            <h2 className="mx-privacy-heading">
              {section.id}. {section.heading}
            </h2>
            {section.blocks.map(renderBlock)}
          </section>
        ))}
      </div>
    </ProfilePage>
  )
}
