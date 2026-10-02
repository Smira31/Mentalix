import { useCallback, useEffect, useRef, useState } from 'react'

import Screen from '../../components/Screen'
import PillButton from '../../components/ui/PillButton'
import CapsLabel from '../../components/ui/CapsLabel'
import { useBackButton } from '../../platform/telegram.hooks'
import { platform } from '../../platform'
import { api } from '../../lib/api'
import { findCell, getLevel, DAIMON_INSIGHT_PROMPT, DAIMON_FINAL_CELL } from '../../lib/daimonBoard'
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
// loading → intro → request → board → rolling → cell → transition → finish → games → pathView

function Loading() {
  return <div className="mx-daimon-loading">Загрузка…</div>
}

function ErrorView({ message, onRetry }) {
  return (
    <div className="mx-daimon-error">
      <p className="mx-daimon-error__text">{message || 'Не удалось загрузить. Попробуй ещё раз.'}</p>
      {onRetry && (
        <PillButton variant="light" onClick={onRetry} testId="daimon-retry">
          Повторить
        </PillButton>
      )}
    </div>
  )
}

/* ── Вход ── */
function IntroView({ onStart, onGames, hasGames }) {
  return (
    <div className="mx-daimon-intro">
      <div className="mx-daimon-intro__art" aria-hidden="true" data-testid="daimon-intro-art" />
      <h1 className="mx-daimon-intro__title">Даймон</h1>
      <p className="mx-daimon-intro__body">
        Игра для самопознания. Задай вопрос, который тебя беспокоит, брось кубик — и поговори со
        своим внутренним голосом.
      </p>
      <p className="mx-daimon-intro__note">Не терапия и не предсказание.</p>
      <div className="mx-daimon-intro__actions">
        <PillButton variant="light" onClick={onStart} testId="daimon-start">
          Начать игру
        </PillButton>
        {hasGames && (
          <button type="button" className="mx-daimon-intro__link" onClick={onGames} data-testid="daimon-my-games">
            Мои игры
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Запрос ── */
function RequestView({ request, setRequest, onSubmit, onBack }) {
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
        <textarea
          ref={fieldRef}
          className="mx-daimon-request__field"
          value={request}
          onChange={e => setRequest(e.target.value)}
          placeholder="С чем ты приходишь? Например: не понимаю, куда двигаться"
          aria-label="Запрос для игры Даймон"
          data-testid="daimon-request-input"
        />
      </div>
      <button
        type="button"
        aria-label={hasText ? 'Отправить запрос' : undefined}
        data-testid="daimon-request-submit"
        onClick={hasText ? onSubmit : onBack}
        className="mx-daimon-round-btn"
        style={roundStyle}
      >
        {hasText ? '✓' : '✕'}
      </button>
    </>
  )
}

/* ── Поле ── */
function BoardView({ game, board, onRoll, onContinueCell, throwsLeft, paywallMessage }) {
  const passedCells = new Set(
    game.moves
      .filter(m => m.insight || m.skipped || m.via)
      .map(m => m.cell)
  )
  const pendingMove = game.moves.find(m => m.id === game.pending_move_id)
  const pendingCellNum = pendingMove?.to

  return (
    <div className="mx-daimon-board-view">
      <div className="mx-daimon-board__request" data-testid="daimon-request-preview">
        {game.request}
      </div>
      <DaimonBoard board={board} position={game.position} passedCells={passedCells} />
      <div className="mx-daimon-board__actions">
        {paywallMessage ? (
          <p className="mx-daimon-board__paywall" data-testid="daimon-paywall">{paywallMessage}</p>
        ) : pendingMove ? (
          <PillButton variant="light" onClick={onContinueCell} testId="daimon-continue-cell">
            Продолжить клетку {pendingCellNum}
          </PillButton>
        ) : (
          <PillButton variant="light" onClick={onRoll} testId="daimon-roll">
            Бросить кубик
          </PillButton>
        )}
        {!paywallMessage && !pendingMove && (
          <p className="mx-daimon-board__throws" data-testid="daimon-throws-left">
            Осталось бросков сегодня: {throwsLeft}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Бросок ── */
function RollingView({ roll }) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  return (
    <div className="mx-daimon-roll" data-testid="daimon-rolling">
      <div className={`mx-daimon-dice${!reduceMotion ? ' mx-daimon-dice--rolling' : ''}`} data-testid="daimon-dice">
        {roll || '?'}
      </div>
      <p className="mx-daimon-roll__label">Бросок…</p>
    </div>
  )
}

/* ── Клетка ── */
function CellView({ game, board, userId, onInsight, onBack }) {
  const pendingMove = game.moves.find(m => m.id === game.pending_move_id)
  const cellNum = pendingMove?.to || game.position
  const cell = findCell(board, cellNum)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [askedCount, setAskedCount] = useState(0)
  const [askInsight, setAskInsight] = useState(false)
  const [insightText, setInsightText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const chatEndRef = useRef(null)
  const insightRef = useRef(null)
  const firstQuestionSent = useRef(false)

  const sendingRef = useRef(sending)
  useEffect(() => { sendingRef.current = sending }, [sending])

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
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendChat(text) {
    if (sending) return
    setSending(true)
    setError('')
    try {
      const res = await api.daimon.chat(userId, text)
      // In demo mode, user_id is passed in body; use the stored userId
      setMessages(prev => [
        ...(text ? [...prev, { role: 'user', content: text }] : prev),
        { role: 'assistant', content: res.reply },
      ])
      setAskedCount(res.asked_count)
      setAskInsight(res.ask_insight)
      setInput('')
    } catch (err) {
      setError('Не удалось получить ответ. Попробуй ещё раз.')
    } finally {
      setSending(false)
    }
  }

  async function submitInsight(skip = false) {
    if (!skip && !insightText.trim()) return
    setSending(true)
    setError('')
    try {
      await onInsight(skip ? '' : insightText.trim(), skip)
    } catch {
      setError('Не удалось сохранить вывод.')
      setSending(false)
    }
  }

  if (!cell) return <Loading />

  const hasText = input.trim().length > 0
  const hasInsightText = insightText.trim().length > 0

  return (
    <div className="mx-daimon-cell-view">
      <div className="mx-daimon-cell__header">
        <span className="mx-daimon-cell__number">Клетка {cellNum}</span>
        <h2 className="mx-daimon-cell__title" data-testid="daimon-cell-title">{cell.title}</h2>
        <p className="mx-daimon-cell__meaning">{cell.meaning}</p>
        {cell.snake_to && (
          <span className="mx-daimon-cell__tag mx-daimon-cell__tag--snake">Клетка-ловушка</span>
        )}
        {cell.arrow_to && (
          <span className="mx-daimon-cell__tag mx-daimon-cell__tag--arrow">Клетка силы</span>
        )}
      </div>

      <div className="mx-daimon-chat" data-testid="daimon-chat">
        {messages.map((msg, i) => (
          <div key={i} className={`mx-daimon-chat__msg mx-daimon-chat__msg--${msg.role}`}>
            {msg.content}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {error && <p className="mx-daimon-error__text">{error}</p>}

      {((askInsight ? insightVoice : chatVoice).voiceState !== 'idle' || (askInsight ? insightVoice : chatVoice).voiceError) && (
        <div className="mx-daimon-voice-status">
          {(askInsight ? insightVoice : chatVoice).voiceState === 'recording' && (
            <span className="mx-daimon-voice-status__rec">
              Запись · 0:{String((askInsight ? insightVoice : chatVoice).voiceSeconds).padStart(2, '0')} · отпусти кнопку
            </span>
          )}
          {(askInsight ? insightVoice : chatVoice).voiceState === 'transcribing' && (
            <span className="mx-daimon-voice-status__trans">Распознаю голос…</span>
          )}
          {(askInsight ? insightVoice : chatVoice).voiceError && (askInsight ? insightVoice : chatVoice).voiceState === 'idle' && (
            <span className="mx-daimon-voice-status__err">{(askInsight ? insightVoice : chatVoice).voiceError}</span>
          )}
        </div>
      )}

      {askInsight ? (
        <div className="mx-daimon-chat__input-row" data-testid="daimon-insight-row">
          <textarea
            ref={insightRef}
            className="mx-daimon-chat__input"
            value={insightText}
            onChange={e => setInsightText(e.target.value)}
            placeholder={DAIMON_INSIGHT_PROMPT}
            aria-label="Вывод по клетке"
            data-testid="daimon-insight-input"
            rows={1}
          />
          {!hasInsightText && (
            <button
              type="button"
              aria-label="Записать голос"
              data-testid="daimon-insight-mic"
              className="mx-daimon-mic-btn"
              onPointerDown={e => { e.preventDefault(); insightVoice.startRecording() }}
              onPointerUp={e => { e.preventDefault(); insightVoice.stopRecording() }}
              onPointerLeave={() => insightVoice.stopRecording()}
              onPointerCancel={() => insightVoice.stopRecording()}
              onContextMenu={e => e.preventDefault()}
              disabled={sending || insightVoice.voiceState === 'transcribing'}
              style={{ touchAction: 'none' }}
            >
              {insightVoice.voiceState === 'recording' ? <Square size={18} fill="currentColor" />
                : insightVoice.voiceState === 'transcribing' ? <LoaderCircle size={20} className="animate-spin" />
                : <Mic size={22} />}
            </button>
          )}
          <button
            type="button"
            aria-label="Сохранить вывод"
            data-testid="daimon-insight-submit"
            onClick={() => submitInsight(false)}
            disabled={!insightText.trim() || sending}
            className="mx-daimon-round-btn"
          >
            ✓
          </button>
          <button
            type="button"
            className="mx-daimon-chat__skip"
            onClick={() => submitInsight(true)}
            disabled={sending}
            data-testid="daimon-skip"
          >
            Пропустить клетку
          </button>
        </div>
      ) : (
        <div className="mx-daimon-chat__input-row" data-testid="daimon-chat-row">
          <textarea
            className="mx-daimon-chat__input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Напиши ответ…"
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
          {!hasText && (
            <button
              type="button"
              aria-label="Записать голос"
              data-testid="daimon-chat-mic"
              className="mx-daimon-mic-btn"
              onPointerDown={e => { e.preventDefault(); chatVoice.startRecording() }}
              onPointerUp={e => { e.preventDefault(); chatVoice.stopRecording() }}
              onPointerLeave={() => chatVoice.stopRecording()}
              onPointerCancel={() => chatVoice.stopRecording()}
              onContextMenu={e => e.preventDefault()}
              disabled={sending || chatVoice.voiceState === 'transcribing'}
              style={{ touchAction: 'none' }}
            >
              {chatVoice.voiceState === 'recording' ? <Square size={18} fill="currentColor" />
                : chatVoice.voiceState === 'transcribing' ? <LoaderCircle size={20} className="animate-spin" />
                : <Mic size={22} />}
            </button>
          )}
          <button
            type="button"
            aria-label={hasText ? 'Отправить' : 'Вернуться к полю'}
            data-testid="daimon-chat-send"
            onClick={hasText ? () => sendChat(input.trim()) : onBack}
            disabled={sending}
            className="mx-daimon-round-btn"
          >
            {hasText ? '✓' : '✕'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Переход ── */
function TransitionView({ via, fromTitle, toTitle, position }) {
  const isSnake = via === 'snake'
  return (
    <div className="mx-daimon-transition" data-testid="daimon-transition">
      <span className="mx-daimon-transition__icon">{isSnake ? '↘' : '↗'}</span>
      <p className="mx-daimon-transition__text">
        {isSnake ? 'Змея' : 'Стрела'}: {fromTitle} → {toTitle}
      </p>
      <p className="mx-daimon-transition__sub">
        {position === DAIMON_FINAL_CELL ? 'Ты дошёл до Даймона' : 'Продолжай путь'}
      </p>
    </div>
  )
}

/* ── Финиш ── */
function FinishView({ game, board, onSummary, onNewGame, onClose, summary, pathView }) {
  const moves = game.moves.filter(m => m.insight || m.skipped)

  return (
    <div className="mx-daimon-finish" data-testid="daimon-finish">
      <div className="mx-daimon-finish__art" aria-hidden="true" data-testid="daimon-finish-art" />
      <h1 className="mx-daimon-finish__title">Ты дошёл до Даймона</h1>
      {summary && <p className="mx-daimon-finish__summary" data-testid="daimon-summary">{summary}</p>}
      <div className="mx-daimon-finish__path-heading">Твой путь</div>
      <div className="mx-daimon-finish__path" data-testid="daimon-path">
        {moves.map((m, i) => {
          const cell = findCell(board, m.to)
          return (
            <div key={i} className="mx-daimon-finish__path-item">
              <span className="mx-daimon-finish__path-num">{m.to}</span>
              <div className="mx-daimon-finish__path-body">
                <span className="mx-daimon-finish__path-title">{cell?.title || `Клетка ${m.to}`}</span>
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
      <div className="mx-daimon-finish__actions">
        {!summary && (
          <PillButton variant="light" onClick={onSummary} testId="daimon-summary-btn">
            Взгляд сверху
          </PillButton>
        )}
        <PillButton variant="transparent" onClick={onNewGame} testId="daimon-new-game">
          Новая игра
        </PillButton>
        <PillButton variant="transparent" onClick={onClose} testId="daimon-done">
          Готово
        </PillButton>
      </div>
    </div>
  )
}

/* ── Мои игры ── */
function GamesView({ games, onOpen, onBack }) {
  if (!games || games.length === 0) {
    return (
      <div className="mx-daimon-games">
        <p className="mx-daimon-games__empty">Пока нет завершённых игр.</p>
      </div>
    )
  }
  return (
    <div className="mx-daimon-games" data-testid="daimon-games-list">
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
              {date} · {g.status === 'finished' ? 'Завершена' : 'Активна'} · {cellsCount} клеток
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Просмотр пути (только чтение) ── */
function PathView({ game, board, onBack }) {
  const moves = game.moves.filter(m => m.insight || m.skipped)
  return (
    <div className="mx-daimon-finish" data-testid="daimon-path-view">
      <div className="mx-daimon-finish__path-heading">Твой путь</div>
      <div className="mx-daimon-finish__path">
        {moves.map((m, i) => {
          const cell = findCell(board, m.to)
          return (
            <div key={i} className="mx-daimon-finish__path-item">
              <span className="mx-daimon-finish__path-num">{m.to}</span>
              <div className="mx-daimon-finish__path-body">
                <span className="mx-daimon-finish__path-title">{cell?.title || `Клетка ${m.to}`}</span>
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
    </div>
  )
}

/* ── Главный компонент ── */
export default function DaimonFlow({ userId, onClose }) {
  const [board, setBoard] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [games, setGames] = useState([])
  const [stage, setStage] = useState('loading')
  const [request, setRequest] = useState('')
  const [error, setError] = useState(null)
  const [rollValue, setRollValue] = useState(null)
  const [transition, setTransition] = useState(null)
  const [summary, setSummary] = useState(null)
  const [viewedGame, setViewedGame] = useState(null)

  const fetchState = useCallback(async () => {
    try {
      const [boardRes, stateRes] = await Promise.all([
        api.daimon.board(),
        api.daimon.state(userId),
      ])
      setBoard(boardRes)
      setGameState(stateRes)
      setError(null)
      if (!stateRes.game) {
        setStage('intro')
      } else if (stateRes.game.status === 'finished') {
        setStage('finish')
      } else if (stateRes.game.pending_move_id) {
        setStage('cell')
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

  const fetchGames = useCallback(async () => {
    try {
      const res = await api.daimon.games(userId)
      setGames(res)
    } catch {
      setGames([])
    }
  }, [userId])

  function goBack() {
    if (stage === 'request') {
      setStage('intro')
    } else if (stage === 'cell') {
      setStage('board')
    } else if (stage === 'transition') {
      setStage('board')
    } else if (stage === 'games') {
      setStage('intro')
    } else if (stage === 'pathView') {
      setStage('games')
    } else {
      onClose()
    }
    platform.haptic('light')
  }

  useBackButton(goBack)

  async function handleCreateGame() {
    const trimmed = request.trim()
    if (trimmed.length < 3 || trimmed.length > 500) return
    try {
      const res = await api.daimon.createGame(userId, trimmed)
      setGameState(res)
      setStage('board')
      platform.haptic('success')
    } catch (err) {
      setError(err?.status === 422 ? 'Запрос слишком короткий или слишком длинный' : 'Не удалось начать игру')
    }
  }

  async function handleRoll() {
    try {
      const res = await api.daimon.roll(userId)
      setRollValue(res.game.moves[res.game.moves.length - 1]?.roll)
      setGameState(res)
      setStage('rolling')
      platform.haptic('light')

      // Анимация кубика, затем переход к клетке
      const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      const diceDelay = reduceMotion ? 100 : 700
      setTimeout(() => {
        setStage('cell')
      }, diceDelay)
    } catch (err) {
      if (err?.status === 429) {
        setError('На сегодня всё. Возвращайся завтра — Даймон подождёт.')
        setStage('board')
      } else if (err?.status === 409) {
        setStage('cell')
      } else {
        setError('Не удалось бросить кубик')
      }
    }
  }

  async function handleInsight(text, skip) {
    const res = await api.daimon.insight(userId, text, skip)
    setGameState(res)

    // Находим последний закрытый ход — на нём могла быть змея/стрела
    const lastClosed = [...res.game.moves].reverse().find(m => m.insight || m.skipped)

    if (lastClosed?.via) {
      const fromCell = findCell(board, lastClosed.to)
      const toCell = findCell(board, lastClosed.via_to)
      setTransition({ via: lastClosed.via, fromTitle: fromCell?.title, toTitle: toCell?.title, position: res.game.position })
      setStage('transition')
      platform.haptic('success')

      const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      const delay = reduceMotion ? 200 : 1600
      setTimeout(() => {
        if (res.game.position === DAIMON_FINAL_CELL) {
          setStage('finish')
        } else {
          setStage('board')
        }
        setTransition(null)
      }, delay)
    } else if (res.game.position === DAIMON_FINAL_CELL || res.game.status === 'finished') {
      setStage('finish')
      platform.haptic('success')
    } else {
      setStage('board')
      platform.haptic('success')
    }
  }

  async function handleSummary() {
    try {
      const res = await api.daimon.summary(userId, gameState?.game?.id)
      setSummary(res.summary)
    } catch {
      setSummary('Не удалось создать итог. Твой путь сохранён.')
    }
  }

  function handleNewGame() {
    setRequest('')
    setSummary(null)
    setGameState(null)
    setStage('intro')
    platform.haptic('light')
  }

  async function handleOpenGames() {
    await fetchGames()
    setStage('games')
  }

  function handleOpenGame(game) {
    setViewedGame(game)
    setStage('pathView')
  }

  const throwsLeft = gameState?.game ? gameState.game.throws_limit - gameState.game.throws_today : 0
  const paywallEnabled = gameState?.game?.paywall_enabled
  const position = gameState?.game?.position || 0
  const showPaywall = paywallEnabled && position > (gameState?.game?.free_until_cell || 12)

  // Заголовок экрана
  const screenTitle = stage === 'games' ? 'Мои игры' : stage === 'pathView' ? 'Твой путь' : 'Даймон'

  return (
    <Screen
      onBack={goBack}
      registerSystemBack={false}
      scroll={stage === 'intro' || stage === 'finish' || stage === 'games' || stage === 'pathView' || stage === 'error' || stage === 'loading'}
      fullFrame={stage === 'request' || stage === 'cell' || stage === 'rolling' || stage === 'transition'}
      headerSlot={<span className="mx-type-section text-cream">{screenTitle}</span>}
    >
      {stage === 'loading' && <Loading />}

      {stage === 'error' && <ErrorView message={error} onRetry={fetchState} />}

      {stage === 'intro' && (
        <IntroView
          onStart={() => { setStage('request'); platform.haptic('light') }}
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
        />
      )}

      {stage === 'board' && gameState?.game && (
        <BoardView
          game={gameState.game}
          board={board}
          onRoll={handleRoll}
          onContinueCell={() => setStage('cell')}
          throwsLeft={throwsLeft}
          paywallMessage={showPaywall ? 'Mentalix Pro' : (error?.includes('На сегодня') ? error : null)}
        />
      )}

      {stage === 'rolling' && <RollingView roll={rollValue} />}

      {stage === 'cell' && gameState?.game && (
        <CellView
          game={gameState.game}
          board={board}
          userId={userId}
          onInsight={handleInsight}
          onBack={() => setStage('board')}
        />
      )}

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
          onClose={onClose}
          summary={summary}
        />
      )}

      {stage === 'games' && (
        <GamesView
          games={games}
          onOpen={handleOpenGame}
          onBack={() => setStage('intro')}
        />
      )}

      {stage === 'pathView' && viewedGame && (
        <PathView game={viewedGame} board={board} onBack={() => setStage('games')} />
      )}
    </Screen>
  )
}
