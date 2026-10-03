import Screen from './Screen'
import CourseCard from './CourseCard'
import ThemeQuestionCarousel from './ThemeQuestionCarousel'
import { useBackButton } from '../platform/telegram.hooks'

export function CourseCards({ courses, userId, onOpen, carousel = true }) {
  const renderCard = course => <CourseCard course={course} userId={userId} onOpen={onOpen} />
  if (carousel && courses.length > 1)
    return (
      <div className="mx-library-course-carousel" data-testid="library-course-carousel">
        <ThemeQuestionCarousel questions={courses} renderCard={renderCard} ariaLabel="Курсы" />
      </div>
    )
  return (
    <div className="mx-library-course-list">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} userId={userId} onOpen={onOpen} />
      ))}
    </div>
  )
}

export default function CourseCatalog({ courses, userId, onOpen, onBack }) {
  useBackButton(onBack)
  return (
    <Screen showHeader={false} telegramChrome className="mx-library-courses-surface">
      <section data-testid="library-all-courses" className="mx-library-course-list">
        <h1 className="mx-type-page">все курсы.</h1>
        <CourseCards courses={courses} userId={userId} onOpen={onOpen} carousel={false} />
      </section>
    </Screen>
  )
}
