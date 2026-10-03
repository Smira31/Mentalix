import StepsJournalBanner from './StepsJournalBanner'
import { useHeroJourneyProgress, isStepCompleted } from '../lib/heroJourneyProgress'

export default function CourseCard({ course, userId, onOpen }) {
  const { progress } = useHeroJourneyProgress(userId, course.id)
  const total = course.steps.length
  const completed = course.steps.filter(step => isStepCompleted(step.id, progress)).length
  return (
    <StepsJournalBanner
      course
      label={course.label || `КУРС · ${total} ШАГОВ`}
      title={`${course.title.toLowerCase()}.`}
      description={course.description}
      art={<img src={course.image} alt="" />}
      action={completed ? 'Продолжить →' : 'Начать →'}
      testId={course.id === 'hero-journey' ? 'library-hero' : 'library-course-card'}
      onOpen={() => onOpen(course)}
      meta={
        completed > 0 && (
          <span className="mx-library-course-progress">
            <span>
              Шаг {Math.min(completed + 1, total)} из {total}
            </span>
            <progress value={completed} max={total} aria-label="Прогресс курса" />
          </span>
        )
      }
    />
  )
}
