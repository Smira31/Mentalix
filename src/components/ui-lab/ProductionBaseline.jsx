import SemanticGlyph from '../SemanticGlyph'

const CURRENT_PRACTICES = [
  {
    title: 'Медитация',
    subtitle: 'заметить своё и выбрать один спокойный шаг',
    kind: 'meditation',
  },
  { title: 'Ритуалы', subtitle: 'обряды, что держат твой день', kind: 'ritual' },
  { title: 'Аскезы', subtitle: 'от чего ты отказываешься', kind: 'asceza' },
  { title: 'Первый шаг', subtitle: 'маленький шаг, когда трудно начать', kind: 'next-step' },
  { title: 'Без вины', subtitle: 'когда откладываешь и знаешь это', kind: 'release' },
  { title: 'Один финиш', subtitle: 'маленький кусок, доведённый до конца', kind: 'finish' },
]

export default function ProductionBaseline() {
  return (
    <section className="mx-practice-baseline" aria-labelledby="practice-baseline-title">
      <div className="mx-practice-baseline__label">Эталон · production</div>
      <h2 id="practice-baseline-title">практики.</h2>
      <p className="mx-practice-baseline__note">
        Текущий прод-экран: вертикальные категории и последовательный список практик.
      </p>
      <div className="mx-practice-baseline__journal">Запись дня · Открыть журнал</div>
      {['Практики', 'Психологические практики', 'Дальше / Скоро'].map((category, categoryIndex) => (
        <div className="mx-practice-baseline__category" key={category}>
          <h3>{category}</h3>
          {CURRENT_PRACTICES.slice(categoryIndex * 2, categoryIndex * 2 + 2).map(practice => (
            <button className="mx-practice-baseline__row" type="button" key={practice.title}>
              <span className="mx-practice-baseline__art" aria-hidden="true">
                <SemanticGlyph kind={practice.kind} animated={false} highlighted={false} />
              </span>
              <span>
                <strong>{practice.title}</strong>
                <small>{practice.subtitle}</small>
              </span>
              <span className="mx-practice-baseline__chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      ))}
    </section>
  )
}

export { CURRENT_PRACTICES }
