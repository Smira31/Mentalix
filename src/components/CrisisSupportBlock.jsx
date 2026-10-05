// src/components/CrisisSupportBlock.jsx
//
// Постоянный блок «Нужна помощь прямо сейчас» в профиле.
// Номера кликабельны через tel:. Данные — из src/lib/crisisSupport.js
// (единая константа, чтобы менять в одном месте).

import { CRISIS_PROFILE } from '../lib/crisisSupport'

export default function CrisisSupportBlock() {
  return (
    <section className="mx-profile-group" aria-label={CRISIS_PROFILE.title} data-testid="crisis-support-block">
      <h2 className="mx-profile-group__label">{CRISIS_PROFILE.title}</h2>
      <div className="mx-profile-card">
        {CRISIS_PROFILE.lines.map((line, i) => (
          <a
            key={i}
            href={line.tel}
            className="mx-profile-row mx-crisis-link"
            data-testid={`crisis-support-link-${i}`}
          >
            <span className="mx-profile-row__text">
              <span className="mx-profile-row__title">{line.label}</span>
            </span>
            <span className="mx-profile-row__value mx-crisis-link__number">{line.number}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
