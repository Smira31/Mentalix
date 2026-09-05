import {
  activeExperiments,
  archivedExperiments,
  formatScope,
  sketchPatterns,
  statusLabel,
} from './uiLabCatalog'

function StatusBadge({ status }) {
  return (
    <span className={`mx-ui-lab-status mx-ui-lab-status--${status.replace(/\s+/g, '-')}`}>
      {statusLabel(status)}
    </span>
  )
}

function CatalogCard({ eyebrow, status, title, description, href, meta }) {
  return (
    <a className="mx-ui-lab-card" href={href}>
      <span className="mx-ui-lab-card__eyebrow-row">
        <span className="mx-ui-lab-card__eyebrow">{eyebrow}</span>
        {status && <StatusBadge status={status} />}
      </span>
      <strong>{title}</strong>
      <span className="mx-ui-lab-card__description">{description}</span>
      <span className="mx-ui-lab-card__meta">{meta}</span>
    </a>
  )
}

function EmptyState() {
  return (
    <div className="mx-ui-lab-empty">
      <strong>Пока нет активных экспериментов</strong>
      <span>Новые записи появятся здесь автоматически после добавления в журнал.</span>
    </div>
  )
}

export default function UiLabHub() {
  return (
    <section className="mx-ui-lab-hub" aria-labelledby="ui-lab-hub-title">
      <div className="mx-ui-lab-hub__intro">
        <span className="mx-ui-lab__kicker">Точка входа · каталог</span>
        <h2 id="ui-lab-hub-title">Куда пойти в UI Lab</h2>
        <p>
          Формальные проверки отделены от паттернов-эскизов. Карточка открывает существующий маршрут
          без изменения самого эксперимента.
        </p>
      </div>

      <section className="mx-ui-lab-catalog-section" aria-labelledby="active-experiments-title">
        <div className="mx-ui-lab-catalog-section__heading">
          <div>
            <span className="mx-ui-lab__kicker">Журнал · {activeExperiments.length}</span>
            <h3 id="active-experiments-title">Активные эксперименты</h3>
          </div>
          <p>Pending review и manual-gate</p>
        </div>
        {activeExperiments.length ? (
          <div className="mx-ui-lab-card-grid">
            {activeExperiments.map(entry => (
              <CatalogCard
                key={entry.id}
                eyebrow={entry.id}
                status={entry.status}
                title={formatScope(entry.scope)}
                description={entry.variants}
                href={entry.href}
                meta="Открыть Preview →"
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      <section className="mx-ui-lab-catalog-section" aria-labelledby="sketch-patterns-title">
        <div className="mx-ui-lab-catalog-section__heading">
          <div>
            <span className="mx-ui-lab__kicker">Галерея идей · {sketchPatterns.length}</span>
            <h3 id="sketch-patterns-title">Паттерны и эскизы</h3>
          </div>
          <p>Небольшие пронумерованные наброски</p>
        </div>
        <div className="mx-ui-lab-card-grid">
          {sketchPatterns.map(pattern => (
            <CatalogCard
              key={pattern.number}
              eyebrow={`Эскиз ${pattern.number}`}
              title={pattern.title}
              description="Идея интерфейсного паттерна, без отдельного решения в журнале."
              href={pattern.href}
              meta="Открыть в экспериментах →"
            />
          ))}
        </div>
      </section>

      <details className="mx-ui-lab-archive">
        <summary>
          <span>
            <span className="mx-ui-lab__kicker">История · {archivedExperiments.length}</span>
            <strong>Архив</strong>
          </span>
          <span>Завершённые эксперименты</span>
        </summary>
        <div className="mx-ui-lab-card-grid">
          {archivedExperiments.map(entry => (
            <CatalogCard
              key={entry.id}
              eyebrow={entry.id}
              status={entry.status}
              title={formatScope(entry.scope)}
              description={entry.variants}
              href={entry.href}
              meta="Открыть маршрут →"
            />
          ))}
        </div>
      </details>
    </section>
  )
}
