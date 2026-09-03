import { useState } from 'react'
import UiLabSwitch from './UiLabSwitch'
import UiExperiments from './UiExperiments'
import TodayStatePreview from './TodayStatePreview'
import PracticeCatalogExperiment from './PracticeCatalogExperiment'
import ProductionBaseline from './ProductionBaseline'
import LayeredPracticeCatalogExperiment from './LayeredPracticeCatalogExperiment'
import EveningReviewExperiment from './EveningReviewExperiment'
import DailyCanonicalExperiment from './DailyCanonicalExperiment'
import './UiLab.css'

const LEGACY_PARAM_MAP = { 1: 'experiments', showcase: 'baseline' }

export function resolveUiLabSection(value) {
  return (
    LEGACY_PARAM_MAP[value] ||
    (['baseline', 'experiments', 'compare', 'daily-canonical', 'practice-catalog'].includes(value)
      ? value
      : 'baseline')
  )
}

export default function UiLab({ initialSection = 'baseline' }) {
  const [section, setSection] = useState(resolveUiLabSection(initialSection))
  const [todayState, setTodayState] = useState('checkinPending')

  function selectSection(next) {
    setSection(next)
    const url = new URL(window.location.href)
    url.searchParams.set('ui_lab', next)
    window.history.replaceState({}, '', url)
  }

  return (
    <main className="mx-ui-lab">
      <div className="mx-ui-lab__scroll">
        <header className="mx-ui-lab__header">
          <p className="mx-ui-lab__kicker">Mentalix · Preview-only</p>
          <h1>Эталон → Эксперименты → Сравнение</h1>
          <p>
            Здесь можно посмотреть актуальный интерфейс, гипотезы и разницу между ними. Production
            не изменён.
          </p>
          <UiLabSwitch active={section} />
        </header>
        <div className="mx-ui-lab__content">
          {section === 'baseline' && (
            <>
              <TodayStatePreview
                mode="baseline"
                selectedState={todayState}
                onStateChange={setTodayState}
              />
              <section
                className="mx-practice-comparison"
                aria-labelledby="practice-comparison-title"
              >
                <div className="mx-practice-comparison__intro">
                  <span>UI-EXP-003 · сравнение каталога</span>
                  <h2 id="practice-comparison-title">Практики: сейчас и «Ярусный каталог»</h2>
                  <p>
                    Слева — текущий production baseline, справа — Preview-only эксперимент. Данные
                    практик используют тот же набор и формат, а новые ярусы помечены как временные.
                  </p>
                </div>
                <div className="mx-practice-comparison__grid">
                  <ProductionBaseline />
                  <LayeredPracticeCatalogExperiment mode="after" />
                </div>
              </section>
            </>
          )}
          {section === 'experiments' && (
            <>
              <TodayStatePreview
                mode="experiments"
                selectedState={todayState}
                onStateChange={setTodayState}
              />
              <section className="mx-ui-lab__catalog" aria-labelledby="catalog-title">
                <div>
                  <span>Каталог гипотез</span>
                  <h2 id="catalog-title">Эксперименты по областям</h2>
                  <p>
                    Выберите прототип для просмотра. Устаревшие поверхности сохранены как кандидаты
                    на архив, а не удалены молча.
                  </p>
                </div>
                <div className="mx-ui-lab__groups">
                  {[
                    'Сегодня',
                    'Check-in и завершение',
                    'Практики',
                    'Путь и серии',
                    'Motion и карточки',
                    'Системные элементы',
                  ].map((group, index) => (
                    <div key={group} className="mx-ui-lab__group">
                      <strong>{group}</strong>
                      <span>
                        {index === 0
                          ? 'Today · 4 состояния'
                          : index === 5
                            ? 'кандидаты на архив отмечены в каталоге'
                            : 'Preview-only гипотезы'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              <PracticeCatalogExperiment />
              <EveningReviewExperiment />
              <UiExperiments embedded />
            </>
          )}
          {section === 'compare' && (
            <TodayStatePreview
              mode="compare"
              selectedState={todayState}
              onStateChange={setTodayState}
            />
          )}
          {section === 'daily-canonical' && <DailyCanonicalExperiment />}
          {section === 'practice-catalog' && (
            <section
              className="mx-practice-comparison"
              aria-labelledby="practice-comparison-route-title"
            >
              <div className="mx-practice-comparison__intro">
                <span>UI-EXP-003 · отдельный маршрут manual-gate</span>
                <h2 id="practice-comparison-route-title">
                  Практики: production и «Ярусный каталог»
                </h2>
                <p>
                  Слева — текущий production baseline, справа — Preview-only эксперимент для ручной
                  проверки на реальном Telegram/iPhone.
                </p>
              </div>
              <div className="mx-practice-comparison__grid">
                <ProductionBaseline />
                <LayeredPracticeCatalogExperiment mode="after" />
              </div>
            </section>
          )}
        </div>
        <footer className="mx-ui-lab__footer">
          Preview-only · реальные пользовательские данные и product logic не подключены
        </footer>
      </div>
    </main>
  )
}
