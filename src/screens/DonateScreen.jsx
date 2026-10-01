import { useState } from 'react'
import { Lock } from 'lucide-react'
import {
  ProfileBody,
  ProfileChips,
  ProfileGroup,
  ProfileNote,
  ProfilePage,
} from './settings/ProfileUi'
import { SupportGiftArt } from './settings/ProfileBannerArt'
import './DonateScreen.css'

const AMOUNTS = [100, 300, 500, 1000]
const CUSTOM = 'custom'
const MIN_AMOUNT = 50

/*
 * «поддержать проект.» — DESIGN_SYSTEM.md §5.4. Оплата ещё не подключена,
 * поэтому кнопка неактивна и ничего не записывает: «донат» без списания
 * выглядел бы как настоящий платёж, которого не было.
 *
 * Сверху — иллюстрация «лента с бантом» (та же, что на карточке «Поддержи
 * Mentalix»), крупнее. Суммы — чипсы 100/300/500/1000 ₽ + «Своя сумма»
 * с полем ввода (только цифры, минимум 50 ₽).
 */
export default function DonateScreen({ onBack }) {
  const [selected, setSelected] = useState(AMOUNTS[1])
  const [customAmount, setCustomAmount] = useState('')

  const isCustom = selected === CUSTOM

  function onCustomChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCustomAmount(digits)
  }

  const options = [
    ...AMOUNTS.map(amount => ({ value: amount, label: `${amount} ₽` })),
    { value: CUSTOM, label: 'Своя' },
  ]

  return (
    <ProfilePage title="поддержать проект." onBack={onBack} testId="profile-screen-donate">
      <ProfileBody>
        <div className="mx-donate-art" aria-hidden="true">
          <SupportGiftArt />
        </div>

        <p className="mx-donate-intro">
          Mentalix делает один человек. Поддержка помогает развивать проект — добавлять
          собеседников, аналитику и курсы. Без давления: только если захочется помочь.
        </p>

        <ProfileGroup label="Сумма">
          <ProfileChips
            label="Сумма поддержки"
            value={selected}
            onChange={setSelected}
            options={options}
          />

          {isCustom && (
            <div className="mx-donate-custom">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={customAmount}
                onChange={onCustomChange}
                placeholder={`от ${MIN_AMOUNT} ₽`}
                min={MIN_AMOUNT}
                aria-label="Своя сумма поддержки"
                data-testid="donate-custom-amount"
                className="mx-donate-custom__input"
              />
              {customAmount !== '' && Number(customAmount) < MIN_AMOUNT && (
                <span className="mx-donate-custom__hint">
                  Минимум {MIN_AMOUNT} ₽
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            disabled
            data-testid="donate-pay-button"
            className="mx-profile-disabled-cta"
          >
            <Lock size={14} aria-hidden="true" /> Оплата скоро появится
          </button>
          <ProfileNote>
            Поддержка не связана с тарифами — это просто способ помочь Mentalix расти. Как только
            оплата появится, выбрать сумму можно будет здесь.
          </ProfileNote>
        </ProfileGroup>
      </ProfileBody>
    </ProfilePage>
  )
}
