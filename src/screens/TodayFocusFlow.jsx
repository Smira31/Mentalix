import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { platform } from '../platform'
import { api } from '../lib/api'
import BackButton from '../components/BackButton'
import JournalTextarea from '../components/JournalTextarea'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import { saveTodayFocusPick, saveTodayFocusFirstStep } from '../lib/todayFocus'
import { PERSONAS } from './mentalix/personas'

const kompas = PERSONAS.find(persona => persona.key === 'kompas')

/*
 * «Разгрузить голову»: три шага. Список фиксируется в
 * хранилище только после выбора одного дела (см.
 * lib/todayFocus.js), поэтому промежуточный список не
 * переживает закрытие экрана без выбора. Первый шаг (шаг
 * firstStep) необязателен — можно закрыть флоу сразу после
 * выбора, picked уже сохранён.
 */

export default function TodayFocusFlow({
  userId,
  initialItems = [],
  initialStep = 'input',
  initialPicked = null,
  onClose,
  onPicked,
}) {
  const { style: surfaceStyle } = useFullscreenSurface()

  const [step, setStep] = useState(initialStep)

  const [text, setText] = useState(initialItems.join('\n'))

  const [items, setItems] = useState(initialItems)

  const [picked, setPicked] = useState(initialPicked)

  const [firstStepText, setFirstStepText] = useState('')

  const [aiLoading, setAiLoading] = useState(false)

  const [aiError, setAiError] = useState('')

  const scrollRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  /*
   * После шага input клавиатура закрыта явным blur (а не
   * оставлена браузеру), а прокручиваемая область шага pick
   * возвращается к началу — иначе на iPhone под закрывающейся
   * клавиатурой остаётся прежний скролл, и шапка «pick» уходит
   * за край экрана. Синхронизировано с рендером через эффект от
   * step, без произвольных таймеров.
   */
  useEffect(() => {
    if (step === 'pick' && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [step])

  function goToPick() {
    const parsed = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)

    if (parsed.length === 0) return

    platform.haptic('light')

    document.activeElement?.blur?.()

    setItems(parsed)
    setStep('pick')
  }

  function pick(item) {
    platform.haptic('medium')

    const entry = saveTodayFocusPick(userId, items, item)

    setPicked(item)
    onPicked(entry)
    setStep('firstStep')
  }

  async function suggestFirstStep() {
    setAiError('')
    setAiLoading(true)

    const prompt =
      `Помоги мне начать: «${picked}». ` +
      'Сформулируй один конкретный первый шаг, ' +
      'который можно увидеть и завершить не более чем за пять минут.'

    try {
      const reply = await api.mentalix.send(userId, prompt, 'kompas')

      if (!mountedRef.current) return

      setFirstStepText(reply.content)
    } catch (error) {
      console.error(error)

      if (!mountedRef.current) return

      setAiError('Не удалось получить подсказку. Впиши шаг вручную или попробуй ещё раз.')
    } finally {
      if (mountedRef.current) {
        setAiLoading(false)
      }
    }
  }

  function saveFirstStep() {
    const value = firstStepText.trim()

    if (!value) return

    platform.haptic('medium')

    const entry = saveTodayFocusFirstStep(userId, value)

    onPicked(entry)
    onClose()
  }

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={surfaceStyle}>
      <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-center gap-3 px-5`}>
        <BackButton onClick={onClose} />
      </div>

      <div ref={scrollRef} className={`${FULLSCREEN_SCROLL_CLASS} px-5 pb-8`}>
        {step === 'input' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <span className="block font-label text-[11px] font-bold uppercase tracking-wider text-gold mb-2">
              Разгрузить голову
            </span>

            <h2 className="font-display text-[22px] text-cream leading-tight">
              Что тянет внимание?
            </h2>

            <p className="text-[12px] text-muted mt-2 leading-relaxed">
              Выпиши все дела, которые конкурируют за сегодня — по одному на строку. Ничего не
              потеряется.
            </p>

            <JournalTextarea
              autoFocus
              value={text}
              onChange={setText}
              placeholder={'Например:\nНаписать отчёт\nРазобрать почту\nПозвонить в поликлинику'}
              ariaLabel="Дела, которые тянут внимание"
              className="mt-6 min-h-[18rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              onSubmit={goToPick}
              submitLabel="Продолжить"
              submitDisabled={!text.trim()}
            />
          </div>
        )}

        {step === 'pick' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <span className="block font-label text-[11px] font-bold uppercase tracking-wider text-gold mb-2">
              Разгрузить голову
            </span>

            <h2 className="font-display text-[22px] text-cream leading-tight">Выбери одно</h2>

            <p className="text-[12px] text-muted mt-2 leading-relaxed">
              Остальное никуда не денется — просто не сегодня.
            </p>

            <div className="mt-5 space-y-2">
              {items.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  type="button"
                  onClick={() => pick(item)}
                  className="w-full rounded-2xl px-4 py-3.5 bg-cream/5 border border-cream/10 text-left text-[14px] font-semibold text-cream active:scale-[0.98] transition-transform"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60"
              >
                Изменить список
              </button>
            </div>
          </div>
        )}

        {step === 'firstStep' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <span className="block font-label text-[11px] font-bold uppercase tracking-wider text-gold mb-2">
              Разгрузить голову
            </span>

            <h2 className="font-display text-[22px] text-cream leading-tight">Как начнёшь?</h2>

            <p className="text-[12px] text-muted mt-2 leading-relaxed">
              Первый шаг, который займёт не больше пяти минут — необязательно, можно пропустить.
            </p>

            <JournalTextarea
              autoFocus
              value={firstStepText}
              onChange={setFirstStepText}
              placeholder="Например: открыть документ и записать три пункта"
              ariaLabel="Первый шаг"
              className="mt-6 min-h-[18rem]"
              editorClassName="pb-24"
              floatingToolbar
              formatting={false}
              onSubmit={saveFirstStep}
              submitLabel="Сохранить шаг"
              submitDisabled={!firstStepText.trim()}
              onDeepen={suggestFirstStep}
              deepenLabel={aiLoading ? kompas.typing : 'Подсказать шаг'}
              deepenDisabled={false}
              deepenLoading={aiLoading}
            />

            {aiError && <p className="text-[12px] text-red-400 mt-2">{aiError}</p>}

            <div className="mt-5">
              <button
                type="button"
                onClick={onClose}
                className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60"
              >
                Пропустить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
