import { normalizeHistory } from './mentalixHistoryUtils.js'

export function mergeConversationMessages(history, currentMessages) {
  return normalizeHistory([
    ...(Array.isArray(history) ? history : []),
    ...(Array.isArray(currentMessages) ? currentMessages : []),
  ])
}
