export function resolveCheckInMode({ sub, initialSub } = {}) {
  return sub === 'evening' || initialSub === 'evening' ? 'evening' : 'checkin'
}
