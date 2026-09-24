import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import { useEffect, useState } from 'react'
import { platform } from '../platform'
import { api } from '../lib/api'
import { invalidateTodayData } from '../lib/todayDataCache'
import { invalidatePracticesData } from '../lib/practicesDataCache'
import { createPortal } from 'react-dom'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import SemanticGlyph, { semanticKindForRitual } from '../components/SemanticGlyph'
import EmptyState from '../components/EmptyState'
import BackButton from '../components/BackButton'
import WebActionBar from '../components/WebActionBar'
import { useMainButton } from '../platform/telegram.hooks'
import { isLinkedWebWriteBlocked, LINKED_WEB_WRITE_NOTICE } from '../lib/webAuthLimits'
import '../components/practices/SceneLayout.css'

import PracticeDetail from '../components/PracticeDetail'
function CreateRitualScreen({ onCreate, onCancel }) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field) {
    return e => setDraft(d => ({ ...d, [field]: e.target.value }))
  }

  async function submit() {
    if (!draft.name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const result = await onCreate(draft)
      if (result?.error === 'linked_web_blocked') {
        setError(
          'Открой Mentalix в Telegram, чтобы создать ритуал — привязанному аккаунту это пока доступно только там.'
        )
      } else if (!result) {
        setError('Не получилось создать ритуал. Проверь соединение и попробуй ещё раз.')
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-emerald border border-cream/10 rounded-2xl px-4 py-3.5 text-[16px] text-cream placeholder-muted outline-none focus:border-gold/50 transition-colors'

  /*
   * Действие живёт в системной кнопке: она остаётся над
   * клавиатурой, а форма здесь целиком из полей ввода.
   */
  useMainButton({
    text: saving ? 'Сохраняю...' : 'Создать ритуал',
    onClick: submit,
    enabled: Boolean(draft.name.trim()) && !saving,
    loading: saving,
  })

  const webAction = {
    text: saving ? 'Сохраняю...' : 'Создать ритуал',
    onClick: submit,
    disabled: !draft.name.trim() || saving,
  }

  /*
   * Создание ритуала — форма с клавиатурой, поэтому живёт по
   * общему fullscreen-контракту: занимает весь экран целиком.
   */
  return createPortal(
    <div className={`${FULLSCREEN_SHELL_CLASS} mx-practice-flow`} style={surfaceStyle}>
      <div
        className={`${FULLSCREEN_HEADER_SLOT_CLASS} mx-practice-flow__header px-[var(--mx-screen-x)]`}
      >
        <div className="w-full max-w-md mx-auto">
          <BackButton onClick={onCancel} />
        </div>
      </div>

      <div className={`${FULLSCREEN_SCROLL_CLASS} mx-practice-flow__body practice-form__scroll`}>
        <div className="practice-form__inner w-full max-w-md mx-auto px-[var(--mx-screen-x)] flex flex-col">
          <div className="mb-8">
            <h2 className="font-display text-[24px] font-semibold text-cream lowercase">
              новый ритуал.
            </h2>
          </div>

          <div className="practice-form__fields mb-5">
            <input
              value={draft.name}
              onChange={set('name')}
              placeholder="Название ритуала"
              className={inputCls}
            />
            <input
              value={draft.goal}
              onChange={set('goal')}
              placeholder="Почему это важно для тебя"
              className={inputCls}
            />
            <input
              value={draft.min_version}
              onChange={set('min_version')}
              placeholder="Меньше нельзя"
              className={inputCls}
            />
            <input
              value={draft.optimal_version}
              onChange={set('optimal_version')}
              placeholder="На полную"
              className={inputCls}
            />
            <input
              value={draft.skip_consequence}
              onChange={set('skip_consequence')}
              placeholder="Цена пропуска"
              className={inputCls}
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-red-300 leading-relaxed mb-2">
              {error}
            </p>
          )}
        </div>
      </div>

      <WebActionBar action={webAction} />
    </div>,
    getFullscreenPortalTarget()
  )
}

export default function Rituals({ user, onBack }) {
  const [rituals, setRituals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [writeError, setWriteError] = useState(null)

  useEffect(() => {
    if (!user) return
    api.rituals
      .list(user.id)
      .then(setRituals)
      .catch(error => console.error(error))
      .finally(() => setLoading(false))
  }, [user])

  async function logRitual(ritualId, level) {
    try {
      const updated = await api.rituals.log(ritualId, user.id, level)
      setWriteError(null)
      setRituals(previous =>
        previous.map(ritual =>
          ritual.id === ritualId
            ? { ...ritual, ...updated, today_level: updated.today_level || level }
            : ritual
        )
      )
      setSelected(previous =>
        previous?.id === ritualId
          ? { ...previous, ...updated, today_level: updated.today_level || level }
          : previous
      )
      invalidateTodayData(user.id)
      invalidatePracticesData(user.id)
      return updated
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) setWriteError(LINKED_WEB_WRITE_NOTICE)
      return null
    }
  }

  async function createRitual(draft) {
    try {
      const ritual = await api.rituals.create(user.id, draft)
      setRituals(previous => [...previous, ritual])
      setShowCreate(false)
      return ritual
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) return { error: 'linked_web_blocked' }
      return null
    }
  }

  async function deleteRitual(ritualId) {
    try {
      await api.rituals.remove(ritualId)
      setRituals(previous => previous.filter(ritual => ritual.id !== ritualId))
      setSelected(null)
      setWriteError(null)
    } catch (error) {
      console.error(error)
      if (isLinkedWebWriteBlocked(user, error)) setWriteError(LINKED_WEB_WRITE_NOTICE)
    }
  }

  if (showCreate) return <CreateRitualScreen onCreate={createRitual} onCancel={() => setShowCreate(false)} />
  if (selected) {
    return (
      <PracticeDetail
        kind="ritual"
        practice={selected}
        onBack={() => setSelected(null)}
        onLog={logRitual}
        onDelete={deleteRitual}
      />
    )
  }

  return (
    <div className="mx-rituals-screen mx-practice-list-screen w-full max-w-md px-[var(--mx-screen-x)] animate-fade-in">
      <div className="flex items-center gap-3 mb-5 mx-rituals-screen__header">
        <BackButton onClick={onBack} />
        <h2 className="font-display text-[20px] text-cream lowercase">ритуалы.</h2>
      </div>
      <p className="mx-practice-list-screen__intro">обряды, что держат твой день</p>
      {writeError && <p role="alert" className="text-[12px] text-amber-200 mb-4">{writeError}</p>}
      {loading ? <p className="text-muted text-[13px]">Загрузка...</p> : rituals.length === 0 ? (
        <EmptyState glyph={<SemanticGlyph kind="ritual" className="w-full h-full" />}>
          <h3 className="font-display text-[16px] text-cream mb-1">Ритуалов пока нет</h3>
          <p className="text-[13px] text-muted mb-4">Создай первый ритуал.</p>
          <button onClick={() => setShowCreate(true)} className="cta-pill px-9 py-3.5 text-[13px]">Создать ритуал</button>
        </EmptyState>
      ) : (
        <div className="mx-practice-grid" data-testid="practice-grid">
          {rituals.map(ritual => (
            <button
              type="button"
              key={ritual.id}
              className={`mx-practice-tile ${ritual.today_level ? 'is-done' : ''}`}
              data-testid="practice-tile"
              data-done={Boolean(ritual.today_level)}
              onClick={() => { platform.haptic('light'); setSelected(ritual) }}
            >
              <span className="mx-practice-tile__glyph"><SemanticGlyph kind={semanticKindForRitual(ritual.name)} className="w-full h-full" /></span>
              <span className="mx-practice-tile__name">{ritual.name}</span>
            </button>
          ))}
        </div>
      )}
      {!loading && <button type="button" className="mx-practice-list-screen__create" onClick={() => setShowCreate(true)}>+ Новый ритуал</button>}
    </div>
  )
}
