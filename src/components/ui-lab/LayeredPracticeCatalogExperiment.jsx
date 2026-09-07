import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight, RefreshCw } from 'lucide-react'

import { api } from '../../lib/api'
import { readOneOffPracticeHistory } from '../../lib/oneOffPracticeHistory'
import { localDayId } from '../../lib/morningPilot'
import { platform } from '../../platform'
import ThemeScreen from '../../screens/ThemeScreen'
import JournalFlow from '../../screens/JournalFlow'
import JournalArt from '../practice-art/JournalArt'
import SemanticGlyph from '../SemanticGlyph'
import { ExperimentShell } from './UiExperiments'
import {
  buildPracticeViewModels,
  getPracticeByKey,
  PRACTICE_COLLECTIONS as LAYERED_COLLECTIONS,
  PRACTICE_RAIL_KEYS as LAYERED_RAIL_KEYS,
} from '../../lib/practiceCatalogRegistry'
import {
  LAYERED_CATALOG_DEMO_COMPLETED_KEYS,
  LAYERED_CATALOG_DEMO_DATA,
} from './layeredPracticeCatalogDemoData'

import './LayeredPracticeCatalogExperiment.css'

function usePreviewData(user) {
  const [data, setData] = useState(
    user ? { rituals: [], ascezas: [], themes: [] } : LAYERED_CATALOG_DEMO_DATA
  )
  const [status, setStatus] = useState(user ? 'loading' : 'demo')
  const [error, setError] = useState(null)

  async function load() {
    if (!user?.id) {
      setData(LAYERED_CATALOG_DEMO_DATA)
      setStatus('demo')
      return
    }

    setStatus('loading')
    setError(null)
    try {
      const [rituals, ascezas, themes] = await Promise.all([
        api.rituals.list(user.id),
        api.ascezas.list(user.id),
        api.themes.list(user.id),
      ])
      setData({
        rituals: Array.isArray(rituals) ? rituals : [],
        ascezas: Array.isArray(ascezas) ? ascezas : [],
        themes: Array.isArray(themes) ? themes : [],
      })
      setStatus('ready')
    } catch (nextError) {
      setError(nextError)
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
  }, [user?.id])

  return { ...data, status, error, reload: load }
}

function PracticeGlyph({ kind, highlighted = false }) {
  return <SemanticGlyph kind={kind} animated={false} highlighted={highlighted} />
}

function PracticeRail({ practices, onOpen }) {
  const railPractices = LAYERED_RAIL_KEYS.map(key => getPracticeByKey(practices, key)).filter(
    Boolean
  )

  return (
    <section
      className="mx-layered-catalog__section mx-layered-catalog__rail-section"
      aria-label="Новое и рекомендованное"
    >
      <div className="mx-layered-catalog__rail-label">Выбери новое или рекомендованное</div>
      <div className="mx-layered-catalog__rail" data-accent="gold">
        {railPractices.map((practice, index) => (
          <button
            className="mx-layered-catalog__rail-card"
            type="button"
            key={practice.key}
            disabled={!practice.available}
            onClick={() => onOpen(practice)}
          >
            <span className="mx-layered-catalog__avatar" aria-hidden="true">
              <PracticeGlyph kind={practice.kind} highlighted={index === 0} />
            </span>
            <span className="mx-layered-catalog__rail-menu" aria-hidden="true">
              •••
            </span>
            <span className="mx-layered-catalog__rail-badge">
              {index === 0 ? 'НОВОЕ' : 'РЕКОМЕНДОВАНО'}
            </span>
            <span className="mx-layered-catalog__rail-category">{practice.section}</span>
            <strong>{practice.title}</strong>
            <small>{practice.subtitle}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function ThemeCarousel({ themes, onOpen }) {
  const [themeIndex, setThemeIndex] = useState(0)
  const trackRef = useRef(null)

  useEffect(() => {
    setThemeIndex(index => Math.min(index, Math.max(0, themes.length - 1)))
  }, [themes.length])

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    setThemeIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  if (themes.length === 0) {
    return (
      <section className="mx-layered-catalog__section" aria-labelledby="theme-title">
        <div className="mx-layered-catalog__section-head">
          <div>
            <span>Тема недели</span>
            <h3 id="theme-title">Пока нет тем</h3>
          </div>
        </div>
        <p className="mx-layered-catalog__empty-copy">
          Карусель появится, когда backend вернёт опубликованные темы для этого пользователя.
        </p>
      </section>
    )
  }

  const activeTheme = themes[themeIndex]

  return (
    <section className="mx-layered-catalog__section" aria-labelledby="theme-title">
      <div className="mx-layered-catalog__section-head">
        <div>
          <span>Тема недели</span>
          <h3 id="theme-title">Один вопрос</h3>
        </div>
        <small>
          {themeIndex + 1} / {themes.length}
        </small>
      </div>
      <div className="mx-layered-catalog__theme-track" ref={trackRef} onScroll={handleScroll}>
        {themes.map(theme => (
          <button
            className="mx-layered-catalog__theme"
            type="button"
            key={theme.id}
            onClick={() => onOpen(theme)}
          >
            <span className="mx-layered-catalog__theme-copy">
              <span className="mx-layered-catalog__theme-number">
                {String(theme.sortOrder || themes.indexOf(theme) + 1).padStart(2, '0')}
              </span>
              <strong className="mx-layered-catalog__theme-question">{theme.title}</strong>
              <span className="mx-layered-catalog__theme-subtitle">{theme.subtitle}</span>
              <span className="mx-layered-catalog__theme-progress">
                {theme.reflected_days || 0}/{theme.total_days || 0} дней
              </span>
            </span>
          </button>
        ))}
      </div>
      <span className="mx-layered-catalog__dots" aria-hidden="true">
        {themes.map(theme => (
          <i
            key={theme.id}
            data-active={themes.indexOf(theme) === themeIndex ? 'true' : undefined}
          />
        ))}
      </span>
      <div className="mx-layered-catalog__theme-actions">
        <button
          type="button"
          className="mx-layered-catalog__pill"
          onClick={() => onOpen(activeTheme)}
        >
          Открыть тему <ArrowRight size={15} />
        </button>
      </div>
    </section>
  )
}

function CollectionTile({ collection, onOpen }) {
  return (
    <button
      className="mx-layered-catalog__collection"
      type="button"
      onClick={() => onOpen(collection)}
    >
      <span className="mx-layered-catalog__collection-art" aria-hidden="true">
        <PracticeGlyph kind={collection.kind} />
      </span>
      <strong>{collection.title}</strong>
      <small>{collection.description}</small>
      <ChevronRight
        className="mx-layered-catalog__collection-chevron"
        size={17}
        aria-hidden="true"
      />
    </button>
  )
}

function Collections({ onOpen }) {
  return (
    <section className="mx-layered-catalog__section" aria-labelledby="collections-title">
      <div className="mx-layered-catalog__section-head">
        <div>
          <span>Собрано для тебя</span>
          <h3 id="collections-title">Коллекции</h3>
        </div>
        <small>5</small>
      </div>
      <div className="mx-layered-catalog__collections">
        {LAYERED_COLLECTIONS.map(collection => (
          <CollectionTile key={collection.key} collection={collection} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}

function itemLabel(item) {
  return item?.name || item?.title || item?.text || 'Без названия'
}

function CollectionScreen({ collection, practices, rituals, ascezas, onBack, onOpenPractice }) {
  const practiceItems = (collection.practiceKeys || [])
    .map(key => getPracticeByKey(practices, key))
    .filter(Boolean)
  const liveItems =
    collection.source === 'rituals' ? rituals : collection.source === 'ascezas' ? ascezas : []
  const items = liveItems.length > 0 ? liveItems : practiceItems

  return (
    <section className="mx-layered-category" aria-labelledby="layered-category-title">
      <header className="mx-layered-category__header">
        <button type="button" aria-label="Назад к коллекциям" onClick={onBack}>
          <ArrowLeft size={19} />
        </button>
        <div className="mx-layered-category__heading">
          <h3 id="layered-category-title">{collection.title}.</h3>
          <p>{collection.description}</p>
        </div>
        <span aria-hidden="true" />
      </header>
      <div className="mx-layered-category__body">
        <section className="mx-layered-category__section">
          <span className="mx-layered-category__label">
            {collection.source ? 'Твои данные' : 'Практики'}
          </span>
          <div className="mx-layered-category__grid">
            {items.map(item => {
              const practice = item.key ? item : null
              const key = practice?.key || `${collection.key}-${item.id || itemLabel(item)}`
              return (
                <button
                  className="mx-layered-category__card"
                  type="button"
                  key={key}
                  onClick={() => practice && onOpenPractice(practice)}
                  disabled={!practice}
                >
                  <span className="mx-layered-category__art" aria-hidden="true">
                    <span className="mx-layered-category__art-glyph">
                      <PracticeGlyph kind={practice?.kind || collection.kind} />
                    </span>
                    <span className="mx-layered-category__art-base" />
                  </span>
                  <strong>{practice?.title || itemLabel(item)}</strong>
                  <small>
                    {practice?.subtitle ||
                      (collection.source === 'rituals'
                        ? item.today_level
                          ? 'сегодня выполнено'
                          : 'открыть ритуалы'
                        : item.today_status === 'held'
                          ? 'сегодня удержано'
                          : 'открыть аскезы')}
                  </small>
                  {practice?.completedToday && (
                    <span className="mx-layered-category__completion">сегодня</span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </section>
  )
}

function JournalDemoScreen({ onBack }) {
  const [draft, setDraft] = useState('')

  return (
    <section className="mx-layered-journal-demo" aria-labelledby="journal-demo-title">
      <button type="button" className="mx-layered-journal-demo__back" onClick={onBack}>
        <ArrowLeft size={18} /> Назад в каталог
      </button>
      <span className="mx-layered-journal-demo__eyebrow">Preview-only · без сохранения</span>
      <h3 id="journal-demo-title">Собери день в четыре шага</h3>
      <p>
        В Telegram-сессии эта кнопка откроет настоящий JournalFlow. Здесь можно посмотреть только
        форму и ритм записи.
      </p>
      <textarea
        value={draft}
        onChange={event => setDraft(event.target.value)}
        placeholder="Начни писать…"
        aria-label="Демонстрационная запись журнала"
      />
      <button type="button" className="mx-layered-catalog__pill" onClick={onBack}>
        Закрыть preview
      </button>
    </section>
  )
}

function JournalBanner({ onOpen }) {
  return (
    <article className="mx-layered-catalog__journal-hero">
      <div className="mx-layered-catalog__journal-hero-art" aria-hidden="true">
        <JournalArt />
      </div>
      <div className="mx-layered-catalog__journal-hero-copy">
        <span>Журнал</span>
        <h3>Собери день в четыре шага</h3>
        <p>Идея, действие, анализ и новый шаг — спокойно, в своём темпе.</p>
        <button type="button" className="mx-layered-catalog__pill" onClick={onOpen}>
          Открыть журнал <ArrowRight size={15} />
        </button>
      </div>
    </article>
  )
}

function ThemeDemoScreen({ theme, onBack }) {
  return (
    <section className="mx-layered-theme-demo" aria-labelledby="theme-demo-title">
      <button type="button" className="mx-layered-journal-demo__back" onClick={onBack}>
        <ArrowLeft size={18} /> Назад в каталог
      </button>
      <span className="mx-layered-journal-demo__eyebrow">
        Демонстрационные данные · без сохранения
      </span>
      <h3 id="theme-demo-title">{theme.title}</h3>
      <p>{theme.subtitle}</p>
      <div className="mx-layered-theme-demo__progress">
        <strong>
          {theme.reflected_days}/{theme.total_days} дней
        </strong>
        <span>В Telegram-сессии здесь откроется настоящий ThemeScreen с backend themeId.</span>
      </div>
      <button type="button" className="mx-layered-catalog__pill" onClick={onBack}>
        Вернуться к каталогу
      </button>
    </section>
  )
}

function PreviewStatus({ status, error, onReload }) {
  if (status === 'ready') return null

  if (status === 'demo') {
    return (
      <div
        className="mx-layered-catalog__data-note mx-layered-catalog__data-note--demo"
        role="status"
      >
        <strong>Демонстрационные данные · без сохранения</strong>
        <span>
          Каталог показывает реальные структуры API и flow-связи. Введённый текст и действия не
          записываются в аккаунт.
        </span>
      </div>
    )
  }

  if (status === 'loading') {
    return <div className="mx-layered-catalog__data-note">Загружаю реальные практики и темы…</div>
  }

  return (
    <div className="mx-layered-catalog__data-note" role="alert">
      <strong>Не удалось загрузить live-данные</strong>
      <span>{error?.message || 'Проверь API-сессию и повтори загрузку.'}</span>
      <button type="button" className="mx-layered-catalog__pill" onClick={onReload}>
        <RefreshCw size={14} /> Повторить
      </button>
    </div>
  )
}

export default function LayeredPracticeCatalogExperiment({ mode = 'after' }) {
  const previewUser = useMemo(() => platform.getUser?.() || null, [])
  const { rituals, ascezas, themes, status, error, reload } = usePreviewData(previewUser)
  const [selectedCollection, setSelectedCollection] = useState(null)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [journalOpen, setJournalOpen] = useState(false)
  const [openedPractice, setOpenedPractice] = useState(null)
  const completedToday = useMemo(() => {
    if (!previewUser) return new Set(LAYERED_CATALOG_DEMO_COMPLETED_KEYS)

    return new Set(
      readOneOffPracticeHistory(previewUser.id)
        .filter(entry => entry.day === localDayId(new Date()))
        .map(entry => entry.practiceKey)
    )
  }, [previewUser?.id])
  const practices = useMemo(
    () => buildPracticeViewModels({ rituals, ascezas, completedToday }),
    [rituals, ascezas, completedToday]
  )

  if (journalOpen && previewUser) {
    return (
      <ExperimentShell
        number="26"
        eyebrow="UI-EXP-003 · live journal preview"
        title="Журнал"
        purpose="Реальный JournalFlow открывается из крупного journal-banner."
        mode={mode}
      >
        <JournalFlow
          userId={previewUser.id}
          onClose={() => setJournalOpen(false)}
          onOpenGuided={() => setJournalOpen(false)}
        />
      </ExperimentShell>
    )
  }

  if (journalOpen) {
    return (
      <ExperimentShell
        number="26"
        eyebrow="UI-EXP-003 · anonymous journal preview"
        title="Журнал"
        purpose="Демонстрация крупного journal-banner без пользователя; запись не сохраняется."
        mode={mode}
      >
        <JournalDemoScreen onBack={() => setJournalOpen(false)} />
      </ExperimentShell>
    )
  }

  if (selectedTheme && !previewUser) {
    return (
      <ExperimentShell
        number="26"
        eyebrow="UI-EXP-003 · demo theme preview"
        title="Тема недели"
        purpose="Демонстрационная тема в форме реального API-объекта; сохранения нет."
        mode={mode}
      >
        <ThemeDemoScreen theme={selectedTheme} onBack={() => setSelectedTheme(null)} />
      </ExperimentShell>
    )
  }

  if (selectedTheme && previewUser) {
    return (
      <ExperimentShell
        number="26"
        eyebrow="UI-EXP-003 · live theme preview"
        title="Тема недели"
        purpose="Реальный ThemeScreen с backend themeId; UI Lab не подменяет тематический flow мокапом."
        mode={mode}
      >
        <ThemeScreen
          user={previewUser}
          themeId={selectedTheme.id}
          onBack={() => setSelectedTheme(null)}
        />
      </ExperimentShell>
    )
  }

  return (
    <ExperimentShell
      number="26"
      eyebrow="UI-EXP-003 · live catalog preview"
      title="практики."
      purpose="Preview-only композиция из реальных practice keys, live themes и пяти production-коллекций."
      mode={mode}
    >
      <div className="mx-layered-catalog" data-accent="gold">
        <JournalBanner onOpen={() => setJournalOpen(true)} />
        <PreviewStatus status={status} error={error} onReload={reload} />
        <PracticeRail practices={practices} onOpen={practice => setOpenedPractice(practice)} />
        <ThemeCarousel themes={themes} onOpen={theme => setSelectedTheme(theme)} />
        <Collections onOpen={collection => setSelectedCollection(collection)} />
        {selectedCollection && (
          <CollectionScreen
            collection={selectedCollection}
            practices={practices}
            rituals={rituals}
            ascezas={ascezas}
            onBack={() => setSelectedCollection(null)}
            onOpenPractice={practice => setOpenedPractice(practice)}
          />
        )}
        {openedPractice && (
          <div className="mx-layered-catalog__mapping-note" role="status">
            <strong>{openedPractice.title}</strong>
            <span>
              Реальный mapping: <code>practiceKey={openedPractice.key}</code> →{' '}
              <code>setSub('{openedPractice.sub}')</code>
            </span>
            <button
              type="button"
              className="mx-layered-catalog__pill"
              onClick={() => setOpenedPractice(null)}
            >
              Закрыть
            </button>
          </div>
        )}
      </div>
    </ExperimentShell>
  )
}
