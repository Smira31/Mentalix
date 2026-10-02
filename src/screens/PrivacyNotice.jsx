import { useState } from 'react'
import { canOpenMailto, copyText, openExternal } from '../lib/externalLinks'
import { ProfilePage } from './settings/ProfileUi'
import { privacyPolicy } from '../content/privacyPolicy'
import './PrivacyNotice.css'

function MailtoPart({ text, href }) {
  const [copied, setCopied] = useState(false)

  // В вебе mailto открывается почтовым клиентом браузера.
  if (canOpenMailto()) {
    return (
      <a
        href={href}
        onClick={event => {
          event.preventDefault()
          openExternal(href)
        }}
      >
        {text}
      </a>
    )
  }

  // В Telegram mailto не открывается надёжно — показываем адрес и даём скопировать.
  return (
    <span>
      <span>{text}</span>{' '}
      <button
        type="button"
        className="mx-privacy-copy"
        onClick={async () => {
          if (await copyText(text)) {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
          }
        }}
      >
        {copied ? 'Скопировано' : 'Скопировать'}
      </button>
    </span>
  )
}

function renderPart(part, i) {
  if (part.href?.startsWith('mailto:')) {
    return <MailtoPart key={i} text={part.text} href={part.href} />
  }
  if (part.href) {
    return (
      <a
        key={i}
        href={part.href}
        onClick={event => {
          event.preventDefault()
          openExternal(part.href)
        }}
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
    <ProfilePage title={privacyPolicy.screenTitle} onBack={onBack} testId="profile-screen-privacy">
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
