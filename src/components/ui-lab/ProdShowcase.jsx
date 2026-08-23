import { useState } from 'react'

import MazeLogo from '../MazeLogo'
import SemanticGlyph from '../SemanticGlyph'
import BottomNavigation from '../BottomNavigation'
import LinkWebAccount from '../../screens/LinkWebAccount'
import UiLabSwitch from './UiLabSwitch'
import './ProdShowcase.css'

/*
 * MXL-UI-LAB-SHOWCASE-001
 *
 * Формат карточки согласован владельцем на пилоте (MazeLogo): путь файла →
 * название → живой рендер → «Как реагирует» одним абзацем без маркетинга.
 * Визуальный язык (hairline blueprint — тонкие серые линии на почти-чёрном
 * фоне, один золотой акцент, без заливок/градиентов) сверен с
 * UiExperiments.css и повторён здесь под своими классами — тот файл не
 * импортируется и не менялся, чтобы не связывать две независимые
 * ui-lab-страницы одной таблицей стилей.
 *
 * Список допущенных/исключённых компонентов — результат пре-мортема
 * (TASKS.md, MXL-UI-LAB-SHOWCASE-001) и последующей проверки кода перед
 * стартом: AppLock/Onboarding/Breathing/WebAuthScreen изначально числились
 * в пре-мортеме как «проходят», но при чтении исходников оказались
 * нарушающими то же правило 3 (глобальный body-scroll-лок/portal при
 * монтировании, либо живой запрос к прод-backend) — владелец подтвердил
 * их исключение. Полный список причин — секция «Нет предпросмотра» ниже.
 */

const GLYPH_KINDS = [
  { kind: 'ritual', label: 'ritual' },
  { kind: 'asceza', label: 'asceza' },
  { kind: 'alcohol', label: 'alcohol' },
  { kind: 'breath', label: 'breath' },
  { kind: 'neuro', label: 'neuro' },
  { kind: 'mentor', label: 'mentor' },
  { kind: 'companion', label: 'companion' },
  { kind: 'pathfinder', label: 'pathfinder' },
]

const NOT_PREVIEWABLE = [
  {
    name: 'AppLock',
    path: 'src/screens/AppLock.jsx',
    reason:
      'вызывает useFullscreenSurface() безусловно с первого рендера — глобальный document.body.style.overflow и createPortal(..., document.body) вне карточки; в реальном Telegram дополнительно сразу пытается биометрию.',
  },
  {
    name: 'Onboarding',
    path: 'src/screens/Onboarding.jsx',
    reason:
      'та же безусловная useFullscreenSurface() плюс position: fixed на весь вьюпорт. Уже есть отдельный маршрут ?onboarding_preview=1 — для полноэкранного показа не нужна карточка витрины.',
  },
  {
    name: 'Breathing',
    path: 'src/screens/Breathing.jsx',
    reason:
      'экран выбора длительности безопасен, но кнопка «Начать дыхание» переводит в тот же portal + глобальный scroll-лок, что и AppLock — ломает витрину с несколькими карточками на странице.',
  },
  {
    name: 'WebAuthScreen',
    path: 'src/screens/WebAuthScreen.jsx',
    reason:
      'не проверяет user, но «Отправить код» бьёт в живой /api/auth — на Preview это настоящий Render/Neon (реальный email, запись в прод-БД).',
  },
  {
    name: 'Rituals / Ascezas',
    path: 'src/screens/Rituals.jsx, src/screens/Ascezas.jsx',
    reason:
      'createPortal(..., document.body) мимо карточки, Ascezas дополнительно держит глобальный document.body.style.overflow и общий стек useBackButton.',
  },
  {
    name: 'FirstStepFlow / ProcrastinationFlow / NarrowFocusFlow / FinishFlow',
    path: 'src/screens/*Flow.jsx',
    reason:
      'сигнатура userId+onClose, full-screen флоу поверх Today — по решению владельца из пре-мортема не проверялись детально, по умолчанию «нет предпросмотра».',
  },
  {
    name: 'QuoteView / PersonaPicker / Conversation',
    path: 'src/screens/QuoteView.jsx и соседние',
    reason: 'тот же full-screen паттерн, что у Rituals/Ascezas — не проверялись детально.',
  },
  {
    name: 'Today, Practices, Library, Trends, CheckIn, Settings…',
    path: 'src/screens/*',
    reason:
      'требуют реального user и живого /api/* — по правилу 2 пре-мортема фиктивный user не подставляется.',
  },
]

function ShowcaseCard({ number, path, title, note, children }) {
  return (
    <section className="mx-showcase-card">
      <div className="mx-showcase-card__head">
        <span className="mx-showcase-card__number">{number}</span>

        <div>
          <p className="mx-showcase-card__path">{path}</p>

          <h2>{title}</h2>

          <p className="mx-showcase-card__note">
            <strong>Как реагирует:</strong> {note}
          </p>
        </div>
      </div>

      <div className="mx-showcase-stage">{children}</div>
    </section>
  )
}

function BottomNavigationDemo() {
  const [tab, setTab] = useState('today')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="mx-showcase-nav-frame">
      <BottomNavigation
        tab={tab}
        collapsed={collapsed}
        onTabChange={setTab}
        onCollapseChange={setCollapsed}
      />
    </div>
  )
}

export default function ProdShowcase() {
  return (
    <main className="mx-showcase">
      <header className="mx-showcase-header">
        <div className="mx-showcase-header__mark" aria-hidden="true">
          <span />
        </div>

        <p className="mx-showcase-kicker">Mentalix · живая витрина</p>

        <UiLabSwitch active="showcase" />

        <h1>Реальные компоненты, не копии.</h1>

        <p className="mx-showcase-intro">
          Импорт из настоящего прод-кода, не копии. «Сочные» продуктовые экраны сюда не входят —
          список и причины ниже, в «Нет предпросмотра».
        </p>
      </header>

      <div className="mx-showcase-list">
        <ShowcaseCard
          number="01"
          path="src/components/MazeLogo.jsx"
          title="Лабиринт-логотип"
          note="progress (0..1) золотом заливает пройденную часть лабиринта, точка едет по маршруту следом. Внутреннего состояния нет — чистый SVG от пропов; ниже три статичных снимка прогресса одного и того же компонента."
        >
          <div className="mx-showcase-row">
            <MazeLogo size={72} progress={0.2} />
            <MazeLogo size={72} progress={0.6} />
            <MazeLogo size={72} progress={1} />
          </div>
        </ShowcaseCard>

        <ShowcaseCard
          number="02"
          path="src/components/SemanticGlyph.jsx"
          title="Смысловые знаки"
          note="kind выбирает один из готовых SVG-знаков (ritual, asceza, дыхание, персоны AI и т.д.) — так реальные экраны сопоставляют категорию данных со знаком через semanticKindFor*(). Ниже подмножество из 19 доступных kind, без анимации (animated=false — на витрине статично)."
        >
          <div className="mx-showcase-glyph-grid">
            {GLYPH_KINDS.map(({ kind, label }) => (
              <div key={kind} className="mx-showcase-glyph-cell">
                <div className="mx-showcase-glyph-box">
                  <SemanticGlyph kind={kind} animated={false} />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </ShowcaseCard>

        <ShowcaseCard
          number="03"
          path="src/components/BottomNavigation.jsx"
          title="Нижняя навигация"
          note="position: fixed в прод-коде — здесь контейнер карточки задаёт transform, поэтому CSS считает его новым containing block и фиксирует панель внутри карточки, а не по вьюпорту (сам компонент не менялся). Клик по вкладке или сворачивание — обычный локальный useState этой карточки, не роутинг приложения."
        >
          <BottomNavigationDemo />
        </ShowcaseCard>

        <ShowcaseCard
          number="04"
          path="src/screens/LinkWebAccount.jsx"
          title="Связать с сайтом"
          note="статичный экран без user и без API. Кнопка «Получить код у бота» открывает реальную Telegram-ссылку (или новую вкладку вне Telegram) — переход происходит взаправду, но ничего не сохраняет и не отправляет."
        >
          <LinkWebAccount onBack={() => {}} />
        </ShowcaseCard>
      </div>

      <section className="mx-showcase-excluded">
        <p className="mx-showcase-kicker">Нет предпросмотра</p>

        <p className="mx-showcase-excluded__intro">
          Прод под нужды витрины не дорабатывается (правило 1 пре-мортема) — эти компоненты нельзя
          показать «как есть» без риска для страницы или живого backend.
        </p>

        <ul>
          {NOT_PREVIEWABLE.map(item => (
            <li key={item.name}>
              <span className="mx-showcase-excluded__path">{item.path}</span>
              <strong>{item.name}</strong>
              <p>{item.reason}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mx-showcase-footer">
        <span />
        Прототипы витрины не подключены к API
        <span />
      </footer>
    </main>
  )
}
