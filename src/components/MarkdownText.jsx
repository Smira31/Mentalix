import { parseInlineMarkdown, parseMarkdownBlocks } from '../lib/journalMarkdown'

function InlineMarkdown({ content }) {
  return parseInlineMarkdown(content).map((token, index) => {
    const key = `${token.type}-${index}`

    if (token.type === 'strong') {
      return (
        <strong key={key} className="font-semibold text-cream">
          {token.content}
        </strong>
      )
    }

    if (token.type === 'emphasis') {
      return <em key={key}>{token.content}</em>
    }

    if (token.type === 'highlight') {
      return (
        <mark key={key} className="rounded-[4px] bg-gold/20 px-0.5 text-inherit">
          {token.content}
        </mark>
      )
    }

    return token.content
  })
}

export default function MarkdownText({ content, className = 'space-y-3' }) {
  const blocks = parseMarkdownBlocks(content)

  return (
    <div className={`${className} min-w-0 [overflow-wrap:anywhere]`}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h3 key={`${block.type}-${index}`} className="font-semibold leading-[1.45] text-cream">
              <InlineMarkdown content={block.content} />
            </h3>
          )
        }

        if (block.type === 'unordered-list' || block.type === 'ordered-list') {
          const List = block.type === 'ordered-list' ? 'ol' : 'ul'

          return (
            <List
              key={`${block.type}-${index}`}
              className={`${block.type === 'ordered-list' ? 'list-decimal' : 'list-disc'} space-y-1.5 pl-5 marker:text-gold`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>
                  <InlineMarkdown content={item} />
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
                <InlineMarkdown content={line} />
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
