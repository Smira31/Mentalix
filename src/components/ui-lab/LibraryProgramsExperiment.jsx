import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Menu, Search, Sparkles } from 'lucide-react'
import SemanticGlyph from '../SemanticGlyph'
import './LibraryProgramsExperiment.css'

const DAYS = [
  ['01', 'Разгрузить ситуацию', 'Назови всё, что сейчас занимает внимание.'],
  ['02', 'Отделить факты', 'Заметь, что ты знаешь точно, а что пока предполагаешь.'],
  ['03', 'Увидеть ограничения', 'Выбери одно условие, с которым можно работать.'],
  ['04', 'Собрать варианты', 'Запиши несколько реалистичных направлений без оценки.'],
  ['05', 'Проверить цену шага', 'Сверься с ресурсами, временем и тем, что важно.'],
  ['06', 'Выбрать следующий шаг', 'Сформулируй действие, которое можно начать сегодня.'],
  ['07', 'Закрепить вывод', 'Подведи итог и реши, что заберёшь с собой дальше.'],
]

const ARTICLES = [
  [
    'one-step',
    'Фокус',
    'Как начать с одного шага',
    '6 минут',
    'Короткий материал о действии без лишнего давления.',
    'focus',
  ],
  [
    'inner-support',
    'Поддержка',
    'Как говорить с собой бережнее',
    '8 минут',
    'Заметь внутренний тон и выбери более точные слова.',
    'purpose',
  ],
  [
    'evening-pause',
    'Рефлексия',
    'Спокойно завершить день',
    '5 минут',
    'Несколько минут, чтобы отпустить незавершённое.',
    'journal',
  ],
]

const params = () => new URLSearchParams(window.location.search)

function SafeArea() {
  return (
    <div className="mx-library-programs__safe" aria-hidden="true">
      <span>MENTALIX</span>
      <Menu size={17} />
    </div>
  )
}

function TopBar({ onSearch }) {
  return (
    <header className="mx-library-programs__topbar">
      <h2>библиотека.</h2>
      <button type="button" aria-label="Открыть поиск" onClick={onSearch}>
        <Search size={19} />
      </button>
    </header>
  )
}

function ProgramGlyph() {
  return (
    <span className="mx-library-programs__program-glyph">
      <SemanticGlyph kind="focus" animated={false} />
    </span>
  )
}

function FeaturedProgram({ onOpen }) {
  return (
    <button type="button" className="mx-library-programs__featured" onClick={onOpen}>
      <div className="mx-library-programs__featured-art" aria-hidden="true">
        <ProgramGlyph />
      </div>
      <div className="mx-library-programs__featured-copy">
        <strong>Самодисциплина</strong>
        <span className="mx-library-programs__featured-arrow" aria-label="Открыть программу">
          <ArrowRight size={18} />
        </span>
      </div>
    </button>
  )
}

function ProgramRail({ onOpen }) {
  const programs = [
    ['Границы без лишнего напряжения', 'journal'],
    ['Неделя внимательного решения', 'purpose'],
  ]
  return (
    <div className="mx-library-programs__program-rail" aria-label="Другие программы">
      {programs.map(([title, kind]) => (
        <button
          type="button"
          key={title}
          onClick={() => onOpen(title)}
          className="mx-library-programs__small-program"
        >
          <span className="mx-library-programs__small-art" aria-hidden="true">
            <SemanticGlyph kind={kind} animated={false} />
          </span>
          <strong>{title}</strong>
        </button>
      ))}
    </div>
  )
}

function ArticleRail({ empty, onRead, readIds }) {
  if (empty)
    return (
      <div className="mx-library-programs__empty">
        <strong>Статьи появятся здесь</strong>
        <span>Бесплатные материалы уже в работе.</span>
      </div>
    )
  return (
    <div className="mx-library-programs__article-rail" aria-label="Бесплатные статьи">
      {ARTICLES.map(([id, eyebrow, title, duration, description, kind]) => (
        <button
          type="button"
          key={id}
          className="mx-library-programs__article"
          onClick={() => onRead(id)}
        >
          <span className="mx-library-programs__article-art" aria-hidden="true">
            <SemanticGlyph kind={kind} animated={false} />
          </span>
          <span className="mx-library-programs__eyebrow">{eyebrow}</span>
          <strong>{title}</strong>
          <small>
            {duration} · бесплатно {readIds.has(id) ? '· Прочитано' : ''}
          </small>
          <span className="mx-library-programs__article-description">{description}</span>
        </button>
      ))}
    </div>
  )
}

function BottomNav() {
  return (
    <nav className="mx-library-programs__bottom" aria-label="Основная навигация">
      <span>Сегодня</span>
      <span>Шаги</span>
      <span>Диалог</span>
      <span aria-current="page">Библиотека</span>
      <span>Прогресс</span>
    </nav>
  )
}

function Landing({ onOpenDetail }) {
  const [readIds, setReadIds] = useState(new Set())
  return (
    <div className="mx-library-programs__landing">
      <TopBar onSearch={() => {}} />
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <div>
            <h3>Программы</h3>
          </div>
        </div>
        <FeaturedProgram onOpen={onOpenDetail} />
        <ProgramRail onOpen={title => onOpenDetail(title)} />
      </section>
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <div>
            <span className="mx-library-programs__eyebrow">Без оплаты</span>
            <h3>Статьи</h3>
          </div>
          <BookOpen size={18} aria-hidden="true" />
        </div>
        <ArticleRail
          empty={false}
          readIds={readIds}
          onRead={id => setReadIds(current => new Set(current).add(id))}
        />
      </section>
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <div>
            <span className="mx-library-programs__eyebrow">Бесплатные инструменты</span>
            <h3>Направленные записи</h3>
          </div>
        </div>
        <button type="button" className="mx-library-programs__journal-row">
          <span>
            <Sparkles size={18} />
            <strong>Разобраться в решении</strong>
            <small>4 вопроса · бесплатно</small>
          </span>
          <ArrowRight size={17} />
        </button>
      </section>
    </div>
  )
}

function Detail({ title, onBack }) {
  return (
    <div className="mx-library-programs__detail">
      <button
        type="button"
        className="mx-library-programs__back"
        onClick={onBack}
        aria-label="Назад"
      >
        <ArrowLeft size={19} />
      </button>
      <div className="mx-library-programs__detail-art" aria-hidden="true">
        <ProgramGlyph />
        <span>
          одна задача
          <br />
          за раз
        </span>
      </div>
      <h2>{title}</h2>
      <p className="mx-library-programs__detail-status">Скоро</p>
    </div>
  )
}

export default function LibraryProgramsExperiment() {
  const review = params().get('review') === '1'
  const [screen, setScreen] = useState(() => params().get('screen') || 'landing')
  const setReviewScreen = (next, title) => {
    setScreen(next)
    if (title)
      window.history.replaceState(
        null,
        '',
        `?ui_lab=library-programs&review=1&screen=detail&program=${encodeURIComponent(title)}`
      )
  }
  const requestedTitle = params().get('program')
  const secondaryTitles = ['Границы без лишнего напряжения', 'Неделя внимательного решения']
  const detailTitle = secondaryTitles.includes(requestedTitle) ? requestedTitle : 'Самодисциплина'
  const product =
    screen === 'detail' ? (
      <Detail title={detailTitle} onBack={() => setReviewScreen('landing')} />
    ) : (
      <Landing onOpenDetail={title => setReviewScreen('detail', title)} />
    )
  return (
    <section
      className={`mx-library-programs${review ? ' mx-library-programs--review' : ''}`}
      aria-labelledby="library-programs-title"
    >
      {!review && (
        <>
          <div className="mx-library-programs__intro">
            <span className="mx-library-programs__eyebrow">
              MXL-LIBRARY-PROGRAMS-UI-LAB-001 · Preview-only
            </span>
            <h2 id="library-programs-title">Библиотека: программы</h2>
            <p>
              Канонический mobile-концепт: сначала понятная ценность, затем спокойное действие.
              Оплата и сохранение состояния не подключены.
            </p>
          </div>
        </>
      )}
      <div className="mx-library-programs__device">
        {review ? null : <SafeArea />}
        <div className="mx-library-programs__scroll">{product}</div>
        <BottomNav />
      </div>
    </section>
  )
}
