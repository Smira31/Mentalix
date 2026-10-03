const REMOVED_LIBRARY_SCREEN =
  /^(articles|journals|guided-journals|programs|library-v2-articles|library-v2-programs|library-v2-program)(\/|_|$)/

export function isRemovedLibraryAddress(url) {
  const tab = url.searchParams.get('tab') || ''
  return (
    REMOVED_LIBRARY_SCREEN.test(tab) ||
    /^\/(?:library\/)?(?:articles|journals|guided-journals|programs)(\/|$)/.test(url.pathname) ||
    (tab === 'library' &&
      ['sub', 'screen', 'action'].some(key =>
        REMOVED_LIBRARY_SCREEN.test(url.searchParams.get(key) || '')
      ))
  )
}

export function redirectRemovedLibraryAddress() {
  const url = new URL(window.location.href)
  if (!isRemovedLibraryAddress(url)) return
  url.pathname = '/'
  url.searchParams.set('tab', 'library')
  url.searchParams.delete('sub')
  url.searchParams.delete('screen')
  url.searchParams.delete('action')
  window.history.replaceState(null, '', url)
}
