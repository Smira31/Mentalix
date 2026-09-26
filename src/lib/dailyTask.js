export function visibleDailyTask(response) {
  return response?.task?.id != null && response.task.title && response.task.body &&
    ['new', 'done', 'skipped'].includes(response.status)
    ? response
    : null
}
