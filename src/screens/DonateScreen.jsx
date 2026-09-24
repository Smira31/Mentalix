import { useState } from 'react'
import { Lock } from 'lucide-react'
import {
  ProfileBody,
  ProfileChips,
  ProfileGroup,
  ProfileNote,
  ProfilePage,
} from './settings/ProfileUi'

const AMOUNTS = [100, 300, 500, 1000]

/*
 * «поддержать проект.» — DESIGN_SYSTEM.md §5.4. Оплата ещё не подключена,
 * поэтому кнопка неактивна и ничего не записывает: «донат» без списания
 * выглядел бы как настоящий платёж, которого не было.
 */
export default function DonateScreen({ onBack }) {
  const [selected, setSelected] = useState(AMOUNTS[1])

  return (
    <ProfilePage title="поддержать проект." onBack={onBack} testId="profile-screen-donate">
      <ProfileBody>
        <ProfileGroup label="Сумма">
          <ProfileChips
            label="Сумма поддержки"
            value={selected}
            onChange={setSelected}
            options={AMOUNTS.map(amount => ({ value: amount, label: `${amount} ₽` }))}
          />
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
