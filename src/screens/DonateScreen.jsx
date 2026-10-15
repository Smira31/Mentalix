import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import {
  ProfileBody,
  ProfileChips,
  ProfileGroup,
  ProfileNote,
  ProfilePage,
} from './settings/ProfileUi'
import { SupportGiftArt } from './settings/ProfileBannerArt'
import RoundSubmitButton from '../components/RoundSubmitButton'
import { api } from '../lib/api'
import { isGuestUser } from '../lib/guestAuth'
import { PAYMENT_UI_ENABLED } from '../lib/paymentConfig'
import {
  CUSTOM_AMOUNT,
  DONATION_AMOUNTS,
  DONATION_ERROR_COPY,
  MIN_DONATION_AMOUNT,
  clearDonationThanks,
  donationCta,
  readDonationThanks,
  resolveDonationAmount,
  sanitizeAmountInput,
  startDonation,
} from '../lib/donation'
import './DonateScreen.css'

/*
 * «поддержать проект.» — DESIGN_SYSTEM.md §5.4.
 *
 * Донат через ЮKassa — только при включённом VITE_PAYMENT_UI_ENABLED
 * (как экран «Подписка»): при выключенном флаге остаётся прежняя заглушка
 * «Оплата скоро появится».
 *
 * Экран: готовые плитки 100/300/500/1000 ₽ и «Своя сумма» (только цифры,
 * целое, 50…50000 — проверка на клиенте). Внизу одна белая круглая кнопка
 * (RoundSubmitButton): пока сумма не выбрана — «✕» (закрывает экран), после
 * выбора — «›» (оформить). По «›» — POST /api/donations и открытие
 * confirmation_url. Гость запрос не отправляет: видит «Войди через Telegram,
 * чтобы поддержать проект» и кнопку входа. Донат НЕ даёт Pro — статус
 * подписки на этом экране не показывается.
 */
export default function DonateScreen({ user, onBack, onGuestLogin }) {
  if (!PAYMENT_UI_ENABLED) return <LegacyDonateScreen onBack={onBack} />

  return <DonateScreenEnabled user={user} onBack={onBack} onGuestLogin={onGuestLogin} />
}

/*
 * Флаг выключен: прежнее поведение. Оплата не подключена, поэтому кнопка
 * неактивна и ничего не записывает: «донат» без списания выглядел бы как
 * настоящий платёж, которого не было.
 */
function LegacyDonateScreen({ onBack }) {
  return (
    <ProfilePage title="поддержать проект." onBack={onBack} testId="profile-screen-donate">
      <ProfileBody>
        <DonateIntro />

        <ProfileGroup label="Сумма">
          <ProfileChips
            label="Сумма поддержки"
            value={DONATION_AMOUNTS[1]}
            onChange={() => {}}
            options={[
              ...DONATION_AMOUNTS.map(amount => ({ value: amount, label: `${amount} ₽` })),
              { value: CUSTOM_AMOUNT, label: 'Своя' },
            ]}
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

/* Флаг включён: выбор суммы, донат и возврат с благодарностью. */
function DonateScreenEnabled({ user, onBack, onGuestLogin }) {
  const isGuest = isGuestUser(user)
  // Сумма не выбрана заранее — до выбора кнопка показывает «✕».
  const [selected, setSelected] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  // null | 'creating' | 'error'
  const [status, setStatus] = useState(null)
  const [errorText, setErrorText] = useState(null)
  const [guestPrompt, setGuestPrompt] = useState(false)
  // Благодарность показывается один раз — по отметке возврата с ЮKassa.
  const [thanks] = useState(() => readDonationThanks())

  useEffect(() => {
    clearDonationThanks()
  }, [])

  const amount = resolveDonationAmount(selected, customAmount)
  const cta = donationCta(amount)
  const isCustom = selected === CUSTOM_AMOUNT
  const customInvalid = isCustom && customAmount !== '' && amount === null

  function onCustomChange(e) {
    setCustomAmount(sanitizeAmountInput(e.target.value))
  }

  // При выборе плитки снимаем «Свою» и очищаем введённую сумму.
  function selectChip(value) {
    setSelected(value)
    setGuestPrompt(false)
    setStatus(null)
    setErrorText(null)
    if (value !== CUSTOM_AMOUNT) setCustomAmount('')
  }

  // Фокус на поле «Своя» — прокручиваем к нему, чтобы клавиатура не перекрывала поле и кнопку.
  function onCustomFocus(e) {
    requestAnimationFrame(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  }

  async function handleSubmit() {
    if (!Number.isInteger(amount)) return
    setStatus('creating')
    setErrorText(null)

    const result = await startDonation({
      amount,
      isGuest,
      create: value => api.donations.create(value),
      // ЮKassa возвращает пользователя на ?payment=return — открываем в текущей вкладке.
      navigate: url => window.location.assign(url),
    })

    if (result.state === 'ok') return // страница уходит на оплату
    if (result.state === 'guest') {
      setStatus(null)
      setGuestPrompt(true)
      return
    }

    setStatus('error')
    setErrorText(result.message || DONATION_ERROR_COPY.generic)
  }

  const options = [
    ...DONATION_AMOUNTS.map(amountValue => ({ value: amountValue, label: `${amountValue} ₽` })),
    { value: CUSTOM_AMOUNT, label: 'Своя' },
  ]

  if (thanks) {
    return (
      <ProfilePage
        title="поддержать проект."
        onBack={onBack}
        testId="profile-screen-donate"
        footer={
          <DonateCta>
            <RoundSubmitButton label="Закрыть" testId="donate-submit" icon="x" crossfade onClick={onBack} />
          </DonateCta>
        }
      >
        <ProfileBody>
          <DonateIntro />
          <h2 className="mx-donate-thanks" data-testid="donate-thanks">
            Спасибо!
          </h2>
          <p className="mx-donate-intro">
            Твоя поддержка помогает Mentalix расти. Ничего оформлять не нужно — это разовая помощь.
          </p>
        </ProfileBody>
      </ProfilePage>
    )
  }

  return (
    <ProfilePage
      title="поддержать проект."
      onBack={onBack}
      testId="profile-screen-donate"
      footer={
        <DonateCta>
          {errorText && (
            <p className="mx-donate-error" role="alert" data-testid="donate-error">
              {errorText}
            </p>
          )}
          {guestPrompt ? (
            <button
              type="button"
              className="mx-profile-primary"
              data-testid="donate-guest-login"
              onClick={onGuestLogin}
            >
              Войти через Telegram
            </button>
          ) : (
            <RoundSubmitButton
              label={cta === 'submit' ? 'Оформить' : 'Закрыть'}
              testId="donate-submit"
              icon={cta === 'submit' ? 'chevron' : 'x'}
              crossfade
              disabled={status === 'creating'}
              onClick={cta === 'submit' ? handleSubmit : onBack}
            />
          )}
        </DonateCta>
      }
    >
      <ProfileBody>
        <DonateIntro />

        <ProfileGroup label="Сумма">
          <ProfileChips
            label="Сумма поддержки"
            value={selected}
            onChange={selectChip}
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
                onFocus={onCustomFocus}
                placeholder={`от ${MIN_DONATION_AMOUNT} ₽`}
                min={MIN_DONATION_AMOUNT}
                aria-label="Своя сумма поддержки"
                data-testid="donate-custom-amount"
                className="mx-donate-custom__input"
              />
              {customInvalid && (
                <span className="mx-donate-custom__hint" data-testid="donate-custom-hint">
                  {DONATION_ERROR_COPY.amount}
                </span>
              )}
            </div>
          )}

          {guestPrompt && (
            <p className="mx-donate-guest-note" data-testid="donate-guest-note">
              Войди через Telegram, чтобы поддержать проект
            </p>
          )}

          <ProfileNote>
            Поддержка не связана с тарифами: донат не даёт Pro и не продлевает подписку — это просто
            способ помочь Mentalix расти.
          </ProfileNote>
        </ProfileGroup>
      </ProfileBody>
    </ProfilePage>
  )
}

/* Иллюстрация «лента с бантом» + тёплый текст — зачем поддержка. */
function DonateIntro() {
  return (
    <>
      <div className="mx-donate-art" aria-hidden="true">
        <SupportGiftArt />
      </div>
      <p className="mx-donate-intro">
        Mentalix делает один человек. Поддержка помогает развивать проект — добавлять собеседников,
        аналитику и курсы. Без давления: только если захочется помочь.
      </p>
    </>
  )
}

/* Низ экрана: одна круглая кнопка справа (как шаг чек-ина). */
function DonateCta({ children }) {
  return <div className="mx-donate-cta">{children}</div>
}
