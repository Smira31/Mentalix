import { useCallback, useEffect, useRef, useState } from 'react'

import Screen from '../../components/Screen'
import PillButton from '../../components/ui/PillButton'
import { illustrations } from '../../assets/illustrations'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import { api } from '../../lib/api'
import { findCell, DAIMON_FINAL_CELL } from '../../lib/daimonBoard'
import { formatCount } from '../../lib/pluralize'
import { GuestAiGate } from '../Mentalix'
import { useVoiceRecorder } from '../../lib/useVoiceRecorder'
import { Mic, Square, LoaderCircle } from 'lucide-react'
import {
  useVisualViewportGeometry,
  getKeyboardViewportHeight,
  isTelegramRuntime,
} from '../../lib/visualViewport'

import DaimonBoard from './DaimonBoard'
import './DaimonFlow.css'

/* ── Стадии ── */
// loading → intro → request → help → board → rolling → cell → saved → transition → finish → games → pathView

/* ── Лимиты текста ── */
const REQUEST_MAX = 500
const INSIGHT_MAX = 300
const COUNTER_LEAD = 50 // счётчик появляется за 50 символов до лимита

// Сервер отказывает гостю в ИИ: 403 guest_ai_forbidden.
function isGuestAiForbidden(error) {
  return error?.status === 403 || String(error?.message || '').includes('guest_ai_forbidden')
}

// Подсказка по сбою голоса: отказ в доступе к микрофону / не расслышали.
function voiceHint(kind) {
  return kind === 'denied'
    ? 'Нет доступа к микрофону — просто напиши текстом.'
    : 'Не расслышал, попробуй ещё раз или напиши.'
}

/* ── Гость без Telegram: ИИ недоступен, предлагаем сохранить прогресс ── */

/* Заглушка на время загрузки — без текста: «Загрузка…» мигала перед экранами
   Даймона и читалась как рывок. Показываем только фон, контент идёт следом. */
function Loading() {
  return <div className="mx-daimon-loading" role="status" aria-label="Загрузка" />
}

function ErrorView({ message, onRetry }) {
  return (
    <div className="mx-daimon-error">
      <p className="mx-daimon-error__text">
        {message || 'Не удалось загрузить. Попробуй ещё раз.'}
      </p>
      {onRetry && (
        <PillButton variant="light" onClick={onRetry} testId="daimon-retry">
          Повторить
        </PillButton>
      )}
    </div>
  )
}

/* ── Три шага игры (вход + «Как играть») ── */
function IntroSteps() {
  return (
    <ol className="mx-daimon-steps">
      <li className="mx-daimon-steps__item">
        <span className="mx-daimon-steps__num">1</span>
        <span className="mx-daimon-steps__text">Задай вопрос, который не даёт покоя.</span>
      </li>
      <li className="mx-daimon-steps__item">
        <span className="mx-daimon-steps__num">2</span>
        <span className="mx-daimon-steps__text">Брось кубик — попадёшь на клетку.</span>
      </li>
      <li className="mx-daimon-steps__item">
        <span className="mx-daimon-steps__num">3</span>
        <span className="mx-daimon-steps__text">Ответь Даймону и запиши, что увидел.</span>
      </li>
    </ol>
  )
}

/* ── Вход ── */
function IntroView({ onStart, onGames, hasGames }) {
  const IntroArt = illustrations.daimonIntro
  return (
    <div className="mx-daimon-intro">
      <div className="mx-daimon-intro__art" aria-hidden="true" data-testid="daimon-intro-art">
        {IntroArt ? <IntroArt /> : null}
      </div>
      <div className="mx-daimon-intro__body">
        <h1 className="mx-daimon-intro__title">Даймон</h1>
        <IntroSteps />
        <p className="mx-daimon-intro__note">
          Змеи тянут вниз, стрелы — вверх. Не терапия и не предсказание.
        </p>
      </div>
      <div className="mx-daimon-intro__actions">
        <PillButton variant="light" onClick={onStart} testId="daimon-start">
          Начать игру
        </PillButton>
        {hasGames && (
          <button
            type="button"
            className="mx-daimon-intro__link"
            onClick={onGames}
            data-testid="daimon-my-games"
          >
            Мои игры
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Как играть ── */
function HelpView({ onDone }) {
  const HelpArt = illustrations.daimonHowTo
  return (
    <div className="mx-daimon-help" data-testid="daimon-help">
      <div className="mx-daimon-help__art" aria-hidden="true" data-testid="daimon-howto-art">
        {HelpArt ? <HelpArt /> : null}
      </div>
      <div className="mx-daimon-help__body">
        <h1 className="mx-daimon-help__title">Как играть</h1>
        <IntroSteps />
        <p className="mx-daimon-help__text">
          Змеи тянут вниз, стрелы — вверх: попадёшь на змею — спустишься, на стрелу — поднимешься.
        </p>
        <p className="mx-daimon-help__text">В день — 3 броска.</p>
      </div>
      <div className="mx-daimon-help__actions">
        <PillButton variant="light" onClick={onDone} testId="daimon-help-done">
          Понятно
        </PillButton>
      </div>
    </div>
  )
}

/* ── Запрос ── */
function RequestView({ request, setRequest, onSubmit, onBack, error, creating }) {
  const fieldRef = useRef(null)
  const viewportGeometry = useVisualViewportGeometry()
  const keyboardOpen =
    viewportGeometry?.height != null &&
    typeof window !== 'undefined' &&
    window.innerHeight - viewportGeometry.height > 80

  useEffect(() => {
    const focus = () => fieldRef.current?.focus({ preventScroll: true })
    const frame = window.requestAnimationFrame(focus)
    const retry = window.setTimeout(focus, 80)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
    }
  }, [])

  const hasText = request.trim().length > 0
  const overLimit = request.length > REQUEST_MAX

  const keyboardViewportHeight = getKeyboardViewportHeight({
    isTelegram: isTelegramRuntime(),
    stableHeight: viewportGeometry?.stableHeight,
    visualHeight: viewportGeometry?.height,
  })

  const roundStyle = keyboardOpen
    ? {
        position: 'fixed',
        top: `${(keyboardViewportHeight ?? viewportGeometry?.height) + (viewportGeometry?.offsetTop || 0) - 56}px`,
        right: 'var(--mx-screen-x)',
        bottom: 'auto',
        zIndex: 71,
      }
    : {
        position: 'fixed',
        bottom: 'calc(var(--app-safe-bottom) + var(--mx-space-4))',
        right: 'var(--mx-screen-x)',
        zIndex: 71,
      }

  return (
    <>
      <div className="mx-daimon-request">
        <h2 className="mx-daimon-request__title">С чем ты приходишь?</h2>
        <textarea
          ref={fieldRef}
          className="mx-daimon-request__field"
          value={request}
          onChange={e => setRequest(e.target.value)}
          placeholder="Например: не понимаю, куда двигаться"
          aria-label="Запрос для игры Даймон"
          data-testid="daimon-request-input"
        />
        {request.length >= REQUEST_MAX - COUNTER_LEAD && (
          <span
            className={`mx-daimon-counter${overLimit ? ' mx-daimon-counter--over' : ''}`}
            data-testid="daimon-request-counter"
          >
            {request.length}/{REQUEST_MAX}
          </span>
        )}
        {error && (
          <p className="mx-daimon-error__text" data-testid="daimon-request-error">
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={hasText ? 'Отправить запрос' : 'Назад'}
        data-testid="daimon-request-submit"
        onClick={hasText ? onSubmit : onBack}
        disabled={creating || (hasText && (overLimit || request.trim().length < 3))}
        className="mx-daimon-round-btn"
        style={roundStyle}
      >
        {creating ? <LoaderCircle size={20} className="animate-spin" /> : hasText ? '✓' : '✕'}
      </button>
    </>
  )
}

/* ── Шторка клетки ── */
function CellSheet({ n, board, game, onClose }) {
  const touchStartRef = useRef(null)
  const cell = findCell(board, n)
  if (!cell) return null
  const snakeTo = cell.snake_to ? findCell(board, cell.snake_to) : null
  const arrowTo = cell.arrow_to ? findCell(board, cell.arrow_to) : null
  const passedMove = game?.moves?.find(m => m.to === n && (m.insight || m.skipped))

  function onTouchStart(e) {
    const t = e.touches[0]
    touchStartRef.current = { x: t.clientX, y: t.clientY }
  }

  // Закрытие свайпом вниз по шторке (обработчик на самой панели, не на документе).
  function onTouchEnd(e) {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (dy > 64 && Math.abs(dy) > Math.abs(dx)) onClose()
  }

  return (
    <div className="mx-daimon-sheet" data-testid="daimon-cell-sheet" onClick={onClose}>
      <div
        className="mx-daimon-sheet__panel"
        role="dialog"
        aria-label={`Клетка ${cell.n}: ${cell.title}`}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <span
          className="mx-daimon-sheet__handle"
          aria-hidden="true"
          data-testid="daimon-sheet-handle"
        />
        <span className="mx-daimon-sheet__num">Клетка {cell.n}</span>
        <h3 className="mx-daimon-sheet__title">{cell.title}</h3>
        <p className="mx-daimon-sheet__meaning">{cell.meaning}</p>
        {snakeTo && (
          <p className="mx-daimon-sheet__lead" data-testid="daimon-sheet-lead">
            Змея ↓ {snakeTo.n} · {snakeTo.title}
          </p>
        )}
        {arrowTo && (
          <p className="mx-daimon-sheet__lead" data-testid="daimon-sheet-lead">
            Стрела ↑ {arrowTo.n} · {arrowTo.title}
          </p>
        )}
        {passedMove && (
          <div className="mx-daimon-sheet__insight" data-testid="daimon-sheet-insight">
            <span className="mx-daimon-sheet__insight-label">Ты увидел:</span>
            {passedMove.skipped ? (
              <p className="mx-daimon-sheet__insight-skip">Клетка пропущена</p>
            ) : (
              <blockquote className="mx-daimon-sheet__insight-quote">
                {passedMove.insight}
              </blockquote>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Поле ── */
function BoardView({
  game,
  board,
  onRoll,
  onContinueCell,
  onHelp,
  onOpenPath,
  onNewGame,
  throwsLeft,
  paywallMessage,
  walking = false,
  piecePosition,
  rolling = false,
  bounce = null,
}) {
  const [sheetCell, setSheetCell] = useState(null)

  const passedCells = new Set(
    game.moves.filter(m => m.insight || m.skipped || m.via).map(m => m.cell)
  )
  const passedCount = game.moves.filter(m => m.insight || m.skipped).length
  const pendingMove = game.moves.find(m => m.id === game.pending_move_id)
  const pendingCellNum = pendingMove?.to
  const pendingCellTitle = pendingMove ? findCell(board, pendingMove.to)?.title : null
  const pos = piecePosition ?? game.position
  const posCell = pos > 0 ? findCell(board, pos) : null

  return (
    <div className="mx-daimon-board-view">
      <div className="mx-daimon-board__top">
        <div className="mx-daimon-board__request-block">
          <span className="mx-daimon-board__request-label">Твой запрос</span>
          <p className="mx-daimon-board__request" data-testid="daimon-request-preview">
            {game.request}
          </p>
        </div>
        <button
          type="button"
          className="mx-daimon-board__help"
          aria-label="Как играть"
          data-testid="daimon-help"
          onClick={onHelp}
        >
          ?
        </button>
      </div>

      <DaimonBoard
        board={board}
        position={pos}
        passedCells={passedCells}
        onSelectCell={setSheetCell}
      />

      <div className="mx-daimon-board__position" data-testid="daimon-position">
        {posCell ? `Ты здесь: ${pos} · ${posCell.title}` : 'Начни с броска кубика'}
      </div>

      {bounce != null && !walking && (
        <p className="mx-daimon-board__bounce" data-testid="daimon-bounce">
          Отскок на {bounce}
        </p>
      )}

      {!walking && (
        <div className="mx-daimon-board__actions">
          {paywallMessage ? (
            <p className="mx-daimon-board__paywall" data-testid="daimon-paywall">
              {paywallMessage}
            </p>
          ) : pendingMove ? (
            <PillButton variant="light" onClick={onContinueCell} testId="daimon-continue-cell">
              Продолжить клетку {pendingCellNum}
              {pendingCellTitle ? ` · ${pendingCellTitle}` : ''}
            </PillButton>
          ) : (
            <PillButton
              variant="light"
              onClick={onRoll}
              testId="daimon-roll"
              disabled={throwsLeft <= 0 || rolling}
            >
              {rolling ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                    data-testid="daimon-roll-spinner"
                  />
                  Бросаем…
                </>
              ) : (
                'Бросить кубик'
              )}
            </PillButton>
          )}
          {!paywallMessage && !pendingMove && (
            <>
              <p className="mx-daimon-board__throws" data-testid="daimon-throws-left">
                {throwsLeft <= 0
                  ? 'На сегодня всё. Возвращайся завтра — Даймон подождёт.'
                  : `Осталось бросков сегодня: ${throwsLeft}`}
              </p>
              {passedCount > 0 && (
                <button
                  type="button"
                  className="mx-daimon-board__path-link"
                  onClick={onOpenPath}
                  data-testid="daimon-path-link"
                >
                  Твой путь · {formatCount(passedCount, ['клетка', 'клетки', 'клеток'])}
                </button>
              )}
              <button
                type="button"
                className="mx-daimon-board__path-link"
                onClick={onNewGame}
                data-testid="daimon-board-new-game"
              >
                Новая игра
              </button>
            </>
          )}
        </div>
      )}

      {sheetCell && (
        <CellSheet n={sheetCell} board={board} game={game} onClose={() => setSheetCell(null)} />
      )}
    </div>
  )
}

/* ── Бросок ── */
function RollingView({ roll }) {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  return (
    <div className="mx-daimon-roll" data-testid="daimon-rolling">
      <div
        className={`mx-daimon-dice${!reduceMotion ? ' mx-daimon-dice--rolling' : ''}`}
        data-testid="daimon-dice"
      >
        {roll || '?'}
      </div>
      <p className="mx-daimon-roll__label">Бросок…</p>
    </div>
  )
}

/* ── Клетка (разговор + вывод) ── */
function CellView({ game, board, userId, onInsight, onBackToBoard, onGuestLogin, bounce }) {
  const pendingMove = game.moves.find(m => m.id === game.pending_move_id)
  const cellNum = pendingMove?.to || game.position
  const cell = findCell(board, cellNum)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [askInsight, setAskInsight] = useState(false)
  const [insightText, setInsightText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  // Последнее неотправленное сообщение: по «Повторить» отправляем его же.
  const [failed, setFailed] = useState(null)
  // crisis:true — Даймон отвечает про поддержку, вывод клетки не спрашиваем.
  const [crisis, setCrisis] = useState(false)
  const [guestForbidden, setGuestForbidden] = useState(false)
  const chatEndRef = useRef(null)
  const insightRef = useRef(null)
  const firstQuestionSent = useRef(false)

  const sendingRef = useRef(false)

  const chatVoice = useVoiceRecorder({
    userId,
    onTranscript: text => setInput(text),
    disabled: sending,
  })

  const insightVoice = useVoiceRecorder({
    userId,
    onTranscript: text => setInsightText(text),
    disabled: sending,
  })

  // Auto-send first question on mount
  useEffect(() => {
    if (firstQuestionSent.current) return
    firstQuestionSent.current = true
    void sendChat('')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Автофокус на поле вывода
  useEffect(() => {
    if (!askInsight) return
    const focus = () => insightRef.current?.focus({ preventScroll: true })
    const frame = window.requestAnimationFrame(focus)
    const retry = window.setTimeout(focus, 80)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
    }
  }, [askInsight])

  async function sendChat(text) {
    if (sendingRef.current) return
    sendingRef.current = true
    setSending(true)
    setError('')
    setFailed(null)
    try {
      const res = await api.daimon.chat(userId, text)
      setMessages(prev => [
        ...(text ? [...prev, { role: 'user', content: text }] : prev),
        { role: 'assistant', content: res.reply },
      ])
      setAskInsight(res.ask_insight)
      setCrisis(Boolean(res.crisis))
      setInput('')
    } catch (err) {
      if (isGuestAiForbidden(err)) {
        setGuestForbidden(true)
        return
      }
      // Текст не теряем: он остаётся в поле, а «Повторить» шлёт то же сообщение.
      setFailed({ text })
      setError('Даймон не ответил. Попробуй ещё раз')
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  async function submitInsight(skip = false) {
    if (sendingRef.current) return
    if (!skip && !insightText.trim()) return
    if (!skip && insightText.length > INSIGHT_MAX) return
    sendingRef.current = true
    setSending(true)
    setError('')
    try {
      await onInsight(skip ? '' : insightText.trim(), skip)
    } catch (err) {
      setError(
        err?.status === 422 ? 'Вывод слишком длинный — сократи его.' : 'Не удалось сохранить вывод.'
      )
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  if (!cell) return <Loading />

  // Гость в вебе: сервер отказал в ИИ — предлагаем сохранить прогресс.
  if (guestForbidden)
    return (
      <GuestAiGate
        onLogin={onGuestLogin}
        message="Чтобы говорить с Даймоном, сохрани прогресс"
        buttonLabel="Сохранить прогресс"
        testId="daimon-guest-gate"
        buttonTestId="daimon-guest-gate-button"
      />
    )

  const hasText = input.trim().length > 0
  const hasInsightText = insightText.trim().length > 0
  const overInsight = insightText.length > INSIGHT_MAX
  const activeVoice = askInsight ? insightVoice : chatVoice

  const tag = cell.snake_to
    ? { label: 'Клетка-ловушка', mod: 'snake' }
    : cell.arrow_to
      ? { label: 'Клетка силы', mod: 'arrow' }
      : null

  if (askInsight && !crisis) {
    return (
      <div className="mx-daimon-insight" data-testid="daimon-insight">
        <div className="mx-daimon-insight__top">
          <span className="mx-daimon-insight__cell" data-testid="daimon-insight-top">
            Клетка {cellNum} · {cell.title}
          </span>
          <button
            type="button"
            className="mx-daimon-insight__skip"
            onClick={() => submitInsight(true)}
            disabled={sending}
            data-testid="daimon-skip"
          >
            Пропустить клетку
          </button>
        </div>
        <h2 className="mx-daimon-insight__question">Что ты увидел на этой клетке?</h2>
        <p className="mx-daimon-insight__hint">Одной фразой</p>
        <textarea
          ref={insightRef}
          className="mx-daimon-insight__field"
          value={insightText}
          onChange={e => setInsightText(e.target.value)}
          placeholder="Например: я боюсь не провала, а что скажут"
          aria-label="Что ты увидел на этой клетке"
          data-testid="daimon-insight-input"
          rows={1}
        />
        {insightText.length >= INSIGHT_MAX - COUNTER_LEAD && (
          <span
            className={`mx-daimon-counter${overInsight ? ' mx-daimon-counter--over' : ''}`}
            data-testid="daimon-insight-counter"
          >
            {insightText.length}/{INSIGHT_MAX}
          </span>
        )}
        {error && <p className="mx-daimon-error__text">{error}</p>}
        {activeVoice.voiceErrorKind && activeVoice.voiceState === 'idle' && (
          <p className="mx-daimon-voice-status__err" data-testid="daimon-insight-voice-error">
            {voiceHint(activeVoice.voiceErrorKind)}
          </p>
        )}
        <div className="mx-daimon-insight__actions">
          {!hasInsightText && insightVoice.voiceErrorKind !== 'denied' && (
            <button
              type="button"
              aria-label="Записать голос"
              data-testid="daimon-insight-mic"
              className="mx-daimon-mic-btn"
              onPointerDown={e => {
                e.preventDefault()
                insightVoice.startRecording()
              }}
              onPointerUp={e => {
                e.preventDefault()
                insightVoice.stopRecording()
              }}
              onPointerLeave={() => insightVoice.stopRecording()}
              onPointerCancel={() => insightVoice.stopRecording()}
              onContextMenu={e => e.preventDefault()}
              disabled={sending || insightVoice.voiceState === 'transcribing'}
              style={{ touchAction: 'none' }}
            >
              {insightVoice.voiceState === 'recording' ? (
                <Square size={18} fill="currentColor" />
              ) : insightVoice.voiceState === 'transcribing' ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                <Mic size={22} />
              )}
            </button>
          )}
          {hasInsightText && (
            <button
              type="button"
              aria-label="Сохранить вывод"
              data-testid="daimon-insight-submit"
              onClick={() => submitInsight(false)}
              disabled={sending || overInsight}
              className="mx-daimon-round-btn"
            >
              {sending ? <LoaderCircle size={20} className="animate-spin" /> : '✓'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-daimon-cell-view">
      <div className="mx-daimon-cell__header">
        <span className="mx-daimon-cell__number">Клетка {cellNum}</span>
        <h2 className="mx-daimon-cell__title" data-testid="daimon-cell-title">
          {cell.title}
        </h2>
        <p className="mx-daimon-cell__meaning">{cell.meaning}</p>
        {tag && (
          <span className={`mx-daimon-cell__tag mx-daimon-cell__tag--${tag.mod}`}>{tag.label}</span>
        )}
      </div>

      {bounce != null && (
        <p className="mx-daimon-board__bounce" data-testid="daimon-bounce">
          Отскок на {bounce}
        </p>
      )}
      <div className="mx-daimon-chat" data-testid="daimon-chat">
        {messages.map((msg, i) => (
          <div key={i} className={`mx-daimon-chat__msg mx-daimon-chat__msg--${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {sending && !askInsight && (
          <p className="mx-daimon-chat__thinking" data-testid="daimon-thinking">
            Даймон думает…
          </p>
        )}
        <div ref={chatEndRef} />
      </div>

      {error && (
        <div className="mx-daimon-chat__error" data-testid="daimon-chat-error">
          <p className="mx-daimon-chat__error-text">{error}</p>
          {failed && (
            <button
              type="button"
              className="mx-daimon-chat__retry"
              data-testid="daimon-chat-retry"
              onClick={() => sendChat(failed.text)}
              disabled={sending}
            >
              Повторить
            </button>
          )}
        </div>
      )}

      {(chatVoice.voiceState !== 'idle' || chatVoice.voiceErrorKind) && (
        <div className="mx-daimon-voice-status">
          {chatVoice.voiceState === 'recording' && (
            <span className="mx-daimon-voice-status__rec">
              Запись · 0:{String(chatVoice.voiceSeconds).padStart(2, '0')} · отпусти кнопку
            </span>
          )}
          {chatVoice.voiceState === 'transcribing' && (
            <span className="mx-daimon-voice-status__trans">Распознаю голос…</span>
          )}
          {chatVoice.voiceErrorKind && chatVoice.voiceState === 'idle' && (
            <span className="mx-daimon-voice-status__err" data-testid="daimon-chat-voice-error">
              {voiceHint(chatVoice.voiceErrorKind)}
            </span>
          )}
        </div>
      )}

      {crisis ? (
        <div className="mx-daimon-crisis" data-testid="daimon-crisis">
          <p className="mx-daimon-crisis__note">
            Если сейчас тяжело — напиши близкому человеку или в службу помощи
          </p>
          <PillButton variant="transparent" onClick={onBackToBoard} testId="daimon-crisis-back">
            Вернуться к полю
          </PillButton>
        </div>
      ) : (
        <div className="mx-daimon-chat__input-row" data-testid="daimon-chat-row">
          <textarea
            className="mx-daimon-chat__input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ответь Даймону…"
            aria-label="Ответ в разговоре Даймона"
            data-testid="daimon-chat-input"
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (hasText) void sendChat(input.trim())
              }
            }}
          />
          {!hasText && chatVoice.voiceErrorKind !== 'denied' ? (
            <button
              type="button"
              aria-label="Записать голос"
              data-testid="daimon-chat-mic"
              className="mx-daimon-mic-btn"
              onPointerDown={e => {
                e.preventDefault()
                chatVoice.startRecording()
              }}
              onPointerUp={e => {
                e.preventDefault()
                chatVoice.stopRecording()
              }}
              onPointerLeave={() => chatVoice.stopRecording()}
              onPointerCancel={() => chatVoice.stopRecording()}
              onContextMenu={e => e.preventDefault()}
              disabled={sending || chatVoice.voiceState === 'transcribing'}
              style={{ touchAction: 'none' }}
            >
              {chatVoice.voiceState === 'recording' ? (
                <Square size={18} fill="currentColor" />
              ) : chatVoice.voiceState === 'transcribing' ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                <Mic size={22} />
              )}
            </button>
          ) : (
            <button
              type="button"
              aria-label="Отправить"
              data-testid="daimon-chat-send"
              onClick={() => sendChat(input.trim())}
              disabled={sending || !hasText}
              className="mx-daimon-round-btn"
            >
              ✓
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Записано (короткий отклик на вывод) ── */
function SavedView({ quote }) {
  return (
    <div className="mx-daimon-saved" data-testid="daimon-saved">
      <p className="mx-daimon-saved__label">Записано</p>
      {quote && <blockquote className="mx-daimon-saved__quote">{quote}</blockquote>}
    </div>
  )
}

/* ── Переход (змея/стрела) ── */
function TransitionView({ via, fromTitle, toTitle, position }) {
  const isSnake = via === 'snake'
  return (
    <div className="mx-daimon-transition" data-testid="daimon-transition">
      <span
        className={`mx-daimon-transition__piece${isSnake ? ' mx-daimon-transition__piece--down' : ' mx-daimon-transition__piece--up'}`}
        aria-hidden="true"
      />
      <p className="mx-daimon-transition__text">
        {isSnake ? 'Змея' : 'Стрела'}: {fromTitle} {isSnake ? '↓' : '↑'} {toTitle}
      </p>
      <p className="mx-daimon-transition__sub">
        {position === DAIMON_FINAL_CELL ? 'Ты дошёл до Даймона' : 'Продолжай путь'}
      </p>
    </div>
  )
}

/* ── Твой путь: запрос и список пройденных клеток (общий для поля и финала) ── */
function DaimonPath({ game, board }) {
  const moves = game.moves.filter(m => m.insight || m.skipped)

  return (
    <>
      <div className="mx-daimon-path__request">
        <span className="mx-daimon-path__request-label">Твой запрос</span>
        <p className="mx-daimon-path__request-text">{game.request}</p>
      </div>
      <div className="mx-daimon-finish__path-heading">Твой путь</div>
      <div className="mx-daimon-finish__path" data-testid="daimon-path">
        {moves.map((m, i) => {
          const cell = findCell(board, m.to)
          return (
            <div key={i} className="mx-daimon-finish__path-item">
              <span className="mx-daimon-finish__path-num">{m.to}</span>
              <div className="mx-daimon-finish__path-body">
                <span className="mx-daimon-finish__path-title">
                  {cell?.title || `Клетка ${m.to}`}
                  {m.via && (
                    <span className="mx-daimon-finish__path-via">
                      {m.via === 'snake' ? `↓ ${m.via_to}` : `↑ ${m.via_to}`}
                    </span>
                  )}
                </span>
                {m.skipped ? (
                  <span className="mx-daimon-finish__path-skipped">Пропущено</span>
                ) : (
                  <p className="mx-daimon-finish__path-insight">{m.insight}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ── Финиш ── */
function FinishView({
  game,
  board,
  onSummary,
  onNewGame,
  onGames,
  onClose,
  summary,
  summaryLoading = false,
  summaryError = false,
}) {
  return (
    <div className="mx-daimon-finish" data-testid="daimon-finish">
      <div className="mx-daimon-finish__art" aria-hidden="true" data-testid="daimon-finish-art" />
      <h1 className="mx-daimon-finish__title">Ты дошёл до Даймона</h1>
      {summary && (
        <p className="mx-daimon-finish__summary" data-testid="daimon-summary">
          {summary}
        </p>
      )}
      <DaimonPath game={game} board={board} />
      <div className="mx-daimon-finish__actions">
        {summaryError ? (
          <div className="mx-daimon-finish__summary-error" data-testid="daimon-summary-error">
            <p className="mx-daimon-error__text">Не удалось создать итог.</p>
            <PillButton
              variant="light"
              onClick={onSummary}
              testId="daimon-summary-retry"
              disabled={summaryLoading}
            >
              Повторить
            </PillButton>
          </div>
        ) : !summary ? (
          <PillButton
            variant="light"
            onClick={onSummary}
            testId="daimon-summary-btn"
            disabled={summaryLoading}
          >
            {summaryLoading ? (
              <>
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                  data-testid="daimon-summary-spinner"
                />
                Собираем…
              </>
            ) : (
              'Взгляд сверху'
            )}
          </PillButton>
        ) : null}
        <PillButton variant="transparent" onClick={onNewGame} testId="daimon-new-game">
          Новая игра
        </PillButton>
        <PillButton variant="transparent" onClick={onGames} testId="daimon-finish-games">
          Мои игры
        </PillButton>
        <PillButton variant="transparent" onClick={onClose} testId="daimon-done">
          Готово
        </PillButton>
      </div>
    </div>
  )
}

/* ── Мои игры ── */
function GamesView({ games, onOpen, onNewGame }) {
  if (!games || games.length === 0) {
    return (
      <div className="mx-daimon-games">
        <h1 className="mx-daimon-games__title">Мои игры</h1>
        <p className="mx-daimon-games__empty">Пока нет завершённых игр.</p>
        <PillButton variant="light" onClick={onNewGame} testId="daimon-games-new-game">
          Новая игра
        </PillButton>
      </div>
    )
  }
  return (
    <div className="mx-daimon-games" data-testid="daimon-games-list">
      <h1 className="mx-daimon-games__title">Мои игры</h1>
      {games.map(g => {
        const cellsCount = g.moves.filter(m => m.insight || m.skipped).length
        const date = g.created_at ? new Date(g.created_at).toLocaleDateString('ru-RU') : ''
        return (
          <button
            key={g.id}
            type="button"
            className="mx-daimon-games__item"
            onClick={() => onOpen(g)}
            data-testid={`daimon-game-${g.id}`}
          >
            <span className="mx-daimon-games__item-request">{g.request}</span>
            <span className="mx-daimon-games__item-meta">
              {date} · {g.status === 'finished' ? 'Завершена' : 'Активна'} ·{' '}
              {formatCount(cellsCount, ['клетка', 'клетки', 'клеток'])}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Подтверждение новой игры, когда текущая ещё активна ── */
function NewGameConfirm({ onConfirm, onCancel }) {
  return (
    <div className="mx-daimon-confirm" data-testid="daimon-new-game-confirm" onClick={onCancel}>
      <div
        className="mx-daimon-confirm__panel"
        role="dialog"
        aria-label="Начать новую игру"
        onClick={e => e.stopPropagation()}
      >
        <p className="mx-daimon-confirm__text">Текущая игра закончится. Начать новую?</p>
        <div className="mx-daimon-confirm__actions">
          <PillButton variant="light" onClick={onConfirm} testId="daimon-new-game-confirm-yes">
            Начать новую
          </PillButton>
          <PillButton variant="transparent" onClick={onCancel} testId="daimon-new-game-cancel">
            Отмена
          </PillButton>
        </div>
      </div>
    </div>
  )
}

/* ── Просмотр пути (только чтение) ── */
function PathView({ game, board }) {
  return (
    <div className="mx-daimon-finish" data-testid="daimon-path-view">
      <DaimonPath game={game} board={board} />
    </div>
  )
}

/*
 * Заголовки Даймона набраны Lora. Кириллические начертания предзагружены в
 * index.html, а запасной сериф подогнан по метрикам Lora (@font-face
 * 'Lora Fallback' в index.css), поэтому подмена шрифта текст не двигает.
 * Этот гейт — только страховка на случай медленной сети: ждём загрузку
 * максимум 300 мс и дальше рендерим в любом случае.
 */
const SERIF_GATE_MS = 300

function useSerifReady() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const done = () => {
      if (!cancelled) setReady(true)
    }
    const fonts = typeof document !== 'undefined' ? document.fonts : null
    if (!fonts?.load) {
      done()
      return undefined
    }
    const guard = window.setTimeout(done, SERIF_GATE_MS)
    Promise.all([
      fonts.load('500 1rem Lora', 'Даймон'),
      fonts.load('600 1rem Lora', 'Даймон'),
      fonts.load('700 1rem Lora', 'Даймон'),
    ]).then(done, done)
    return () => {
      cancelled = true
      window.clearTimeout(guard)
    }
  }, [])

  return ready
}

/* ── Главный компонент ── */
export default function DaimonFlow({ userId, onClose, onGuestLogin }) {
  const [board, setBoard] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [games, setGames] = useState([])
  const [stage, setStage] = useState('loading')
  const [request, setRequest] = useState('')
  const [error, setError] = useState(null)
  const [rollValue, setRollValue] = useState(null)
  const [transition, setTransition] = useState(null)
  const [summary, setSummary] = useState(null)
  const [savedQuote, setSavedQuote] = useState('')
  const [walk, setWalk] = useState(null)
  const [viewedGame, setViewedGame] = useState(null)
  const [pathSource, setPathSource] = useState('games')
  const [creating, setCreating] = useState(false)
  const creatingRef = useRef(false)
  const summaryRef = useRef(false)
  const [rolling, setRolling] = useState(false)
  const [bounce, setBounce] = useState(null)
  const [confirmNewGame, setConfirmNewGame] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState(false)

  // Жёсткая защита от двойного тапа по «Бросить кубик» (state не успевает обновиться).
  const rollingRef = useRef(false)
  const helpShownRef = useRef(false)
  const timersRef = useRef([])
  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }, [])

  useEffect(
    () => () => {
      timersRef.current.forEach(window.clearTimeout)
      timersRef.current = []
    },
    []
  )

  const fetchState = useCallback(async () => {
    try {
      const [boardRes, stateRes, gamesRes] = await Promise.all([
        api.daimon.board(),
        api.daimon.state(userId),
        api.daimon.games(userId).catch(() => []),
      ])
      setBoard(boardRes)
      setGameState(stateRes)
      setGames(Array.isArray(gamesRes) ? gamesRes : [])
      setError(null)
      if (!stateRes.game) {
        setStage('intro')
      } else if (stateRes.game.status === 'finished') {
        setStage('finish')
      } else {
        setStage('board')
      }
    } catch (err) {
      setError(err?.message || 'Не удалось загрузить')
      setStage('error')
    }
  }, [userId])

  useEffect(() => {
    void fetchState()
  }, [fetchState])

  // Анимация фишки по клеткам после броска
  useEffect(() => {
    if (!walk) return
    if (walk.current >= walk.to) {
      const id = window.setTimeout(() => {
        setWalk(null)
        setStage('cell')
      }, 250)
      return () => window.clearTimeout(id)
    }
    const id = window.setTimeout(
      () => setWalk(w => (w ? { ...w, current: w.current + 1 } : w)),
      130
    )
    return () => window.clearTimeout(id)
  }, [walk])

  const fetchGames = useCallback(async () => {
    try {
      const res = await api.daimon.games(userId)
      setGames(res)
    } catch {
      setGames([])
    }
  }, [userId])

  const goBack = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []
    setWalk(null)
    if (stage === 'request') {
      setStage('intro')
    } else if (stage === 'help') {
      setStage(gameState?.game ? 'board' : 'intro')
    } else if (stage === 'cell') {
      setStage('board')
    } else if (stage === 'saved' || stage === 'transition') {
      setTransition(null)
      setStage('board')
    } else if (stage === 'games') {
      setStage('intro')
    } else if (stage === 'pathView') {
      setStage(pathSource === 'board' ? 'board' : 'games')
    } else {
      onClose()
    }
    platform.haptic('light')
  }, [stage, gameState, pathSource, onClose])

  useBackButton(goBack)

  async function handleCreateGame() {
    const trimmed = request.trim()
    if (creatingRef.current || trimmed.length < 3 || request.length > REQUEST_MAX) return
    creatingRef.current = true
    setCreating(true)
    setError(null)
    try {
      const res = await api.daimon.createGame(userId, trimmed)
      setGameState(res)
      platform.haptic('success')
      // Первая игра — показываем «Как играть» один раз после ввода запроса.
      if (!helpShownRef.current) {
        helpShownRef.current = true
        setStage('help')
      } else {
        setStage('board')
      }
    } catch (err) {
      setError(
        err?.status === 422
          ? 'Запрос должен содержать от 3 до 500 символов'
          : 'Не удалось начать игру. Попробуй ещё раз.'
      )
    } finally {
      creatingRef.current = false
      setCreating(false)
    }
  }

  async function handleRoll() {
    if (rollingRef.current) return
    rollingRef.current = true
    setRolling(true)
    setBounce(null)
    try {
      const from = gameState?.game?.position ?? 0
      const res = await api.daimon.roll(userId)
      const lastMove = res.game.moves[res.game.moves.length - 1]
      setRollValue(lastMove?.roll)
      // Перебор через 36 — фишка отскакивает назад, показываем «Отскок на N».
      if (lastMove && lastMove.from + lastMove.roll > DAIMON_FINAL_CELL) {
        setBounce(res.game.position)
      }
      setGameState(res)
      setStage('rolling')
      platform.haptic('light')

      const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      const diceDelay = reduceMotion ? 400 : 600
      later(() => {
        const to = res.game.position
        if (reduceMotion || to <= from) {
          setStage('cell')
        } else {
          setWalk({ to, current: from + 1 })
          setStage('board')
        }
      }, diceDelay)
    } catch (err) {
      if (err?.status === 429) {
        setError('На сегодня всё. Возвращайся завтра — Даймон подождёт.')
        setStage('board')
      } else if (err?.status === 409) {
        // Локальное поле могло устареть: сначала получаем pending-клетку.
        try {
          const current = await api.daimon.state(userId)
          setGameState(current)
          setError(null)
          setStage(current.game?.pending_move_id ? 'cell' : 'board')
        } catch {
          setError('Не удалось загрузить незакрытую клетку. Попробуй ещё раз.')
        }
      } else {
        setError('Не удалось бросить кубик')
      }
    } finally {
      rollingRef.current = false
      setRolling(false)
    }
  }

  async function handleInsight(text, skip) {
    const res = await api.daimon.insight(userId, text, skip)
    setGameState(res)

    const lastClosed = [...res.game.moves].reverse().find(m => m.insight || m.skipped)

    const proceed = () => {
      if (lastClosed?.via) {
        const fromCell = findCell(board, lastClosed.to)
        const toCell = findCell(board, lastClosed.via_to)
        setTransition({
          via: lastClosed.via,
          fromTitle: fromCell?.title,
          toTitle: toCell?.title,
          position: res.game.position,
        })
        setStage('transition')
        platform.haptic('success')
        const reduceMotion =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
        later(
          () => {
            setTransition(null)
            setStage(res.game.position === DAIMON_FINAL_CELL ? 'finish' : 'board')
          },
          reduceMotion ? 400 : 1600
        )
      } else if (res.game.position === DAIMON_FINAL_CELL || res.game.status === 'finished') {
        setStage('finish')
        platform.haptic('success')
      } else {
        setStage('board')
        platform.haptic('success')
      }
    }

    if (skip) {
      proceed()
      return
    }

    setSavedQuote(text.trim())
    setStage('saved')
    // Короткий отклик «Записано» — ~1,2 с, независимо от reduced motion.
    later(proceed, 1200)
  }

  async function handleSummary() {
    if (summaryRef.current) return
    summaryRef.current = true
    setSummaryLoading(true)
    setSummaryError(false)
    try {
      const res = await api.daimon.summary(userId, gameState?.game?.id)
      setSummary(res.summary)
    } catch {
      setSummaryError(true)
    } finally {
      summaryRef.current = false
      setSummaryLoading(false)
    }
  }

  function startNewGame() {
    setConfirmNewGame(false)
    setError(null)
    setRequest('')
    setSummary(null)
    setSummaryError(false)
    setSavedQuote('')
    setBounce(null)
    setGameState(null)
    setStage('intro')
    platform.haptic('light')
  }

  // Активную игру не бросаем молча — сначала подтверждение.
  function handleNewGame() {
    if (gameState?.game && gameState.game.status !== 'finished') {
      setConfirmNewGame(true)
      return
    }
    startNewGame()
  }

  async function handleOpenGames() {
    await fetchGames()
    setPathSource('games')
    setStage('games')
  }

  function handleOpenPath() {
    if (!gameState?.game) return
    setViewedGame(gameState.game)
    setPathSource('board')
    setStage('pathView')
    platform.haptic('light')
  }

  const throwsLeft = gameState?.game ? gameState.game.throws_limit - gameState.game.throws_today : 0
  const paywallEnabled = gameState?.game?.paywall_enabled
  const position = gameState?.game?.position || 0
  const showPaywall = paywallEnabled && position > (gameState?.game?.free_until_cell || 12)

  const serifReady = useSerifReady()

  const scrollStages = ['intro', 'finish', 'games', 'pathView', 'error', 'loading']
  const fullFrameStages = ['request', 'cell', 'rolling', 'transition', 'saved', 'help']

  if (!serifReady) {
    return (
      <Screen onBack={goBack} registerSystemBack={false} scroll fullFrame>
        <Loading />
      </Screen>
    )
  }

  return (
    <Screen
      onBack={goBack}
      registerSystemBack={false}
      scroll={scrollStages.includes(stage)}
      fullFrame={fullFrameStages.includes(stage)}
    >
      {stage === 'loading' && <Loading />}

      {stage === 'error' && <ErrorView message={error} onRetry={fetchState} />}

      {stage === 'intro' && (
        <IntroView
          onStart={() => {
            setStage('request')
            platform.haptic('light')
          }}
          onGames={handleOpenGames}
          hasGames={games.length > 0}
        />
      )}

      {stage === 'request' && (
        <RequestView
          request={request}
          setRequest={setRequest}
          onSubmit={handleCreateGame}
          onBack={() => setStage('intro')}
          error={error}
          creating={creating}
        />
      )}

      {stage === 'help' && <HelpView onDone={() => setStage('board')} />}

      {stage === 'board' && gameState?.game && (
        <BoardView
          game={gameState.game}
          board={board}
          onRoll={handleRoll}
          onContinueCell={() => setStage('cell')}
          onHelp={() => setStage('help')}
          onOpenPath={handleOpenPath}
          onNewGame={handleNewGame}
          throwsLeft={throwsLeft}
          paywallMessage={
            showPaywall ? 'Mentalix Pro' : error?.includes('На сегодня') ? error : null
          }
          walking={Boolean(walk)}
          piecePosition={walk?.current}
          rolling={rolling}
          bounce={bounce}
        />
      )}

      {stage === 'rolling' && <RollingView roll={rollValue} />}

      {stage === 'cell' && gameState?.game && (
        <CellView
          game={gameState.game}
          board={board}
          userId={userId}
          onInsight={handleInsight}
          onBackToBoard={() => setStage('board')}
          onGuestLogin={onGuestLogin}
          bounce={bounce}
        />
      )}

      {stage === 'saved' && <SavedView quote={savedQuote} />}

      {stage === 'transition' && transition && (
        <TransitionView
          via={transition.via}
          fromTitle={transition.fromTitle}
          toTitle={transition.toTitle}
          position={transition.position}
        />
      )}

      {stage === 'finish' && gameState?.game && (
        <FinishView
          game={gameState.game}
          board={board}
          onSummary={handleSummary}
          onNewGame={handleNewGame}
          onGames={handleOpenGames}
          onClose={onClose}
          summary={summary}
          summaryLoading={summaryLoading}
          summaryError={summaryError}
        />
      )}

      {stage === 'games' && (
        <GamesView
          games={games}
          onOpen={g => {
            setViewedGame(g)
            setStage('pathView')
          }}
          onNewGame={handleNewGame}
        />
      )}

      {stage === 'pathView' && viewedGame && <PathView game={viewedGame} board={board} />}

      {confirmNewGame && (
        <NewGameConfirm onConfirm={startNewGame} onCancel={() => setConfirmNewGame(false)} />
      )}
    </Screen>
  )
}
