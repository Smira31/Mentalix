// Новый курс = новый файл с default-объектом, без изменений UI/реестра.
const files = import.meta.glob(['./*.js', '!./index.js'], { eager: true, import: 'default' })
export const COURSES = Object.values(files)
  .filter(course => course?.id)
  .sort((a, b) => Number(Boolean(a.demoOnly)) - Number(Boolean(b.demoOnly)))
export const HERO_COURSE = COURSES.find(course => course.id === 'hero-journey')

export function libraryCourses(demo = false, demoCourses = true) {
  return COURSES.filter(course => !course.demoOnly || (demo && demoCourses))
}

export function courseContent(course) {
  const steps = course.steps
  const findTrial = id => steps.find(step => step.id === id) || null
  return {
    course,
    steps,
    chapters: course.chapters,
    finale: course.finale,
    total: steps.length,
    findTrial,
    previousTrial: id => steps[steps.findIndex(step => step.id === id) - 1] || null,
    chapterForTrial: id => course.chapters.find(chapter => chapter.trialIds.includes(id)),
    trialsForChapter: chapter => chapter.trialIds.map(findTrial).filter(Boolean),
  }
}
