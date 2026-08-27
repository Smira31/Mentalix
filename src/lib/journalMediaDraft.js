export const JOURNAL_MEDIA_LIMITS = {
  audio: { maxBytes: 10 * 1024 * 1024, types: ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a'] },
  image: { maxBytes: 8 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
  video: { maxBytes: 25 * 1024 * 1024, types: ['video/mp4', 'video/webm'] },
}

export function validateJournalMedia(file, kind) {
  const rules = JOURNAL_MEDIA_LIMITS[kind]
  if (!rules) return { ok: false, error: 'Неизвестный тип вложения.' }
  if (!file) return { ok: false, error: 'Файл не выбран.' }
  if (!rules.types.includes(file.type)) return { ok: false, error: 'Этот формат пока не поддерживается.' }
  if (file.size > rules.maxBytes) return { ok: false, error: 'Файл превышает допустимый размер.' }
  return { ok: true }
}

export function createPendingMediaDraft(file, kind) {
  const validation = validateJournalMedia(file, kind)
  if (!validation.ok) return { status: 'rejected', ...validation }
  return {
    status: 'pending_consent',
    kind,
    name: file.name || `${kind}-recording`,
    size: file.size,
    // Blob не загружается и не сериализуется в localStorage. Он существует
    // только в памяти текущего экрана до отдельного подтверждения пользователя.
    file,
  }
}

export function mayUploadPendingMedia(draft, consent) {
  return Boolean(draft?.status === 'pending_consent' && consent === true)
}
