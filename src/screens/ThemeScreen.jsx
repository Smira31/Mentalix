import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
import { api } from '../lib/api'
import { Lock, Check } from 'lucide-react'
import BackButton from '../components/BackButton'
import { MotifArt } from '../components/Motif'
import { useMainButton } from '../lib/telegram'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'

// ── Тема недели: семь дней размышлений, по дню за раз ──
// Первые дни открыты всем, дальше — по подписке.
//
// Экран живёт по общему fullscreen-контракту Mentalix
// (см. src/lib/fullscreenSurface.js): портал в body,
// высота из visualViewport, отступ под контролы Telegram.
// Без этого кнопка «Обдумал» уезжала под клавиатуру.

export default function ThemeScreen({ user, themeId, onBack }) {
  const [data, setData] = useState(null)
  const [day, setDay] = useState(1)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const { style } = useFullscreenSurface()

  useEffect(() => {
    if (!user || !themeId) return
    api.themes
      .get(themeId, user.id)
      .then((d) => {
        setData(d)
        setDay(Math.min(d.current_day || 1, d.days.length))
      })
      .catch(console.error)
  }, [user, themeId])

  useEffect(() => {
    if (!data) return
    const d = data.days.find((x) => x.day === day)
    setText(d?.reflection || '')
  }, [day, data])

  async function save() {
    if (!data) return
    setSaving(true)
    try {
      await api.themes.reflect(themeId, user.id, day, text)
      platform.haptic('success')
      const fresh = await api.themes.get(themeId, user.id)
      setData(fresh)
      if (day < data.days.length) setDay(day + 1)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  /*
   * Кнопка «назад» раньше сидела в узком слоте под контролами
   * Telegram и была почти чёрной на чёрном — её не было видно и
   * нельзя было нажать. Теперь она стоит первым элементом
   * содержимого, с видимой границей и подписью.
   */
  const header = (
    <div className={`${FULLSCREEN_HEADER_SLOT_CLASS} flex items-end px-5`} aria-hidden="true" />
  )

  const backButton = <BackButton onClick={onBack} />

  const currentDay = data?.days?.find((x) => x.day === day)

  const canSave = Boolean(text.trim()) && !currentDay?.locked

  /*
   * Действие уехало в системную кнопку внизу: она живёт вне
   * веб-вью и остаётся над клавиатурой. Именно из-за этой
   * особенности кнопка «Обдумал» раньше пряталась под ней.
   */
  useMainButton({
    text: saving
      ? 'Сохраняю...'
      : currentDay?.reflection
        ? 'Обновить мысль'
        : 'Обдумал',
    onClick: save,
    visible: Boolean(data) && !currentDay?.locked,
    enabled: canSave && !saving,
    loading: saving,
  })

  if (!data) {
    return createPortal(
      <div className={FULLSCREEN_SHELL_CLASS} style={style}>
        {header}
        <div className={FULLSCREEN_SCROLL_CLASS}>
          <div className="w-full max-w-md mx-auto px-5 pt-2">
            {backButton}
          </div>

          <p className="w-full m-auto px-6 text-center text-cream/40 text-sm">
            Загрузка...
          </p>
        </div>
      </div>,
      document.body,
    )
  }

  const current = data.days.find((x) => x.day === day)
  const doneCount = data.days.filter((x) => x.reflection).length
  const finished = doneCount === data.days.length

  return createPortal(
    <div className={FULLSCREEN_SHELL_CLASS} style={style}>
      {header}

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-5 pt-2 pb-6 flex flex-col min-h-full">

          <div className="mb-5">
            {backButton}
          </div>

          <div className="text-center mb-6">
            <div className="text-[12px] text-cream/35 font-semibold uppercase tracking-wide mb-2">
              Тема недели
            </div>
            <h2 className="font-display text-[26px] text-cream lowercase leading-tight">
              {data.title}
            </h2>
          </div>

          {/* дни: точки-переключатели */}
          <div className="flex gap-1.5 mb-5">
            {data.days.map((d) => {
              const active = d.day === day
              return (
                <button
                  key={d.day}
                  onClick={() => { platform.haptic('light'); setDay(d.day) }}
                  className={[
                    'flex-1 h-9 rounded-full text-[12px] font-bold border-0 flex items-center justify-center transition-colors',
                    active ? 'bg-cream text-emerald-deep' : d.reflection ? 'bg-gold/20 text-gold' : 'bg-emerald text-cream/40',
                  ].join(' ')}
                >
                  {d.locked ? <Lock size={12} /> : d.reflection && !active ? <Check size={13} strokeWidth={3} /> : d.day}
                </button>
              )
            })}
          </div>

          {/* карточка дня — остаётся по центру оставшегося места */}
          <div className="flex-1 flex flex-col justify-center">
          <div className="rounded-[28px] bg-emerald px-6 py-8 text-center">
            {current?.locked ? (
              <>
                <MotifArt name="povedenie" size={110} className="mx-auto mb-4" />
                <h3 className="font-display text-[20px] text-cream leading-tight">День {day} под замком</h3>
                <p className="text-[14px] text-cream/50 mt-3 leading-relaxed">
                  Первые {data.free_days} дня открыты всем. Остальные пять — часть Библиотеки.
                </p>
                <button
                  onClick={() => platform.haptic('light')}
                  className="cta-pill text-[15px] px-9 py-3.5 mt-6"
                >
                  Скоро откроется
                </button>
              </>
            ) : (
              <>
                <div className="text-[12px] text-cream/35 font-bold mb-3">День {day} из {data.days.length}</div>
                <p className="font-display text-[19px] text-cream leading-snug">{current?.text}</p>
                {current?.prompt && (
                  <p className="text-[14px] text-gold/80 font-semibold mt-5 leading-snug">{current.prompt}</p>
                )}
              </>
            )}
          </div>

          </div>

          {/* размышление */}
          {!current?.locked && (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Записать мысль..."
                rows={4}
                className="w-full rounded-3xl bg-emerald text-cream placeholder-cream/30 p-5 text-[16px] leading-relaxed outline-none border border-cream/10 focus:border-gold/40 resize-none font-body mt-3"
              />
            </>
          )}

          {finished && (
            <div className="rounded-[28px] bg-emerald px-6 py-8 text-center mt-4 animate-fade-in">
              <MotifArt name="ryad" size={120} className="mx-auto mb-4" />
              <h3 className="font-display text-[20px] text-cream leading-tight">Тема пройдена</h3>
              <p className="text-[14px] text-cream/50 mt-2">Семь дней размышлений — это уже практика.</p>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body,
  )
}
