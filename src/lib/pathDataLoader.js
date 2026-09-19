import { ApiError } from './api'

export const SOURCE_STATES = Object.freeze({
  loading: 'loading',
  success: 'success',
  error: 'error',
  auth: 'auth',
})

export function sourceStateFromError(error) {
  return error?.status === 401 || error?.status === 403 ? SOURCE_STATES.auth : SOURCE_STATES.error
}

export function domainState(states) {
  const values = Object.values(states)
  if (values.length === 0 || values.every(state => state === SOURCE_STATES.success)) {
    return 'success'
  }
  const failed = values.filter(state => state !== SOURCE_STATES.success)
  if (failed.every(state => state === SOURCE_STATES.auth)) return 'auth'
  if (failed.length === values.length) return 'error'
  return 'partial'
}

/**
 * Fetch independent sources without turning failures into fake empty data.
 * `only` is used by retry actions so successful sources are never requested again.
 */
export async function loadIndependentSources(sources, { previous = {}, only = null } = {}) {
  const names = Object.keys(sources)
  const requested = only ? names.filter(name => only.includes(name)) : names
  const data = { ...previous.data }
  const states = { ...previous.states }
  const errors = { ...previous.errors }

  requested.forEach(name => {
    states[name] = SOURCE_STATES.loading
    delete errors[name]
  })

  const results = await Promise.allSettled(
    requested.map(async name => [name, await sources[name]()])
  )
  results.forEach((result, index) => {
    const name = requested[index]
    if (result.status === 'fulfilled') {
      data[name] = result.value[1]
      states[name] = SOURCE_STATES.success
      delete errors[name]
    } else {
      states[name] = sourceStateFromError(result.reason)
      errors[name] = result.reason
      delete data[name]
    }
  })

  return {
    data,
    states,
    errors,
    status: domainState(states),
    failed: names.filter(name => states[name] !== SOURCE_STATES.success),
    auth: names.filter(name => states[name] === SOURCE_STATES.auth),
  }
}

export function isAuthError(error) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}

export function retrySources(result) {
  return result.failed
}
