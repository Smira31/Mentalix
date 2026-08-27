function InlineText({ text }) {
  return text
    .split(/(\*\*[^*\n]+\*\*|__[^_\n]+__)/g)
    .filter(Boolean)
    .map((part, index) => {
      const isStrong =
        (part.startsWith('**') && part.endsWith('**')) ||
        (part.startsWith('__') && part.endsWith('__'))

      if (!isStrong) return part

      return (
        <strong
          key={`${part}-${index}`}
          className="font-semibold text-cream"
        >
          {part.slice(2, -2)}
        </strong>
      )
    })
}


function parseBlocks(content) {
  const blocks = []
  let paragraph = []
  let list = null

  function flushParagraph() {
    if (paragraph.length === 0) return

    blocks.push({
      type: 'paragraph',
      lines: paragraph,
    })
    paragraph = []
  }

  function flushList() {
    if (!list) return

    blocks.push(list)
    list = null
  }

  function addListItem(type, text) {
    flushParagraph()

    if (list?.type !== type) {
      flushList()
      list = { type, items: [] }
    }

    list.items.push(text)
  }

  String(content ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .forEach((line) => {
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
        blocks.push({ type: 'heading', text: heading[1] })
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


export default function MessageText({ content }) {
  const blocks = parseBlocks(content)

  return (
    <div className="space-y-3.5">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h3
              key={`${block.type}-${index}`}
              className="text-[14px] font-semibold leading-[1.45] text-cream"
            >
              <InlineText text={block.text} />
            </h3>
          )
        }

        if (
          block.type === 'unordered-list' ||
          block.type === 'ordered-list'
        ) {
          const List =
            block.type === 'ordered-list'
              ? 'ol'
              : 'ul'

          return (
            <List
              key={`${block.type}-${index}`}
              className={`${block.type === 'ordered-list' ? 'list-decimal' : 'list-disc'} space-y-2 pl-5 marker:text-gold`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>
                  <InlineText text={item} />
                </li>
              ))}
            </List>
          )
        }

        return (
          <p key={`${block.type}-${index}`}>
            {block.lines.map((line, lineIndex) => (
              <span key={`${line}-${lineIndex}`}>
                {lineIndex > 0 && <br />}
                <InlineText text={line} />
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
