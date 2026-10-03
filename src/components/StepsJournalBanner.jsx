import './ui-lab/StepsExploreRedesign.css'

// Общая оболочка журнала «Шагов» и курса Библиотеки.
export default function StepsJournalBanner({
  label,
  title,
  description,
  action,
  art = null,
  onOpen,
  testId,
  titleId,
  meta,
  course = false,
}) {
  const content = (
    <>
      <span className="mx-steps-journal__label">{label}</span>
      <h2 id={titleId} className="mx-steps-journal__title">
        {title}
      </h2>
      <p className="mx-steps-journal__desc">{description}</p>
      {meta}
      {course ? (
        <span className="mx-steps-journal__cta">{action}</span>
      ) : (
        <button
          type="button"
          className="mx-steps-journal__cta"
          data-testid={testId}
          onClick={onOpen}
        >
          {action}
        </button>
      )}
    </>
  )
  if (course)
    return (
      <button
        type="button"
        className="mx-steps-journal mx-library-hero"
        onClick={onOpen}
        data-testid={testId}
      >
        <div className="mx-steps-journal__art" aria-hidden="true">
          {art}
        </div>
        <div className="mx-steps-journal__body">{content}</div>
      </button>
    )
  return (
    <article className="mx-steps-journal">
      <div className="mx-steps-journal__art" aria-hidden="true">
        {art}
      </div>
      <div className="mx-steps-journal__body">{content}</div>
    </article>
  )
}
