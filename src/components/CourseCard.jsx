import { ArrowRight } from 'lucide-react'
import StepsJournalBanner from './StepsJournalBanner'
import { useHeroJourneyProgress, isStepCompleted } from '../lib/heroJourneyProgress'

export default function CourseCard({ course, userId, onOpen }) {
  const { progress } = useHeroJourneyProgress(userId, course.id)
  const total = course.steps.length
  const isEmpty = total === 0
  const completed = isEmpty ? 0 : course.steps.filter(step => isStepCompleted(step.id, progress)).length
  const art = (
    <img
      src={course.cover || course.image}
      alt=""
      width={course.imageWidth}
      height={course.imageHeight}
      loading="lazy"
    />
  )

  if (isEmpty)
    return (
      <StepsJournalBanner
        course
        label="КУРС · СКОРО"
        title={`${course.title.toLowerCase()}.`}
        description={course.description}
        art={art}
        action="Скоро"
        muted
        testId={course.id === 'hero-journey' ? 'library-hero' : 'library-course-card'}
        onOpen={() => onOpen(course)}
      />
    )

  return (
    <StepsJournalBanner
      course
      label={course.label || `КУРС · ${total} ШАГОВ`}
      title={`${course.title.toLowerCase()}.`}
      description={course.description}
      art={art}
      action={completed ? 'Продолжить' : 'Начать'}
      actionIcon={<ArrowRight size={16} />}
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
