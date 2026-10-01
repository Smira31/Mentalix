import { useMemo, useState } from 'react'
import { Check, Heart, ShieldCheck } from 'lucide-react'
import { ProfileBody, ProfilePage } from './settings/ProfileUi'

const STORAGE_PREFIX = 'mx-wtp-concept-test-v1'

const CONCEPTS = [
  {
    id: 'track',
    label: 'Разбор одной ситуации',
    title: 'Провести один сложный вопрос до действия',
    description:
      'Короткий маршрут под конкретную ситуацию: понять, что происходит, выбрать следующий шаг и не потерять его.',
    outcome: 'Ясность и движение в одном важном деле.',
  },
  {
    id: 'patterns',
    label: 'Обзор повторений',
    title: 'Увидеть свои повторяющиеся паттерны',
    description:
      'Спокойное резюме сохранённых отметок: что повторяется, где появляется напряжение и что уже помогает.',
    outcome: 'Понимание себя без диагнозов и громких выводов.',
  },
  {
    id: 'deepen',
    label: 'Глубокий разбор с ИИ',
    title: 'Получить более глубокий разбор',
    description:
      'Дополнительные вопросы и варианты взгляда на запись, когда хочется не просто отметить, а разобраться глубже.',
    outcome: 'Больше глубины в рефлексии, когда она действительно нужна.',
  },
]

const INTENT_OPTIONS = [
  { value: 'yes', label: 'Да, вероятно' },
  { value: 'maybe', label: 'Возможно, хочу понять условия' },
  { value: 'no', label: 'Пока нет' },
]

const WTP_TITLE = 'что было бы полезно?'

const TEST_STEPS = ['concept', 'intent', 'trust', 'complete']

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${String(userId || 'anonymous')}`
}

function readDraft(userId) {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(storageKey(userId))
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function writeDraft(userId, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(value))
  } catch {
    // The research flow stays usable if local storage is unavailable.
  }
}

function OptionButton({ selected, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className="mx-profile-option">
      {children}
    </button>
  )
}

export default function WillingnessToPayTest({ user, onBack }) {
  const saved = useMemo(() => readDraft(user?.id), [user?.id])
  const [step, setStep] = useState(
    saved?.step && TEST_STEPS.includes(saved.step) ? saved.step : 'concept'
  )
  const [concept, setConcept] = useState(() =>
    Array.isArray(saved?.concept) ? saved.concept : saved?.concept ? [saved.concept] : []
  )
  const [conceptChanged, setConceptChanged] = useState(false)
  const [intent, setIntent] = useState(saved?.intent || '')
  const [trust, setTrust] = useState(saved?.trust || '')

  function persist(patch) {
    const next = {
      ...saved,
      concept,
      intent,
      trust,
      step,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    writeDraft(user?.id, next)
  }

  function chooseConcept(value) {
    setConcept(current =>
      current.includes(value) ? current.filter(item => item !== value) : [...current, value]
    )
    setConceptChanged(true)
  }

  function chooseIntent(value) {
    setIntent(value)
    persist({ intent: value })
  }

  function complete() {
    setStep('complete')
    persist({ step: 'complete' })
  }

  const selectedConcepts = CONCEPTS.filter(item => concept.includes(item.id))

  if (step === 'complete') {
    return (
      <ProfilePage
        title={WTP_TITLE}
        onBack={onBack}
        testId="profile-screen-wtp"
        footer={
          <button type="button" onClick={onBack} className="mx-profile-primary">
            Вернуться в настройки
          </button>
        }
      >
        <ProfileBody>
          <div className="rounded-2xl bg-[rgb(var(--c-card2))] p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--c-card3))] text-cream">
              <Check size={22} />
            </div>
            <h2 className="font-display text-[24px] leading-tight text-cream">
              Спасибо за честный ответ.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Это исследование не открывает оплату и ни к чему тебя не обязывает. Ответ остаётся на
              этом устройстве и помогает понять, какой результат Mentalix действительно стоит
              развивать.
            </p>
          </div>
        </ProfileBody>
      </ProfilePage>
    )
  }

  const footerButton = (() => {
    if (step === 'concept') {
      return (
        <button
          type="button"
          disabled={!conceptChanged}
          onClick={() => {
            setStep('intent')
            persist({ step: 'intent', concept })
          }}
          className="mx-wtp-save"
        >
          Сохранить
        </button>
      )
    }
    if (step === 'intent') {
      return (
        <button
          type="button"
          disabled={!intent}
          onClick={() => {
            setStep('trust')
            persist({ step: 'trust' })
          }}
          className="mx-profile-primary"
        >
          Продолжить
        </button>
      )
    }
    if (step === 'trust') {
      return (
        <div className="flex flex-col items-center gap-3">
          <button type="button" onClick={complete} className="mx-profile-primary">
            Завершить без оплаты
          </button>
          <button
            type="button"
            onClick={complete}
            className="min-h-11 w-full text-[12px] font-semibold text-muted"
          >
            Пропустить этот вопрос
          </button>
        </div>
      )
    }
    return null
  })()

  return (
    <ProfilePage title={WTP_TITLE} onBack={onBack} testId="profile-screen-wtp" footer={footerButton}>
      <ProfileBody>

        {step === 'concept' && (
          <section>
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-muted">
                <Heart size={15} />
                <span className="text-[11px] font-label uppercase tracking-wider">
                  короткий опрос · шаг 1 из 4
                </span>
              </div>
              <h2 className="font-display text-[22px] leading-tight text-cream">
                За какой результат хотелось бы платить?
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Представь, что базовый ежедневный цикл Mentalix остаётся бесплатным. Какое
                дополнительное продолжение было бы для тебя самым ценным?
              </p>
            </div>
            <div className="mx-wtp-options">
              {CONCEPTS.map(item => (
                <button
                  type="button"
                  key={item.id}
                  className="mx-wtp-option"
                  aria-pressed={concept.includes(item.id)}
                  onClick={() => chooseConcept(item.id)}
                >
                  <span>{item.label}</span>
                  <span className="mx-wtp-option__check" aria-hidden="true">
                    {concept.includes(item.id) && <Check size={15} strokeWidth={2.5} />}
                  </span>
                </button>
              ))}
            </div>
            {selectedConcepts.map(item => (
              <div key={item.id} className="mx-wtp-description">
                <p className="font-semibold text-cream">{item.title}</p>
                <p className="mt-1 text-muted">{item.description}</p>
              </div>
            ))}
          </section>
        )}

        {step === 'intent' && (
          <section>
            <div className="mb-6">
              <span className="text-[11px] font-label uppercase tracking-wider text-muted">
                о выбранном результате · шаг 2 из 4
              </span>
              <h2 className="mt-2 font-display text-[22px] leading-tight text-cream">
                Хотелось бы попробовать?
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Ты выбрал: <span className="text-cream">{selectedConcepts.map(item => item.title).join(', ')}</span>. Здесь нет
                покупки — нам важно понять только твой уровень интереса.
              </p>
            </div>
            <div className="space-y-3">
              {INTENT_OPTIONS.map(item => (
                <OptionButton
                  key={item.value}
                  selected={intent === item.value}
                  onClick={() => chooseIntent(item.value)}
                >
                  <span className="text-[14px] font-semibold">{item.label}</span>
                </OptionButton>
              ))}
            </div>
          </section>
        )}

        {step === 'trust' && (
          <section>
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-muted">
                <ShieldCheck size={15} />
                <span className="text-[11px] font-label uppercase tracking-wider">
                  доверие и границы · шаг 3 из 4
                </span>
              </div>
              <h2 className="font-display text-[22px] leading-tight text-cream">
                Что остановило бы тебя?
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                Необязательно отвечать. Напиши своими словами, что важно знать до любого платного
                продолжения Mentalix.
              </p>
            </div>
            <textarea
              value={trust}
              onChange={event => setTrust(event.target.value)}
              onBlur={() => persist({ trust })}
              placeholder="Например: хочу понимать, что происходит с моими записями…"
              className="min-h-[148px] w-full resize-none rounded-2xl border border-transparent bg-[rgb(var(--c-card2))] px-4 py-3 text-[16px] leading-relaxed text-cream outline-none placeholder:text-faint focus:border-muted"
            />
          </section>
        )}
      </ProfileBody>
    </ProfilePage>
  )
}
