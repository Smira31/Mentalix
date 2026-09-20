import { api } from './api'

const PINNED_PRACTICES_CACHE_TTL_MS = 30_000
const cache = new Map()
const inFlight = new Map()

function freshEntry(userId) {
  const cached = cache.get(userId)
  if (cached && Date.now() - cached.fetchedAt < PINNED_PRACTICES_CACHE_TTL_MS) return cached
  return null
}

export function peekPinnedPractices(userId) {
  return freshEntry(userId)?.data ?? null
}

export async function fetchPinnedPractices(userId, { force = false } = {}) {
  const cached = freshEntry(userId)
  if (!force && cached) return cached.data
  if (inFlight.has(userId)) return inFlight.get(userId)

  const request = api.pinnedPractices
    .list(userId)
    .then(data => {
      cache.set(userId, { data, fetchedAt: Date.now() })
      return data
    })
    .finally(() => inFlight.delete(userId))

  inFlight.set(userId, request)
  return request
}

export function invalidatePinnedPractices(userId) {
  cache.delete(userId)
}
