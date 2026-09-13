import { useState } from 'react'

import SemanticGlyph, { semanticKindForPersona } from '../SemanticGlyph'

import './PersonaPickerRedesignExperiment.css'

const PERSONAS = [
  {
    key: 'mayak',
    name: 'Собеседник',
    promise: 'разобраться в том, что чувствуешь',
    description:
      'Тёплый и внимательный разговор без оценки, когда нужно выговориться или услышать себя.',
    question: 'Что сейчас у тебя на душе?',
    history: [
      { role: 'assistant', text: 'Я рядом. С чего тебе хочется начать сегодня?' },
      { role: 'user', text: 'День выдался тяжёлым, но я пока не могу понять почему.' },
    ],
  },
  {
    key: 'kompas',
    name: 'Наставник',
    promise: 'выбрать следующий шаг',
    description:
      'Поможет превратить запутанную цель в один небольшой шаг, который можно сделать сегодня.',
    question: 'Какой шаг ты сделаешь сегодня?',
    history: [],
  },
  {
    key: 'dnevnik',
    name: 'Следопыт',
    promise: 'заметить важный паттерн',
    description: 'Поможет оглянуться на день, увидеть повторяющееся и не пропустить главное.',
    question: 'Что сегодня осталось с тобой?',
    history: [
      { role: 'assistant', text: 'Давай посмотрим на сегодняшний день спокойно и без спешки.' },
      { role: 'user', text: 'Я снова откладывал разговор, которого ждал.' },
    ],
  },
]

const DEFAULT_PERSONA = PERSONAS[0]

function PersonaMark({ persona, active = false }) {
  return (
    <div className="mx-persona-redesign__mark" aria-hidden="true">
      <SemanticGlyph
        kind={semanticKindForPersona(persona.key)}
        animated={active}
        highlighted={active}
        className="mx-persona-redesign__glyph"
      />
    </div>
  )
}

function RoleOption({ persona, selected, onSelect }) {
  return (
    <button
      type="button"
      className="mx-persona-redesign__role-option"
      aria-pressed={selected}
      onClick={() => onSelect(persona)}
    >
      <PersonaMark persona={persona} active={selected} />
      <span>
        <strong>{persona.name}</strong>
        <small>{persona.promise}</small>
      </span>
      {selected && <span className="mx-persona-redesign__check">Выбрано</span>}
    </button>
  )
}

function ConversationPreview({ persona, mode, onBack, onChangeRole, onModeChange }) {
  const hasHistory = persona.history.length > 0
  const isLoading = mode === 'loading'
  const isError = mode === 'error'

  return (
    <section
      className="mx-persona-redesign__conversation"
      aria-labelledby="conversation-preview-title"
    >
      <header className="mx-persona-redesign__conversation-header">
        <button type="button" className="mx-persona-redesign__text-button" onClick={onBack}>
          ← Назад к «Диалогу»
        </button>
        <div className="mx-persona-redesign__conversation-title">
          <PersonaMark persona={persona} active />
          <div>
            <span className="mx-persona-redesign__eyebrow">Preview-only Conversation</span>
            <h3 id="conversation-preview-title">{persona.name}</h3>
          </div>
        </div>
        <button
          type="button"
          className="mx-persona-redesign__secondary-button"
          onClick={onChangeRole}
        >
          Сменить роль
        </button>
      </header>

      <div className="mx-persona-redesign__state-controls" aria-label="Состояния preview">
        <span>Состояние:</span>
        {['history', 'empty', 'loading', 'error'].map(state => (
          <button
            type="button"
            key={state}
            className={mode === state ? 'is-active' : ''}
            onClick={() => onModeChange(state)}
          >
            {state === 'history'
              ? 'История'
              : state === 'empty'
                ? 'Empty'
                : state === 'loading'
                  ? 'Loading'
                  : 'Error'}
          </button>
        ))}
      </div>

      <div className="mx-persona-redesign__messages" aria-live="polite">
        {isLoading && (
          <p className="mx-persona-redesign__state-message">Загрузка истории выбранной роли…</p>
        )}
        {isError && (
          <div className="mx-persona-redesign__state-message">
            <strong>Не удалось загрузить историю</strong>
            <span>Это preview-состояние. Повтори попытку или выбери другую роль.</span>
            <button
              type="button"
              className="mx-persona-redesign__secondary-button"
              onClick={() => onModeChange(hasHistory ? 'history' : 'empty')}
            >
              Повторить
            </button>
          </div>
        )}
        {!isLoading && !isError && mode === 'history' && hasHistory && (
          <>
            <p className="mx-persona-redesign__history-label">
              История {persona.name.toLowerCase()} сохраняется
            </p>
            {persona.history.map((message, index) => (
              <div
                className={`mx-persona-redesign__bubble mx-persona-redesign__bubble--${message.role}`}
                key={`${message.role}-${index}`}
              >
                {message.text}
              </div>
            ))}
          </>
        )}
        {!isLoading && !isError && (mode === 'empty' || (mode === 'history' && !hasHistory)) && (
          <div className="mx-persona-redesign__empty">
            <PersonaMark persona={persona} />
            <strong>Здесь появится ваш разговор</strong>
            <p>
              История этой роли пока пуста. Начни с одного сообщения — можно в любой момент сменить
              роль.
            </p>
          </div>
        )}
      </div>

      <div className="mx-persona-redesign__composer">
        <label htmlFor="preview-message">Сообщение для {persona.name.toLowerCase()}</label>
        <div className="mx-persona-redesign__input-row">
          <input id="preview-message" placeholder={persona.question} aria-label="Сообщение" />
          <button
            type="button"
            className="mx-persona-redesign__send-button"
            aria-label="Отправить сообщение"
          >
            ↑
          </button>
        </div>
        <p>Preview-only: сообщение не отправляется и не сохраняется.</p>
      </div>
    </section>
  )
}

export default function PersonaPickerRedesignExperiment() {
  const [screen, setScreen] = useState('home')
  const [selected, setSelected] = useState(DEFAULT_PERSONA)
  const [conversationMode, setConversationMode] = useState('history')
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)

  function openConversation(persona = selected) {
    setSelected(persona)
    setConversationMode(persona.history.length ? 'history' : 'empty')
    setRoleMenuOpen(false)
    setScreen('conversation')
  }

  function chooseRole(persona) {
    setSelected(persona)
    setRoleMenuOpen(false)
  }

  return (
    <section
      className="mx-persona-redesign"
      data-experiment-id="MXL-DIALOG-UX-001"
      aria-labelledby="persona-redesign-title"
    >
      {screen === 'home' ? (
        <>
          <header className="mx-persona-redesign__intro">
            <span>UI Lab · Preview-only · MXL-DIALOG-UX-001</span>
            <h2 id="persona-redesign-title">Диалог</h2>
            <p>
              Иногда полезно начать с того, чтобы тебя просто услышали. Выбери разговор под то, что
              нужно прямо сейчас.
            </p>
          </header>

          <section className="mx-persona-redesign__hero" aria-labelledby="hero-title">
            <PersonaMark persona={selected} active />
            <div className="mx-persona-redesign__hero-copy">
              <span className="mx-persona-redesign__eyebrow">Твой разговор на сейчас</span>
              <h3 id="hero-title">{selected.name}</h3>
              <p>{selected.promise}</p>
              <span className="mx-persona-redesign__role-description">{selected.description}</span>
            </div>
            <button
              type="button"
              className="mx-persona-redesign__primary-button"
              onClick={() => openConversation()}
            >
              Начать диалог
            </button>
            <p className="mx-persona-redesign__helper">
              История каждой роли хранится отдельно. Ничего не сбросится, если ты передумаешь.
            </p>
          </section>

          <div className="mx-persona-redesign__role-picker">
            <button
              type="button"
              className="mx-persona-redesign__choose-button"
              aria-expanded={roleMenuOpen}
              aria-controls="role-options"
              onClick={() => setRoleMenuOpen(open => !open)}
            >
              <span>Выбрать другую роль</span>
              <span aria-hidden="true">{roleMenuOpen ? '⌃' : '⌄'}</span>
            </button>
            {roleMenuOpen && (
              <div
                id="role-options"
                className="mx-persona-redesign__role-options"
                aria-label="Доступные роли"
              >
                {PERSONAS.map(persona => (
                  <RoleOption
                    key={persona.key}
                    persona={persona}
                    selected={persona.key === selected.key}
                    onSelect={chooseRole}
                  />
                ))}
              </div>
            )}
          </div>

          <div
            className="mx-persona-redesign__review-tools"
            aria-label="Инструменты проверки состояний"
          >
            <span>Owner review</span>
            <button type="button" onClick={() => openConversation(PERSONAS[0])}>
              История Собеседника
            </button>
            <button type="button" onClick={() => openConversation(PERSONAS[1])}>
              Empty Наставника
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected(PERSONAS[1])
                setConversationMode('loading')
                setScreen('conversation')
              }}
            >
              Loading/error
            </button>
          </div>
        </>
      ) : (
        <ConversationPreview
          persona={selected}
          mode={conversationMode}
          onBack={() => setScreen('home')}
          onChangeRole={() => {
            setScreen('home')
            setRoleMenuOpen(true)
          }}
          onModeChange={setConversationMode}
        />
      )}
    </section>
  )
}

export { PERSONAS }
