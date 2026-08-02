import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
import { api } from '../lib/api'
import { Lock, Check } from 'lucide-react'
import BackButton from '../components/BackButton'
import Motif, { MotifArt } from '../components/Motif'
import { useMainButton, offerHomeScreen, cloud } from '../lib/telegram'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'

/*
 * ТЕМА НЕДЕЛИ — семь дней размышлений, по дню за раз.
 *
 * Экран состоит из четырёх видов, между которыми переключается
 * внутреннее состояние, а не навигация приложения. Причина: всё
 * это один сценарий, и человек не должен чувствовать, что вышел
 * из темы и зашёл куда-то ещё.
 *
 *   intro  — о чём эта неделя. Показывается, пока нет ни одного
 *            ответа: начинать неделю, не зная, о чём она, странно.
 *   day    — день с вопросом и полем для мысли.
 *   review — все семь вопросов и твои ответы подряд. Доступен с
 *            первого же ответа, а не только в конце: перечитать
 *            себя посреди недели полезнее, чем один раз в финале.
 *   list   — другие темы. Появляется, только если их больше одной.
 *
 * Экран живёт по общему fullscreen-контракту (см.
 * src/lib/fullscreenSurface.js): портал в body, высота из
 * visualViewport, отступ под контролы Telegram. Без этого кнопка
 * «Обдумал» уезжала под клавиатуру.
 */

const HOME_OFFERED_KEY = 'mx-home-offered'

function Shell({ style, children }) {
  return (
    <div className={FULLSCREEN_SHELL_CLASS} style={style}>
      <div className={FULLSCREEN_HEADER_SLOT_CLASS} aria-hidden="true" />

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-5 pt-2 pb-6 flex flex-col min-h-full">
          {children}
        </div>
      </div>
    </div>
  )
}

function Fact({ children }) {
  return (
    <li className="flex gap-3 text-[14px] text-cream/60 leading-snug">
      <span className="text-gold shrink-0 mt-[7px] w-[14px] h-px bg-gold/70" aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

export default function ThemeScreen({ user, themeId, onBack }) {
  const [themes, setThemes] = useState([])
  const [activeId, setActiveId] = useState(themeId)
  const [data, setData] = useState(null)
  const [day, setDay] = useState(1)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState(null)

  const { style } = useFullscreenSurface()

  useEffect(() => {
    setActiveId(themeId)
  }, [themeId])

  useEffect(() => {
    if (!user) return

    api.themes
      .list(user.id)
      .then((list) => setThemes(Array.isArray(list) ? list : []))
      .catch(() => setThemes([]))
  }, [user])

  useEffect(() => {
    if (!user || !activeId) return

    let alive = true

    setData(null)

    api.themes
      .get(activeId, user.id)
      .then((fresh) => {
        if (!alive) return

        setData(fresh)
        setDay(Math.min(fresh.current_day || 1, fresh.days.length))

        /*
         * Первый вид выбирается по состоянию, а не по умолчанию:
         * тот, кто уже пишет вторую неделю подряд, не должен
         * каждый раз проходить через вступление.
         */
        const started = fresh.days.some((d) => d.reflection)

        setView(started ? 'day' : 'intro')
      })
      .catch(console.error)

    return () => {
      alive = false
    }
  }, [user, activeId])

  useEffect(() => {
    if (!data) return

    const current = data.days.find((x) => x.day === day)

    setText(current?.reflection || '')
  }, [day, data])

  async function save() {
    if (!data) return

    setSaving(true)

    try {
      await api.themes.reflect(activeId, user.id, day, text)
      platform.haptic('success')

      const fresh = await api.themes.get(activeId, user.id)

      setData(fresh)

      const answered = fresh.days.filter((x) => x.reflection).length

      /*
       * Последний ответ недели ведёт не на восьмой день, которого
       * нет, а сразу в разбор: это и есть завершение темы.
       */
      if (answered === fresh.days.length) {
        setView('review')
      } else if (day < data.days.length) {
        setDay(day + 1)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const current = data?.days?.find((x) => x.day === day)
  const answered = data ? data.days.filter((x) => x.reflection).length : 0
  const finished = Boolean(data) && answered === data.days.length

  /*
   * Иконка на домашний экран предлагается один раз в жизни и
   * только здесь — в минуту, когда человек закрыл семидневную
   * тему.
   *
   * Момент выбран не случайно. Предложение «добавьте нас на
   * главный экран» на второй минуте знакомства читается как
   * попрошайничество: приложение ещё ничего не дало. После
   * недели собственных записей оно уже дало, и вопрос звучит
   * как продолжение, а не как реклама.
   *
   * Отметка живёт в облаке: предложить второй раз, да ещё и на
   * другом устройстве, — это уже назойливость.
   */
  useEffect(() => {
    if (!finished) return

    let alive = true

    cloud.get(HOME_OFFERED_KEY).then((already) => {
      if (!alive || already) return

      cloud.set(HOME_OFFERED_KEY, '1')
      offerHomeScreen()
    })

    return () => {
      alive = false
    }
  }, [finished])
  const canSave = Boolean(text.trim()) && !current?.locked

  /*
   * Хук вызывается всегда, а видимостью и текстом управляет вид.
   * Условный вызов сломал бы порядок хуков.
   */
  useMainButton({
    text:
      view === 'intro'
        ? 'Начать'
        : view === 'review'
          ? 'Закрыть тему'
          : saving
            ? 'Сохраняю...'
            : current?.reflection
              ? 'Обновить мысль'
              : 'Обдумал',
    onClick:
      view === 'intro'
        ? () => { platform.haptic('light'); setView('day') }
        : view === 'review'
          ? onBack
          : save,
    visible: Boolean(data) && view !== 'list' && (view !== 'day' || !current?.locked),
    enabled: view === 'day' ? canSave && !saving : true,
    loading: saving,
  })

  if (!data) {
    return createPortal(
      <Shell style={style}>
        <BackButton onClick={onBack} />

        <p className="w-full m-auto px-6 text-center text-cream/40 text-sm">
          Загрузка...
        </p>
      </Shell>,
      document.body,
    )
  }

  const back = () => {
    if (view === 'day') return onBack()

    platform.haptic('light')
    setView('day')
  }

  /* ── о чём эта неделя ──────────────────────────────────── */

  if (view === 'intro') {
    return createPortal(
      <Shell style={style}>
        <BackButton onClick={onBack} />

        <div className="flex-1 flex flex-col justify-center py-4">
          <div className="-mx-5 h-[150px] text-gold mb-6">
            <Motif name="ryad" className="w-full h-full" />
          </div>

          <div className="text-[12px] text-cream/35 font-semibold uppercase tracking-wide text-center mb-2">
            Тема недели
          </div>

          <h2 className="font-display text-[28px] text-cream lowercase leading-tight text-center">
            {data.title}
          </h2>

          {data.subtitle && (
            <p className="text-[15px] text-cream/50 leading-relaxed text-center mt-4">
              {data.subtitle}
            </p>
          )}

          <ul className="flex flex-col gap-3.5 mt-8">
            <Fact>
              {data.days.length} дней, каждый день — один вопрос. Не больше.
            </Fact>

            <Fact>
              Ответы сохраняются. В конце ты увидишь всю неделю сразу — и это
              главное, ради чего она нужна.
            </Fact>

            {data.free_days > 0 && data.free_days < data.days.length && (
              <Fact>
                Первые {data.free_days} дня открыты всем, остальные — часть Библиотеки.
              </Fact>
            )}

            <Fact>
              Пропущенный день не сгорает: к нему можно вернуться.
            </Fact>
          </ul>
        </div>
      </Shell>,
      document.body,
    )
  }

  /* ── разбор: все ответы подряд ─────────────────────────── */

  if (view === 'review') {
    const written = data.days.filter((x) => x.reflection)

    return createPortal(
      <Shell style={style}>
        <BackButton onClick={back} />

        <div className="text-center mt-4 mb-7">
          <div className="text-[12px] text-cream/35 font-semibold uppercase tracking-wide mb-2">
            {finished ? 'Неделя пройдена' : 'Что уже написано'}
          </div>

          <h2 className="font-display text-[26px] text-cream lowercase leading-tight">
            {data.title}
          </h2>

          <p className="text-[13px] text-cream/40 mt-3">
            {written.length} из {data.days.length} дней
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {written.map((d) => (
            <div key={d.day} className="rounded-[24px] bg-emerald border border-cream/10 p-5">
              <div className="text-[11px] text-gold font-bold uppercase tracking-wide mb-2">
                День {d.day}
              </div>

              {d.prompt && (
                <p className="text-[14px] text-cream/45 leading-snug mb-3">
                  {d.prompt}
                </p>
              )}

              <p className="text-[15px] text-cream leading-relaxed whitespace-pre-line">
                {d.reflection}
              </p>

              <button
                onClick={() => { platform.haptic('light'); setDay(d.day); setView('day') }}
                className="text-[12px] text-cream/35 mt-3 bg-transparent border-0 p-0 active:opacity-60"
              >
                Изменить
              </button>
            </div>
          ))}
        </div>

        {finished && (
          <div className="rounded-[28px] bg-emerald border border-gold/25 px-6 py-8 text-center mt-4">
            <MotifArt name="ryad" size={110} className="mx-auto mb-4" />

            <h3 className="font-display text-[20px] text-cream leading-tight">
              Семь дней — семь мыслей
            </h3>

            <p className="text-[14px] text-cream/50 mt-3 leading-relaxed">
              Это уже не чтение, а практика. Перечитай написанное через месяц —
              увидишь, что изменилось не в теме, а в тебе.
            </p>
          </div>
        )}
      </Shell>,
      document.body,
    )
  }

  /* ── другие темы ───────────────────────────────────────── */

  if (view === 'list') {
    return createPortal(
      <Shell style={style}>
        <BackButton onClick={back} />

        <h2 className="font-display text-[26px] text-cream lowercase leading-tight mt-4 mb-1">
          все темы.
        </h2>

        <p className="text-[12px] text-cream/35 mb-6">
          пройденные остаются с тобой — их можно перечитать
        </p>

        <div className="flex flex-col gap-3">
          {themes.map((item) => {
            const done = item.reflected_days >= item.total_days
            const active = item.id === activeId

            return (
              <button
                key={item.id}
                onClick={() => {
                  platform.haptic('light')
                  setActiveId(item.id)
                  setView('day')
                }}
                className={`w-full text-left rounded-[24px] border p-5 transition-transform active:scale-[0.99] ${
                  active ? 'bg-gold/10 border-gold/30' : 'bg-emerald border-cream/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-[18px] text-cream leading-tight lowercase">
                      {item.title}
                    </div>

                    {item.subtitle && (
                      <p className="text-[13px] text-cream/45 leading-snug mt-1.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {done && <Check size={16} className="text-gold shrink-0 mt-1" strokeWidth={3} />}
                </div>

                <div className="flex gap-[3px] mt-4" aria-hidden="true">
                  {Array.from({ length: item.total_days || 0 }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-[3px] flex-1 rounded-full ${
                        index < item.reflected_days ? 'bg-gold' : 'bg-cream/20'
                      }`}
                    />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </Shell>,
      document.body,
    )
  }

  /* ── день ──────────────────────────────────────────────── */

  return createPortal(
    <Shell style={style}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <BackButton onClick={onBack} />

        <div className="flex items-center gap-3 shrink-0">
          {answered > 0 && (
            <button
              onClick={() => { platform.haptic('light'); setView('review') }}
              className="text-[12px] text-gold bg-transparent border-0 p-0 active:opacity-60"
            >
              Мои ответы
            </button>
          )}

          {themes.length > 1 && (
            <button
              onClick={() => { platform.haptic('light'); setView('list') }}
              className="text-[12px] text-cream/40 bg-transparent border-0 p-0 active:opacity-60"
            >
              Все темы
            </button>
          )}
        </div>
      </div>

      <div className="text-center mb-6">
        <button
          onClick={() => { platform.haptic('light'); setView('intro') }}
          className="text-[12px] text-cream/35 font-semibold uppercase tracking-wide mb-2 bg-transparent border-0 p-0 active:opacity-60"
        >
          Тема недели
        </button>

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
                active
                  ? 'bg-cream text-emerald-deep'
                  : d.reflection
                    ? 'bg-gold/20 text-gold'
                    : 'bg-emerald text-cream/40',
              ].join(' ')}
            >
              {d.locked ? <Lock size={12} /> : d.reflection && !active ? <Check size={13} strokeWidth={3} /> : d.day}
            </button>
          )
        })}
      </div>

      {/* Стабильная карточка: клавиатура уменьшает scroll-zone, но не центрирует её заново. */}
      <div className="shrink-0">
        <div className="rounded-[28px] bg-emerald px-6 py-8 text-center">
          {current?.locked ? (
            <>
              <MotifArt name="povedenie" size={110} className="mx-auto mb-4" />

              <h3 className="font-display text-[20px] text-cream leading-tight">
                День {day} под замком
              </h3>

              <p className="text-[14px] text-cream/50 mt-3 leading-relaxed">
                Первые {data.free_days} дня открыты всем. Остальные — часть Библиотеки.
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
              <div className="text-[12px] text-cream/35 font-bold mb-3">
                День {day} из {data.days.length}
              </div>

              <p className="font-display text-[19px] text-cream leading-snug">
                {current?.text}
              </p>

              {current?.prompt && (
                <p className="text-[14px] text-gold/80 font-semibold mt-5 leading-snug">
                  {current.prompt}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {!current?.locked && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Записать мысль..."
          rows={4}
          className="w-full shrink-0 rounded-3xl bg-emerald text-cream placeholder-cream/30 p-5 text-[16px] leading-relaxed outline-none border border-cream/10 focus:border-gold/40 resize-none font-body mt-3 mb-[76px]"
        />
      )}
    </Shell>,
    document.body,
  )
}
