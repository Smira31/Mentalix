import { useSyncExternalStore } from 'react'

export function useAuthSession(authPort) {
  return useSyncExternalStore(
    authPort.subscribe,
    authPort.getSession,
    authPort.getSession
  )
}
