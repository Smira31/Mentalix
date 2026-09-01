const STORAGE_KEY = 'mx-guided-self-discovery-v1'

function normalizeUserId(userId) {
  if (typeof userId === 'string' && userId.trim()) return userId.trim()
  if (typeof userId === 'number' && Number.isFinite(userId)) return String(userId)
  return null
}

function storageKey(userId) {
  const normalized = normalizeUserId(userId)
  return normalized ? `${STORAGE_KEY}:user:${encodeURIComponent(normalized)}` : STORAGE_KEY
}

function readGuidedSelfDiscoveryDraft(userId) {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(userId)) || 'null')
    if (!raw || typeof raw !== 'object' || !raw.answers || typeof raw.answers !== 'object')
      return null
    return {
      stage: raw.stage === 'complete' ? 'complete' : 'draft',
      answers: raw.answers,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    }
  } catch {
    return null
  }
}

function saveGuidedSelfDiscoveryDraft(userId, answers, stage = 'draft') {
  const value = {
    stage: stage === 'complete' ? 'complete' : 'draft',
    answers: { ...answers },
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(storageKey(userId), JSON.stringify(value))
  return value
}

function clearGuidedSelfDiscoveryDraft(userId) {
  localStorage.removeItem(storageKey(userId))
}

export {
  STORAGE_KEY,
  clearGuidedSelfDiscoveryDraft,
  readGuidedSelfDiscoveryDraft,
  saveGuidedSelfDiscoveryDraft,
}
