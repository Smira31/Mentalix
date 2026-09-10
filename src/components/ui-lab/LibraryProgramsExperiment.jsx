import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  LockKeyhole,
  Menu,
  Search,
  Sparkles,
  X,
} from 'lucide-react'

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
    'Короткий материал о действии без лишнего давления.',
    'focus',
  ],
  [
    'inner-support',
    'Поддержка',
    'Как говорить с собой бережнее',
    'Заметь внутренний тон и выбери более точные слова.',
    'purpose',
  ],
  [
    'evening-pause',
    'Рефлексия',
    'Спокойно завершить день',
    'Несколько минут, чтобы отпустить незавершённое.',
    'journal',
  ],
]

const STATE_OPTIONS = [
  ['ready', 'Обычный'],
  ['active', 'Продолжить'],
  ['completed', 'Завершено'],
  ['loading', 'Загрузка'],
  ['empty', 'Пусто'],
]

function TopBar({ onSearch }) {
  return (
    <header className="mx-library-programs__topbar">
      <div>
        <span className="mx-library-programs__eyebrow">MENTALIX · БИБЛИОТЕКА</span>
        <h2>библиотека.</h2>
      </div>
      <button type="button" aria-label="Открыть поиск" onClick={onSearch}>
        <Search size={19} />
      </button>
    </header>
  )
}

function ContinueCard({ completed, onOpen }) {
  return (
    <button type="button" className="mx-library-programs__continue" onClick={onOpen}>
      <span className="mx-library-programs__continue-icon" aria-hidden="true">
        {completed ? <Check size={19} /> : <Clock3 size={19} />}
      </span>
      <span>
        <span className="mx-library-programs__eyebrow">
          {completed ? 'Программа завершена' : 'Продолжить'}
        </span>
        <strong>7 дней к ясному следующему шагу</strong>
        <small>
          {completed ? 'Можно вернуться к итоговой рефлексии' : 'День 3 из 7 · около 10 минут'}
        </small>
      </span>
      <ArrowRight size={17} aria-hidden="true" />
    </button>
  )
}

function ProgramGlyph() {
  return <SemanticGlyph kind="focus" animated={false} />
}

function FeaturedProgram({ active, completed, onOpen }) {
  return (
    <button type="button" className="mx-library-programs__featured" onClick={onOpen}>
      <div className="mx-library-programs__featured-art" aria-hidden="true">
        <ProgramGlyph />
        <span className="mx-library-programs__featured-mark">07</span>
      </div>
      <div className="mx-library-programs__featured-copy">
        <span className="mx-library-programs__eyebrow">
          {completed ? 'Пройдено' : 'Первая программа · 7 дней'}
        </span>
        <strong>7 дней к ясному следующему шагу</strong>
        <p>Разобрать перегруженную ситуацию и сформулировать одно реалистичное действие.</p>
        <span className="mx-library-programs__meta">
          {active
            ? 'День 3 из 7'
            : completed
              ? 'Итоговая рефлексия доступна'
              : 'Первый день бесплатно'}
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </button>
  )
}

function ProgramRail({ onOpen }) {
  return (
    <div className="mx-library-programs__program-rail" aria-label="Другие программы">
      {['Границы без лишнего напряжения', 'Неделя внимательного решения'].map((title, index) => (
        <button
          type="button"
          key={title}
          onClick={onOpen}
          className="mx-library-programs__small-program"
        >
          <span className="mx-library-programs__small-art" aria-hidden="true">
            <SemanticGlyph kind={index ? 'purpose' : 'journal'} animated={false} />
          </span>
          <span className="mx-library-programs__eyebrow">{index ? '10 дней' : '7 дней'}</span>
          <strong>{title}</strong>
          <small>Авторская последовательность</small>
        </button>
      ))}
    </div>
  )
}

function ArticleRail({ empty }) {
  if (empty) {
    return (
      <div className="mx-library-programs__empty">
        <strong>Статьи появятся здесь</strong>
        <span>Бесплатные материалы уже в работе.</span>
      </div>
    )
  }
  return (
    <div className="mx-library-programs__article-rail" aria-label="Бесплатные статьи">
      {ARTICLES.map(([, eyebrow, title, description, kind]) => (
        <article key={title} className="mx-library-programs__article">
          <span className="mx-library-programs__article-art" aria-hidden="true">
            <SemanticGlyph kind={kind} animated={false} />
          </span>
          <span className="mx-library-programs__eyebrow">{eyebrow} · бесплатно</span>
          <strong>{title}</strong>
          <small>{description}</small>
        </article>
      ))}
    </div>
  )
}

function BottomNav() {
  return (
    <nav className="mx-library-programs__bottom" aria-label="Демо основной навигации">
      <span>Сегодня</span>
      <span>Практики</span>
      <span>Наставник</span>
      <span aria-current="page">Библиотека</span>
      <span>Тренды</span>
    </nav>
  )
}

function Landing({ demoState, onOpenDetail }) {
  const active = demoState === 'active'
  const completed = demoState === 'completed'
  const empty = demoState === 'empty'
  if (demoState === 'loading')
    return (
      <div className="mx-library-programs__landing">
        <TopBar />
        <div className="mx-library-programs__skeleton" aria-label="Загрузка библиотеки">
          <i />
          <i />
          <i />
        </div>
      </div>
    )
  return (
    <div className="mx-library-programs__landing">
      <TopBar onSearch={() => {}} />
      {active || completed ? <ContinueCard completed={completed} onOpen={onOpenDetail} /> : null}
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <div>
            <span className="mx-library-programs__eyebrow">Авторские последовательности</span>
            <h3>Программы</h3>
          </div>
          <span className="mx-library-programs__free-note">первый день бесплатно</span>
        </div>
        <FeaturedProgram active={active} completed={completed} onOpen={onOpenDetail} />
        <ProgramRail onOpen={onOpenDetail} />
      </section>
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <div>
            <span className="mx-library-programs__eyebrow">Без оплаты</span>
            <h3>Статьи</h3>
          </div>
          <BookOpen size={18} aria-hidden="true" />
        </div>
        <ArticleRail empty={empty} />
      </section>
      <section className="mx-library-programs__section">
        <div className="mx-library-programs__section-title">
          <div>
            <span className="mx-library-programs__eyebrow">Инструменты рефлексии</span>
            <h3>Направленные записи</h3>
          </div>
        </div>
        <div className="mx-library-programs__journal-row">
          <span>
            <Sparkles size={18} />
            <strong>Разобраться в решении</strong>
            <small>4 вопроса · бесплатно</small>
          </span>
          <ArrowRight size={17} />
        </div>
      </section>
    </div>
  )
}

function Detail({ demoState, onBack, onFreeDay, onPay }) {
  const completed = demoState === 'completed'
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
          один шаг
          <br />
          за раз
        </span>
      </div>
      <span className="mx-library-programs__eyebrow">7 дней · 10 минут в день</span>
      <h2>7 дней к ясному следующему шагу</h2>
      <p className="mx-library-programs__lead">
        Короткая последовательность заданий, которая помогает разобрать перегруженную ситуацию и
        сформулировать один реалистичный следующий шаг.
      </p>
      <div className="mx-library-programs__fit">
        <strong>Подойдёт, если</strong>
        <span>в голове много незавершённого и хочется начать без рывка.</span>
      </div>
      <section>
        <div className="mx-library-programs__detail-heading">
          <h3>Семь дней</h3>
          <span>постепенно</span>
        </div>
        <ol className="mx-library-programs__days">
          {DAYS.map(([day, title, description]) => (
            <li key={day} className={completed || day === '01' ? 'is-open' : ''}>
              <span>{day}</span>
              <div>
                <strong>{title}</strong>
                <small>{description}</small>
              </div>
              {completed || day === '01' ? <Check size={16} /> : <LockKeyhole size={15} />}
            </li>
          ))}
        </ol>
      </section>
      <section className="mx-library-programs__included">
        <strong>Что входит</strong>
        <span>ежедневные задания · checkpoints · итоговая рефлексия</span>
        <small>
          Это не терапия и не медицинская рекомендация. Если тебе нужна помощь специалиста, обратись
          к нему напрямую.
        </small>
      </section>
      {!completed && (
        <>
          <button type="button" className="mx-library-programs__primary" onClick={onFreeDay}>
            Попробовать первый день
          </button>
          <button type="button" className="mx-library-programs__secondary" onClick={onPay}>
            Получить программу за 790 ₽
          </button>
          <p className="mx-library-programs__purchase-note">
            Разовая покупка · доступ остаётся у тебя
          </p>
        </>
      )}
      {completed && (
        <div className="mx-library-programs__completed">
          <Check size={18} /> Программа завершена · итоговая рефлексия открыта
        </div>
      )}
    </div>
  )
}

function FreeDay({ onBack, onFinish }) {
  return (
    <div className="mx-library-programs__detail">
      <button
        type="button"
        className="mx-library-programs__back"
        onClick={onBack}
        aria-label="К программе"
      >
        <ArrowLeft size={19} />
      </button>
      <span className="mx-library-programs__eyebrow">День 1 · бесплатно</span>
      <h2>Что сейчас занимает больше всего внимания?</h2>
      <p className="mx-library-programs__lead">
        Запиши всё, что приходит в голову. Не нужно сразу искать решение — сначала освободим немного
        места.
      </p>
      <textarea aria-label="Твой ответ" placeholder="Можно начать с нескольких слов…" />
      <button type="button" className="mx-library-programs__primary" onClick={onFinish}>
        Сохранить и вернуться
      </button>
    </div>
  )
}

function FakeDoor({ onClose }) {
  return (
    <div className="mx-library-programs__sheet-backdrop" role="presentation">
      <section
        className="mx-library-programs__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fake-door-title"
      >
        <button
          type="button"
          className="mx-library-programs__sheet-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X size={19} />
        </button>
        <span className="mx-library-programs__eyebrow">Небольшой вопрос</span>
        <h2 id="fake-door-title">Что ты ожидаешь получить от программы?</h2>
        <p>Оплата пока не открыта. Мы проверяем, насколько понятен и ценен этот формат.</p>
        <div className="mx-library-programs__answers">
          <button type="button" onClick={onClose}>
            Разобраться в одной ситуации
          </button>
          <button type="button" onClick={onClose}>
            Собрать спокойный план
          </button>
          <button type="button" onClick={onClose}>
            Дойти до следующего шага
          </button>
          <button type="button" onClick={onClose}>
            Свой вариант
          </button>
        </div>
        <textarea aria-label="Дополнение" placeholder="Можно добавить своими словами…" />
      </section>
    </div>
  )
}

export default function LibraryProgramsExperiment() {
  const [demoState, setDemoState] = useState('ready')
  const [screen, setScreen] = useState('landing')
  const [sheetOpen, setSheetOpen] = useState(false)
  const reset = next => {
    setDemoState(next)
    setScreen('landing')
    setSheetOpen(false)
  }
  return (
    <section className="mx-library-programs" aria-labelledby="library-programs-title">
      <div className="mx-library-programs__intro">
        <span className="mx-library-programs__eyebrow">
          MXL-LIBRARY-PROGRAMS-UI-LAB-001 · Preview-only
        </span>
        <h2 id="library-programs-title">Библиотека: программы</h2>
        <p>
          Канонический mobile-концепт: сначала понятная ценность, затем спокойное действие. Оплата и
          сохранение состояния не подключены.
        </p>
      </div>
      <div className="mx-library-programs__state-switch" aria-label="Demo-состояние">
        {STATE_OPTIONS.map(([key, label]) => (
          <button
            type="button"
            key={key}
            aria-pressed={demoState === key}
            onClick={() => reset(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mx-library-programs__device">
        <div className="mx-library-programs__safe">
          <span>MENTALIX</span>
          <Menu size={17} />
        </div>
        <div className="mx-library-programs__scroll">
          {screen === 'landing' && (
            <Landing demoState={demoState} onOpenDetail={() => setScreen('detail')} />
          )}
          {screen === 'detail' && (
            <Detail
              demoState={demoState}
              onBack={() => setScreen('landing')}
              onFreeDay={() => setScreen('free-day')}
              onPay={() => setSheetOpen(true)}
            />
          )}
          {screen === 'free-day' && (
            <FreeDay onBack={() => setScreen('detail')} onFinish={() => setScreen('detail')} />
          )}
        </div>
        <BottomNav />
        {sheetOpen && <FakeDoor onClose={() => setSheetOpen(false)} />}
      </div>
    </section>
  )
}
