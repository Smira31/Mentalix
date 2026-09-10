import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
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

const STATE_OPTIONS = [
  ['ready', 'Обычный'],
  ['active', 'Продолжить'],
  ['completed', 'Завершено'],
  ['loading', 'Загрузка'],
  ['empty', 'Пусто'],
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
        <small>{completed ? 'Итоговая рефлексия доступна' : 'День 3 из 7 · около 10 минут'}</small>
      </span>
      <ArrowRight size={17} aria-hidden="true" />
    </button>
  )
}

function FeaturedProgram({ onOpen }) {
  return (
    <button type="button" className="mx-library-programs__featured" onClick={onOpen}>
      <div className="mx-library-programs__featured-art" aria-hidden="true">
        <ProgramGlyph />
      </div>
      <div className="mx-library-programs__featured-copy">
        <span className="mx-library-programs__eyebrow">Платная программа</span>
        <strong>7 дней к ясному следующему шагу</strong>
        <span className="mx-library-programs__featured-arrow" aria-label="Открыть программу">
          <ArrowRight size={18} />
        </span>
      </div>
    </button>
  )
}

function ProgramRail({ onOpen }) {
  const programs = [
    ['Границы без лишнего напряжения', '7 дней', 'цена уточняется', 'journal'],
    ['Неделя внимательного решения', '10 дней', 'первый день бесплатно', 'purpose'],
  ]
  return (
    <div className="mx-library-programs__program-rail" aria-label="Другие программы">
      {programs.map(([title, duration, price, kind]) => (
        <button
          type="button"
          key={title}
          onClick={onOpen}
          className="mx-library-programs__small-program"
        >
          <span className="mx-library-programs__small-art" aria-hidden="true">
            <SemanticGlyph kind={kind} animated={false} />
          </span>
          <span className="mx-library-programs__eyebrow">Demo-концепт</span>
          <strong>{title}</strong>
          <small>
            {duration} · {price}
          </small>
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

function Landing({ demoState, onOpenDetail }) {
  const [readIds, setReadIds] = useState(new Set())
  const active = demoState === 'active'
  const completed = demoState === 'completed'
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
            <h3>Программы</h3>
          </div>
        </div>
        <FeaturedProgram onOpen={onOpenDetail} />
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
        <ArticleRail
          empty={demoState === 'empty'}
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
          одна задача
          <br />
          за раз
        </span>
      </div>
      <h2>7 дней к ясному следующему шагу</h2>
      <p className="mx-library-programs__lead">
        Разобраться в перегруженной ситуации и выбрать одно действие, которое можно сделать сейчас.
      </p>
      <strong className="mx-library-programs__detail-meta">7 дней · около 10 минут в день</strong>
      <section>
        <h3 className="mx-library-programs__value-heading">За эту неделю</h3>
        <ul className="mx-library-programs__value-list">
          <li>Отделишь главное от шума</li>
          <li>Увидишь реальные варианты</li>
          <li>Выберешь следующий шаг</li>
        </ul>
        <button type="button" className="mx-library-programs__steps-toggle" aria-expanded="false">
          <span>Посмотреть все 7 шагов</span>
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>
      <div className="mx-library-programs__detail-purchase">
        <strong>Полная программа · 790 ₽</strong>
        {!completed && (
          <>
            <button type="button" className="mx-library-programs__primary" onClick={onFreeDay}>
              Попробовать первый день бесплатно
            </button>
            <button type="button" className="mx-library-programs__secondary" onClick={onPay}>
              Получить программу сразу
            </button>
          </>
        )}
        <small>Демо: оплата не подключена</small>
      </div>
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
      <span className="mx-library-programs__eyebrow">День 1 из 7 · бесплатно</span>
      <h2>Что сейчас занимает больше всего внимания?</h2>
      <p className="mx-library-programs__lead">
        Запиши всё, что приходит в голову. Не нужно сразу искать решение — сначала освободим немного
        места.
      </p>
      <textarea aria-label="Твой ответ" placeholder="Можно начать с нескольких слов…" />
      <p className="mx-library-programs__demo-note">В этой демонстрации ответ не сохраняется.</p>
      <button type="button" className="mx-library-programs__primary" onClick={onFinish}>
        Сохранить и вернуться к программе
      </button>
    </div>
  )
}

function FakeDoor({ onClose, onConfirm }) {
  const [selected, setSelected] = useState('')
  const [custom, setCustom] = useState('')
  const options = [
    'Разобраться в одной ситуации',
    'Собрать спокойный план',
    'Дойти до следующего шага',
  ]
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
          {options.map(option => (
            <button
              type="button"
              key={option}
              aria-pressed={selected === option}
              onClick={() => setSelected(option)}
            >
              {option}
              <Check size={16} />
            </button>
          ))}
        </div>
        <textarea
          aria-label="Свой вариант"
          value={custom}
          onChange={event => {
            setCustom(event.target.value)
            setSelected('custom')
          }}
          placeholder="Свой вариант…"
        />
        <button
          type="button"
          className="mx-library-programs__primary"
          data-testid="fake-door-submit"
          disabled={!selected}
          onClick={onConfirm}
        >
          Отправить ответ
        </button>
      </section>
    </div>
  )
}

function FakeDoorConfirmation({ onBack }) {
  return (
    <div className="mx-library-programs__confirmation">
      <span className="mx-library-programs__confirmation-icon">
        <Check size={21} />
      </span>
      <h2>Спасибо — теперь понятнее, чего ты ждёшь от программы</h2>
      <p>Это демонстрация сценария. Ответ пока никуда не отправляется.</p>
      <button type="button" className="mx-library-programs__primary" onClick={onBack}>
        Вернуться в Библиотеку
      </button>
    </div>
  )
}

export default function LibraryProgramsExperiment() {
  const review = params().get('review') === '1'
  const [demoState, setDemoState] = useState(() => params().get('state') || 'ready')
  const [screen, setScreen] = useState(() => params().get('screen') || 'landing')
  const [sheetOpen, setSheetOpen] = useState(() => params().get('screen') === 'fake-door')
  const [confirmation, setConfirmation] = useState(
    () => params().get('screen') === 'fake-door-confirmation'
  )
  const setReviewScreen = next => {
    setScreen(next)
    setSheetOpen(next === 'fake-door')
    setConfirmation(next === 'fake-door-confirmation')
  }
  const reset = next => {
    setDemoState(next)
    setReviewScreen('landing')
  }
  const product =
    screen === 'detail' ? (
      <Detail
        demoState={demoState}
        onBack={() => setReviewScreen('landing')}
        onFreeDay={() => setReviewScreen('free-day')}
        onPay={() => setReviewScreen('fake-door')}
      />
    ) : screen === 'free-day' ? (
      <FreeDay
        onBack={() => setReviewScreen('detail')}
        onFinish={() => setReviewScreen('detail')}
      />
    ) : confirmation ? (
      <FakeDoorConfirmation onBack={() => setReviewScreen('landing')} />
    ) : (
      <Landing demoState={demoState} onOpenDetail={() => setReviewScreen('detail')} />
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
        </>
      )}
      <div className="mx-library-programs__device">
        {review ? null : <SafeArea />}
        <div className="mx-library-programs__scroll">{product}</div>
        <BottomNav />
        {sheetOpen && !confirmation && (
          <FakeDoor
            onClose={() => setReviewScreen('detail')}
            onConfirm={() => setReviewScreen('fake-door-confirmation')}
          />
        )}
      </div>
    </section>
  )
}
