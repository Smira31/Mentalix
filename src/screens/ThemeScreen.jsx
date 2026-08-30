import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
import { api } from '../lib/api'
import { Lock, Check, Sparkles } from 'lucide-react'
import BackButton from '../components/BackButton'
import JournalTextarea from '../components/JournalTextarea'
import MarkdownText from '../components/MarkdownText'
import Motif, { MotifArt } from '../components/Motif'
import WebActionBar from '../components/WebActionBar'
import { useMainButton, offerHomeScreen, cloud } from '../platform/telegram.hooks'
import { MENTOR_DRAFT_KEY, MENTOR_PERSONA_KEY } from './mentalix/personas'
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

function Shell({ style, footer, children }) {
  return (
    <div className={FULLSCREEN_SHELL_CLASS} style={style}>
      <div className={FULLSCREEN_HEADER_SLOT_CLASS} aria-hidden="true" />

      <div className={FULLSCREEN_SCROLL_CLASS}>
        <div className="w-full max-w-md mx-auto px-5 pt-2 pb-6 flex flex-col min-h-full">
          {children}
        </div>
      </div>

      {footer}
    </div>
  )
}

function Fact({ children }) {
  return (
    <li className="flex gap-3 text-[13px] text-muted leading-snug">
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

  /*
   * Три ниже — синхронизация локального состояния с внешним пропом/
   * данными без побочных эффектов (themeId — навигация, activeId/day —
   * момент сброса перед перезагрузкой), поэтому во время рендера, а
   * не в useEffect. Настоящие побочные эффекты (сетевые запросы) ниже
   * остаются в useEffect как есть.
   */
  const [seenThemeId, setSeenThemeId] = useState(themeId)
  if (seenThemeId !== themeId) {
    setSeenThemeId(themeId)
    setActiveId(themeId)
  }

  const [seenActiveId, setSeenActiveId] = useState(activeId)
  if (seenActiveId !== activeId) {
    setSeenActiveId(activeId)
    setData(null)
  }

  const [seenTextKey, setSeenTextKey] = useState({ day: null, data: null })
  if (data && (seenTextKey.day !== day || seenTextKey.data !== data)) {
    setSeenTextKey({ day, data })
    const current = data.days.find(x => x.day === day)
    setText(current?.reflection || '')
  }

  useEffect(() => {
    if (!user) return

    api.themes
      .list(user.id)
      .then(list => setThemes(Array.isArray(list) ? list : []))
      .catch(() => setThemes([]))
  }, [user])

  useEffect(() => {
    if (!user || !activeId) return

    let alive = true

    api.themes
      .get(activeId, user.id)
      .then(fresh => {
        if (!alive) return

        setData(fresh)
        setDay(Math.min(fresh.current_day || 1, fresh.days.length))

        /*
         * Первый вид выбирается по состоянию, а не по умолчанию:
         * тот, кто уже пишет вторую неделю подряд, не должен
         * каждый раз проходить через вступление.
         */
        const started = fresh.days.some(d => d.reflection)

        setView(started ? 'day' : 'intro')
      })
      .catch(console.error)

    return () => {
      alive = false
    }
  }, [user, activeId])

  async function persistReflection({ advance = true } = {}) {
    if (!data) return

    setSaving(true)

    try {
      await api.themes.reflect(activeId, user.id, day, text)
      platform.haptic('success')

      const fresh = await api.themes.get(activeId, user.id)

      setData(fresh)

      const answered = fresh.days.filter(x => x.reflection).length

      /*
       * Последний ответ недели ведёт не на восьмой день, которого
       * нет, а сразу в разбор: это и есть завершение темы.
       */
      if (advance) {
        if (answered === fresh.days.length) {
          setView('review')
        } else if (day < data.days.length) {
          setDay(day + 1)
        }
      }

      return true
    } catch (error) {
      console.error(error)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function save() {
    await persistReflection()
  }

  async function deepenReflection() {
    if (!current || !text.trim()) return

    const saved = await persistReflection({ advance: false })
    if (!saved) return

    try {
      sessionStorage.setItem(MENTOR_PERSONA_KEY, 'kompas')
      sessionStorage.setItem(
        MENTOR_DRAFT_KEY,
        [
          'Помоги мне пойти глубже в этом размышлении.',
          `Вопрос: ${current.text}`,
          current.prompt ? `Подсказка: ${current.prompt}` : '',
          `Мой ответ: ${text.trim()}`,
          'Не давай готовый совет сразу. Задай один точный вопрос, который поможет увидеть главное.',
        ]
          .filter(Boolean)
          .join('\n\n')
      )
    } catch (error) {
      console.error(error)
    }

    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'mentor')
    window.location.href = url.toString()
  }

  const current = data?.days?.find(x => x.day === day)
  const answered = data ? data.days.filter(x => x.reflection).length : 0
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

    cloud.get(HOME_OFFERED_KEY).then(already => {
      if (!alive || already) return

      cloud.set(HOME_OFFERED_KEY, '1')
      offerHomeScreen()
    })

    return () => {
      alive = false
    }
  }, [finished])
  const canSave = Boolean(text.trim()) && !current?.locked

  const mainText =
    view === 'intro'
      ? 'Начать'
      : view === 'review'
        ? 'Закрыть тему'
        : saving
          ? 'Сохраняю...'
          : current?.reflection
            ? 'Обновить мысль'
            : 'Обдумал'

  const mainOnClick =
    view === 'intro'
      ? () => {
          platform.haptic('light')
          setView('day')
        }
      : view === 'review'
        ? onBack
        : save

  const mainVisible = Boolean(data) && view !== 'list' && (view !== 'day' || !current?.locked)
  const mainEnabled = view === 'day' ? canSave && !saving : true

  /*
   * Хук вызывается всегда, а видимостью и текстом управляет вид.
   * Условный вызов сломал бы порядок хуков.
   */
  const writingDay = view === 'day' && !current?.locked

  useMainButton({
    text: mainText,
    onClick: mainOnClick,
    visible: mainVisible && !writingDay,
    enabled: mainEnabled,
    loading: saving,
  })

  const webAction =
    mainVisible && !writingDay
      ? { text: mainText, onClick: mainOnClick, disabled: !mainEnabled }
      : null

  if (!data) {
    return createPortal(
      <Shell style={style}>
        <BackButton onClick={onBack} />

        <p className="w-full m-auto px-6 text-center text-muted text-[13px]">Загрузка...</p>
      </Shell>,
      document.body
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
      <Shell style={style} footer={<WebActionBar action={webAction} />}>
        <BackButton onClick={onBack} />

        <div className="flex-1 flex flex-col pt-4 pb-6">
          <div className="-mx-5 h-[150px] text-gold mb-6">
            <Motif name="ryad" className="w-full h-full" />
          </div>

          <h2 className="font-display text-[24px] text-cream lowercase leading-tight text-left">
            {data.title}
          </h2>

          {data.subtitle && (
            <p className="text-[14px] text-muted leading-relaxed text-left mt-4">{data.subtitle}</p>
          )}

          <ul className="flex flex-col gap-3.5 mt-8">
            <Fact>{data.days.length} дней, каждый день — один вопрос. Не больше.</Fact>

            <Fact>
              Ответы сохраняются. В конце ты увидишь всю неделю сразу — и это главное, ради чего она
              нужна.
            </Fact>

            {data.free_days > 0 && data.free_days < data.days.length && (
              <Fact>Первые {data.free_days} дня открыты всем, остальные — часть Библиотеки.</Fact>
            )}

            <Fact>Пропущенный день не сгорает: к нему можно вернуться.</Fact>
          </ul>
        </div>
      </Shell>,
      document.body
    )
  }

  /* ── разбор: все ответы подряд ─────────────────────────── */

  if (view === 'review') {
    const written = data.days.filter(x => x.reflection)

    return createPortal(
      <Shell style={style} footer={<WebActionBar action={webAction} />}>
        <BackButton onClick={back} />

        <div className="text-left mt-4 mb-7">
          <div className="font-label text-[12px] text-faint font-semibold uppercase tracking-wide mb-2">
            {finished ? 'Неделя пройдена' : 'Что уже написано'}
          </div>

          <h2 className="font-display text-[22px] text-cream lowercase leading-tight">
            {data.title}
          </h2>

          <p className="text-[12px] text-muted mt-3">
            {written.length} из {data.days.length} дней
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {written.map(d => (
            <div key={d.day} className="rounded-[24px] bg-emerald border border-cream/10 p-5">
              <div className="font-label text-[11px] text-gold font-bold uppercase tracking-wide mb-2">
                День {d.day}
              </div>

              {d.prompt && <p className="text-[13px] text-muted leading-snug mb-3">{d.prompt}</p>}

              <MarkdownText
                content={d.reflection}
                className="space-y-2 text-[14px] text-cream leading-relaxed"
              />

              <button
                onClick={() => {
                  platform.haptic('light')
                  setDay(d.day)
                  setView('day')
                }}
                className="text-[12px] text-faint mt-3 bg-transparent border-0 p-0 active:opacity-60"
              >
                Изменить
              </button>
            </div>
          ))}
        </div>

        {finished && (
          <div className="rounded-[28px] bg-emerald border border-gold/25 px-6 py-8 text-center mt-4">
            <MotifArt name="ryad" size={110} className="mx-auto mb-4" />

            <h3 className="font-display text-[18px] text-cream leading-tight">
              Семь дней — семь мыслей
            </h3>

            <p className="text-[13px] text-muted mt-3 leading-relaxed">
              Это уже не чтение, а практика. Перечитай написанное через месяц — увидишь, что
              изменилось не в теме, а в тебе.
            </p>
          </div>
        )}
      </Shell>,
      document.body
    )
  }

  /* ── другие темы ───────────────────────────────────────── */

  if (view === 'list') {
    return createPortal(
      <Shell style={style}>
        <BackButton onClick={back} />

        <h2 className="font-display text-[22px] text-cream lowercase leading-tight mt-4 mb-1">
          все темы.
        </h2>

        <p className="text-[12px] text-faint mb-6">
          пройденные остаются с тобой — их можно перечитать
        </p>

        <div className="flex flex-col gap-3">
          {themes.map(item => {
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
                    <div className="font-display text-[16px] text-cream leading-tight lowercase">
                      {item.title}
                    </div>

                    {item.subtitle && (
                      <p className="text-[12px] text-muted leading-snug mt-1.5">{item.subtitle}</p>
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
      document.body
    )
  }

  /* ── день ──────────────────────────────────────────────── */

  return createPortal(
    <Shell style={style} footer={<WebActionBar action={webAction} />}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <BackButton onClick={onBack} />

        <button
          type="button"
          onClick={deepenReflection}
          disabled={!canSave || saving}
          className="flex h-11 items-center gap-2 rounded-full border border-cream/10 bg-emerald px-4 text-[12px] font-semibold text-cream transition-transform active:scale-95 disabled:opacity-35"
        >
          <Sparkles size={15} className="text-gold" />
          Наставник
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between gap-4 [@media(max-height:650px)]:hidden">
        <div className="flex items-center gap-4">
          {answered > 0 && (
            <button
              onClick={() => {
                platform.haptic('light')
                setView('review')
              }}
              className="border-0 bg-transparent p-0 text-[12px] text-gold active:opacity-60"
            >
              Мои ответы
            </button>
          )}

          {themes.length > 1 && (
            <button
              onClick={() => {
                platform.haptic('light')
                setView('list')
              }}
              className="border-0 bg-transparent p-0 text-[12px] text-muted active:opacity-60"
            >
              Все темы
            </button>
          )}
        </div>

        <button
          onClick={() => {
            platform.haptic('light')
            setView('intro')
          }}
          className="border-0 bg-transparent p-0 text-[12px] text-faint active:opacity-60"
        >
          {data.title}
        </button>
      </div>

      <div className="mb-6 flex gap-1.5" aria-label="Дни журнала">
        {data.days.map(d => {
          const active = d.day === day

          return (
            <button
              key={d.day}
              aria-label={`День ${d.day}`}
              aria-current={active ? 'step' : undefined}
              onClick={() => {
                platform.haptic('light')
                setDay(d.day)
              }}
              className={[
                'h-1.5 flex-1 overflow-hidden rounded-full border-0 p-0 transition-colors',
                active ? 'bg-gold' : d.reflection ? 'bg-gold/35' : 'bg-cream/10',
              ].join(' ')}
            >
              <span className="sr-only">
                {d.locked ? 'Закрыт' : d.reflection ? 'Заполнен' : 'Не заполнен'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="shrink-0">
        {current?.locked ? (
          <div className="rounded-[28px] bg-emerald px-6 py-8 text-center">
            <>
              <MotifArt name="povedenie" size={110} className="mx-auto mb-4" />

              <h3 className="font-display text-[18px] text-cream leading-tight">
                День {day} под замком
              </h3>

              <p className="text-[13px] text-muted mt-3 leading-relaxed">
                Первые {data.free_days} дня открыты всем. Остальные — часть Библиотеки.
              </p>

              <button
                onClick={() => platform.haptic('light')}
                className="cta-pill text-[14px] px-9 py-3.5 mt-6"
              >
                Скоро откроется
              </button>
            </>
          </div>
        ) : (
          <div className="text-left" data-testid="journal-day-content">
            <div className="mb-3 font-label text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
              День {day} из {data.days.length}
            </div>

            <h3 className="font-display text-[24px] leading-[1.16] text-cream [@media(max-height:650px)]:text-[20px]">
              {current?.text}
            </h3>

            {current?.prompt && (
              <p className="mt-5 border-l border-gold pl-4 text-[14px] leading-relaxed text-muted">
                {current.prompt}
              </p>
            )}
          </div>
        )}
      </div>

      {!current?.locked && (
        <JournalTextarea
          value={text}
          onChange={setText}
          placeholder="Записать мысль..."
          ariaLabel="Мысль по теме недели"
          className="mt-6 min-h-[18rem] flex-1"
          editorClassName="pb-24 md:pb-4"
          floatingToolbar
          desktopInline
          onSubmit={save}
          submitLabel={current?.reflection ? 'Обновить мысль' : 'Сохранить мысль'}
          submitDisabled={!canSave}
          submitLoading={saving}
          onDeepen={deepenReflection}
        />
      )}
    </Shell>,
    document.body
  )
}
