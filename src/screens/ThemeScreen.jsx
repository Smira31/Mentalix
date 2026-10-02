import { getFullscreenPortalTarget } from '../lib/fullscreenSurface'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { platform } from '../platform'
import { api } from '../lib/api'
import { peekThemeDetail, fetchThemeDetail, invalidateThemeDetail } from '../lib/themeDetailCache'
import { peekThemesData, fetchThemesData } from '../lib/themesDataCache'
import { Lock, Check } from 'lucide-react'
import { RoundBackButton } from '../components/NestedScreenHeader'
import JournalTextarea from '../components/JournalTextarea'
import MarkdownText from '../components/MarkdownText'
import Motif, { MotifArt } from '../components/Motif'
import WebActionBar from '../components/WebActionBar'
import { useMainButton, useBackButton, offerHomeScreen, cloud } from '../platform/telegram.hooks'
import { MENTOR_DRAFT_KEY, MENTOR_PERSONA_KEY } from './mentalix/personas'
import {
  useFullscreenSurface,
  FULLSCREEN_SHELL_CLASS,
  FULLSCREEN_HEADER_SLOT_CLASS,
  FULLSCREEN_SCROLL_CLASS,
} from '../lib/fullscreenSurface'
import {
  useVisualViewportGeometry,
  getKeyboardViewportHeight,
  isTelegramRuntime,
} from '../lib/visualViewport'

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
        <div className="w-full max-w-md mx-auto px-[var(--mx-screen-x)] pt-2 pb-6 flex flex-col min-h-full">
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

export default function ThemeScreen({ user, themeId, onBack, initialDay }) {
  const [themes, setThemes] = useState(() => (user ? peekThemesData(user.id) || [] : []))
  const [activeId, setActiveId] = useState(themeId)
  const cachedDetail = peekThemeDetail(user?.id, themeId)
  const [data, setData] = useState(cachedDetail)
  const [day, setDay] = useState(
    cachedDetail
      ? Math.min(initialDay || cachedDetail.current_day || 1, cachedDetail.days.length)
      : 1
  )
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState(
    cachedDetail
      ? initialDay || cachedDetail.days.some(d => d.reflection)
        ? 'day'
        : 'intro'
      : null
  )

  const { style, keyboardOpen } = useFullscreenSurface()
  const viewportGeometry = useVisualViewportGeometry()

  useBackButton(() => {
    if (view === 'review') {
      platform.haptic('light')
      setView('day')
    } else {
      onBack()
    }
  })

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
    setData(peekThemeDetail(user?.id, activeId))
  }

  const [seenTextKey, setSeenTextKey] = useState({ day: null, data: null })
  if (data && (seenTextKey.day !== day || seenTextKey.data !== data)) {
    setSeenTextKey({ day, data })
    const current = data.days.find(x => x.day === day)
    setText(current?.reflection || '')
  }

  useEffect(() => {
    if (!user) return

    fetchThemesData(user.id)
      .then(list => setThemes(Array.isArray(list) ? list : []))
      .catch(() => setThemes([]))
  }, [user])

  useEffect(() => {
    if (!user || !activeId) return

    let alive = true

    fetchThemeDetail(user.id, activeId)
      .then(fresh => {
        if (!alive || !fresh) return

        setData(fresh)
        setDay(Math.min(initialDay || fresh.current_day || 1, fresh.days.length))

        /*
         * Первый вид выбирается по состоянию, а не по умолчанию:
         * тот, кто уже пишет вторую неделю подряд, не должен
         * каждый раз проходить через вступление.
         * initialDay передаётся из карусели — пропускаем intro.
         */
        const started = fresh.days.some(d => d.reflection)

        setView(initialDay || started ? 'day' : 'intro')
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

      invalidateThemeDetail(user.id, activeId)
      const fresh = await fetchThemeDetail(user.id, activeId, { force: true })

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
  const canSave = Boolean(text.trim())
  const hasText = Boolean(text.trim())

  const visualHeight = viewportGeometry?.height
  const offsetTop = viewportGeometry?.offsetTop ?? 0
  const stableHeight = viewportGeometry?.stableHeight
  const keyboardViewportHeight = getKeyboardViewportHeight({
    isTelegram: isTelegramRuntime(),
    stableHeight,
    visualHeight,
  })
  const roundButtonStyle = keyboardOpen
    ? {
        position: 'fixed',
        top: `${(keyboardViewportHeight ?? visualHeight) + offsetTop - 56}px`,
        right: '16px',
        bottom: 'auto',
        zIndex: 71,
      }
    : {
        position: 'fixed',
        bottom: 'calc(var(--app-safe-bottom) + 16px)',
        right: '16px',
        zIndex: 71,
      }

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

  const mainVisible = Boolean(data)
  const mainEnabled = view === 'day' ? canSave && !saving : true

  /*
   * Хук вызывается всегда, а видимостью и текстом управляет вид.
   * Условный вызов сломал бы порядок хуков.
   */
  const writingDay = view === 'day'

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
        <RoundBackButton onClick={onBack} />

        <p className="w-full m-auto px-6 text-center text-muted text-[13px]">Загрузка...</p>
      </Shell>,
      getFullscreenPortalTarget()
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
        <RoundBackButton onClick={onBack} />

        <div className="flex-1 flex flex-col pt-4 pb-6">
          <div className="-mx-[var(--mx-screen-x)] h-[150px] text-gold mb-6">
            <Motif name="ryad" className="w-full h-full" />
          </div>

          <h2 className="font-display mx-type-page text-cream lowercase leading-tight text-left">
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

            <Fact>Пропущенный день не сгорает: к нему можно вернуться.</Fact>
          </ul>
        </div>
      </Shell>,
      getFullscreenPortalTarget()
    )
  }

  /* ── разбор: все ответы подряд ─────────────────────────── */

  if (view === 'review') {
    const written = data.days.filter(x => x.reflection)

    return createPortal(
      <Shell style={style} footer={<WebActionBar action={webAction} />}>
        <RoundBackButton onClick={back} />

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
                className="space-y-2 text-[16px] font-normal text-cream leading-relaxed"
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
      getFullscreenPortalTarget()
    )
  }

  /* ── день ──────────────────────────────────────────────── */

  return createPortal(
    <Shell style={style} footer={<WebActionBar action={webAction} />}>
      <div className="mb-2">
        <RoundBackButton onClick={onBack} />
      </div>

      <div className="shrink-0">
        <div className="text-left" data-testid="journal-day-content">
          <div className="mb-2 font-label text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
            День {day} из {data.days.length}
          </div>

          <h3 className="font-display text-[20px] font-bold leading-[1.16] text-cream">
            {current?.text}
          </h3>

          {current?.prompt && (
            <p className="mt-3 border-l border-gold pl-4 text-[16px] font-normal leading-relaxed text-muted">
              {current.prompt}
            </p>
          )}
        </div>
      </div>

      <JournalTextarea
        value={text}
        onChange={setText}
        placeholder="Записать мысль..."
        ariaLabel="Мысль по теме недели"
        className="mt-6 flex-1"
        editorClassName="!text-[16px] font-normal pb-16"
        formatting={false}
        floatingToolbar={false}
        writingCanvas={false}
        autoFocus={!current?.reflection}
        onSubmit={save}
        submitLabel={current?.reflection ? 'Обновить мысль' : 'Сохранить мысль'}
        submitDisabled={!canSave}
        submitLoading={saving}
      />

      <button
        type="button"
        aria-label={hasText ? 'Сохранить мысль' : undefined}
        onClick={hasText ? save : onBack}
        disabled={saving}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efefef] text-[22px] font-semibold text-[#111] transition-transform active:scale-95"
        style={roundButtonStyle}
      >
        {hasText ? '›' : '✕'}
      </button>
    </Shell>,
    getFullscreenPortalTarget()
  )
}
