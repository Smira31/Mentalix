const OWNER_QA_STABLE_HOST = 'mentalix-owner-qa.pages.dev'
const OWNER_QA_IMMUTABLE_HOST = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.mentalix-owner-qa\.pages\.dev$/

export function isUiLabHostAllowed(hostname = '') {
  const host = String(hostname).trim().toLowerCase()

  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === 'mentalix-preview.vercel.app' ||
    host === OWNER_QA_STABLE_HOST ||
    OWNER_QA_IMMUTABLE_HOST.test(host)
  )
}
