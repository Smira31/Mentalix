const INLINE_PATTERN = /(\*\*([^*\n]+)\*\*|__([^_\n]+)__|==([^=\n]+)==|\*([^*\n]+)\*|_([^_\n]+)_)/g

export function parseInlineMarkdown(value) {
  const source = String(value ?? '')
  const tokens = []
  let cursor = 0

  for (const match of source.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0

    if (index > cursor) {
      tokens.push({ type: 'text', content: source.slice(cursor, index) })
    }

    if (match[2] || match[3]) {
      tokens.push({ type: 'strong', content: match[2] || match[3] })
    } else if (match[4]) {
      tokens.push({ type: 'highlight', content: match[4] })
    } else {
      tokens.push({ type: 'emphasis', content: match[5] || match[6] })
    }

    cursor = index + match[0].length
  }

  if (cursor < source.length) {
    tokens.push({ type: 'text', content: source.slice(cursor) })
  }

  return tokens.length ? tokens : [{ type: 'text', content: source }]
}

export function parseMarkdownBlocks(value) {
  const blocks = []
  let paragraph = []
  let list = null

  function flushParagraph() {
    if (!paragraph.length) return
    blocks.push({ type: 'paragraph', lines: paragraph })
    paragraph = []
  }

  function flushList() {
    if (!list) return
    blocks.push(list)
    list = null
  }

  function addListItem(type, content) {
    flushParagraph()

    if (list?.type !== type) {
      flushList()
      list = { type, items: [] }
    }

    list.items.push(content)
  }

  String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim()

      if (!trimmed) {
        flushParagraph()
        flushList()
        return
      }

      const heading = trimmed.match(/^#{1,3}\s+(.+)$/)
      if (heading) {
        flushParagraph()
        flushList()
        blocks.push({ type: 'heading', content: heading[1] })
        return
      }

      const bullet = trimmed.match(/^[-*]\s+(.+)$/)
      if (bullet) {
        addListItem('unordered-list', bullet[1])
        return
      }

      const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/)
      if (numbered) {
        addListItem('ordered-list', numbered[1])
        return
      }

      flushList()
      paragraph.push(trimmed)
    })

  flushParagraph()
  flushList()

  return blocks
}

export function wrapMarkdownSelection(
  value,
  selectionStart,
  selectionEnd,
  marker,
  placeholder = 'текст'
) {
  const source = String(value ?? '')
  const start = Math.max(0, Math.min(selectionStart ?? source.length, source.length))
  const end = Math.max(start, Math.min(selectionEnd ?? start, source.length))
  const selected = source.slice(start, end)
  const content = selected || placeholder

  if (
    selected &&
    source.slice(start - marker.length, start) === marker &&
    source.slice(end, end + marker.length) === marker
  ) {
    return {
      value: source.slice(0, start - marker.length) + selected + source.slice(end + marker.length),
      selectionStart: start - marker.length,
      selectionEnd: end - marker.length,
    }
  }

  return {
    value: source.slice(0, start) + marker + content + marker + source.slice(end),
    selectionStart: start + marker.length,
    selectionEnd: start + marker.length + content.length,
  }
}
