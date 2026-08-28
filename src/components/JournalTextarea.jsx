import { useEffect, useRef, useState } from 'react'
import { Bold, Check, Highlighter, Italic, Plus } from 'lucide-react'

import { platform } from '../platform'
import { parseInlineMarkdown, parseMarkdownBlocks } from '../lib/journalMarkdown'

const FORMATS = [
  { command: 'bold', label: 'Жирный текст', Icon: Bold },
  { command: 'italic', label: 'Курсив', Icon: Italic },
  { command: 'highlight', label: 'Выделение', Icon: Highlighter },
]

function appendInlineMarkdown(documentRef, parent, value) {
  parseInlineMarkdown(value).forEach(token => {
    const text = documentRef.createTextNode(token.content)

    if (token.type === 'strong') {
      const element = documentRef.createElement('strong')
      element.append(text)
      parent.append(element)
      return
    }

    if (token.type === 'emphasis') {
      const element = documentRef.createElement('em')
      element.append(text)
      parent.append(element)
      return
    }

    if (token.type === 'highlight') {
      const element = documentRef.createElement('mark')
      element.append(text)
      parent.append(element)
      return
    }

    parent.append(text)
  })
}

function renderMarkdown(editor, value) {
  const documentRef = editor.ownerDocument
  const fragment = documentRef.createDocumentFragment()

  parseMarkdownBlocks(value).forEach(block => {
    if (block.type === 'unordered-list' || block.type === 'ordered-list') {
      const list = documentRef.createElement(block.type === 'ordered-list' ? 'ol' : 'ul')

      block.items.forEach(item => {
        const listItem = documentRef.createElement('li')
        appendInlineMarkdown(documentRef, listItem, item)
        list.append(listItem)
      })

      fragment.append(list)
      return
    }

    const element = documentRef.createElement(block.type === 'heading' ? 'h3' : 'div')
    const lines = block.type === 'paragraph' ? block.lines : [block.content]

    lines.forEach((line, index) => {
      if (index > 0) element.append(documentRef.createElement('br'))
      appendInlineMarkdown(documentRef, element, line)
    })

    fragment.append(element)
  })

  editor.replaceChildren(fragment)
}

function renderPlainText(editor, value) {
  const documentRef = editor.ownerDocument
  const fragment = documentRef.createDocumentFragment()

  String(value || '')
    .split('\n')
    .forEach((line, index) => {
      if (index > 0) fragment.append(documentRef.createElement('br'))
      fragment.append(documentRef.createTextNode(line))
    })

  editor.replaceChildren(fragment)
}

function serializeNode(node, suppressFormatting = false) {
  if (node.nodeType === 3) return node.textContent || ''
  if (node.nodeType !== 1) return ''

  const tag = node.tagName.toLowerCase()
  const isFormat = ['strong', 'b', 'em', 'i', 'mark'].includes(tag) || node.style?.backgroundColor
  const content = Array.from(node.childNodes)
    .map(child => serializeNode(child, suppressFormatting || isFormat))
    .join('')

  if (tag === 'br') return '\n'
  if (!suppressFormatting && (tag === 'strong' || tag === 'b')) return `**${content}**`
  if (!suppressFormatting && (tag === 'em' || tag === 'i')) return `_${content}_`
  if (!suppressFormatting && (tag === 'mark' || node.style?.backgroundColor)) {
    return `==${content}==`
  }
  if (tag === 'li') return content

  return content
}

function serializeEditor(editor) {
  const chunks = Array.from(editor.childNodes).map(node => {
    if (node.nodeType === 3) return serializeNode(node)

    const tag = node.tagName.toLowerCase()

    if (tag === 'ul' || tag === 'ol') {
      return Array.from(node.children)
        .map((item, index) => `${tag === 'ol' ? `${index + 1}.` : '-'} ${serializeNode(item)}`)
        .join('\n')
    }

    return serializeNode(node)
  })

  return chunks.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\u00a0/g, ' ')
}

function insertPlainText(documentRef, text) {
  if (documentRef.queryCommandSupported?.('insertText')) {
    documentRef.execCommand('insertText', false, text)
    return
  }

  const selection = documentRef.getSelection()
  if (!selection?.rangeCount) return

  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(documentRef.createTextNode(text))
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

export default function JournalTextarea({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = '',
  editorClassName = '',
  floatingToolbar = false,
  stickyToolbar = true,
  onSubmit,
  submitLabel = 'Сохранить',
  submitDisabled = false,
  submitLoading = false,
  onDeepen,
  deepenLabel = 'Пойти глубже',
  deepenDisabled,
  deepenLoading = false,
  deepenIcon: DeepenIcon = null,
  onAdd,
  addLabel = 'Добавить абзац',
  submitIcon: SubmitIcon = Check,
  formatting = true,
  autoFocus = false,
}) {
  const editorRef = useRef(null)
  const emittedValueRef = useRef(null)
  const [formatOpen, setFormatOpen] = useState(false)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || emittedValueRef.current === value) return

    if (formatting) renderMarkdown(editor, value)
    else renderPlainText(editor, value)

    emittedValueRef.current = value
  }, [formatting, value])

  function emitValue() {
    const editor = editorRef.current
    if (!editor) return

    const nextValue = serializeEditor(editor)
    emittedValueRef.current = nextValue
    onChange(nextValue)
  }

  function applyFormat(command) {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    const documentRef = editor.ownerDocument

    if (command === 'highlight') {
      documentRef.execCommand('hiliteColor', false, 'rgb(237, 189, 96)')
    } else {
      documentRef.execCommand(command, false)
    }

    platform.haptic('light')
    emitValue()
  }

  const formatButtons = FORMATS.map(({ command, label, Icon }) => (
    <button
      key={command}
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={event => event.preventDefault()}
      onClick={() => applyFormat(command)}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/10 bg-emerald text-muted transition-colors active:scale-95 active:text-gold"
    >
      <Icon size={17} strokeWidth={2} />
    </button>
  ))

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div
        ref={editorRef}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        autoFocus={autoFocus}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitValue}
        onPaste={event => {
          event.preventDefault()
          insertPlainText(event.currentTarget.ownerDocument, event.clipboardData.getData('text/plain'))
          emitValue()
        }}
        className={[
          'min-h-[9rem] flex-1 bg-transparent text-[17px] leading-[1.65] text-cream outline-none font-body caret-gold',
          '[overflow-wrap:anywhere] empty:before:pointer-events-none empty:before:text-muted empty:before:content-[attr(data-placeholder)]',
          formatting
            ? '[&_strong]:font-semibold [&_em]:italic [&_mark]:rounded-[4px] [&_mark]:bg-gold/20 [&_mark]:px-0.5 [&_mark]:text-inherit'
            : '',
          formatting ? '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5' : '',
          editorClassName,
        ].join(' ')}
      />

      {floatingToolbar ? (
        <>
          {formatting && formatOpen && (
            <div className="fixed bottom-[calc(var(--app-safe-bottom)+86px)] left-5 z-[71] flex items-center gap-2 rounded-full border border-cream/10 bg-emerald-deep/95 p-2 shadow-xl backdrop-blur-md">
              {formatButtons}
            </div>
          )}

          <div
            className={`journal-floating-toolbar fixed bottom-[calc(var(--app-safe-bottom)+10px)] left-5 right-5 z-[70] mx-auto grid max-w-[350px] items-center gap-3 ${
              onAdd ? 'grid-cols-[56px_56px_minmax(0,1fr)_56px]' : 'grid-cols-[56px_minmax(0,1fr)_56px]'
            }`}
          >
            {onAdd && (
              <button
                type="button"
                aria-label={addLabel}
                title={addLabel}
                onPointerDown={event => event.preventDefault()}
                onClick={() => {
                  platform.haptic('light')
                  onAdd()
                }}
                className="journal-add-action flex h-14 w-14 items-center justify-center rounded-full border border-cream/10 bg-emerald text-cream transition-transform active:scale-95"
              >
                <Plus size={23} strokeWidth={1.8} />
              </button>
            )}

            {formatting ? (
              <button
                type="button"
                aria-label={formatOpen ? 'Скрыть форматирование' : 'Показать форматирование'}
                aria-expanded={formatOpen}
                onPointerDown={event => event.preventDefault()}
                onClick={() => {
                  platform.haptic('light')
                  setFormatOpen(current => !current)
                }}
                className={[
                  'journal-format-action flex h-14 w-14 items-center justify-center rounded-full border text-[18px] font-semibold italic transition-colors active:scale-95',
                  formatOpen
                    ? 'border-gold/40 bg-gold/15 text-gold'
                    : 'border-cream/10 bg-emerald text-cream',
                ].join(' ')}
              >
                Aa
              </button>
            ) : (
              <span aria-hidden="true" />
            )}

            {onDeepen ? (
              <button
                type="button"
                aria-label={deepenLabel}
                title={deepenLabel}
                onClick={onDeepen}
                disabled={
                  (deepenDisabled ?? !String(value || '').trim()) ||
                  submitLoading ||
                  deepenLoading
                }
                className={[
                  'journal-deepen-action flex h-14 min-w-0 items-center justify-center rounded-full border border-cream/10 bg-emerald text-[14px] font-semibold text-cream transition-transform active:scale-[0.98] disabled:opacity-35',
                  DeepenIcon ? 'w-14 px-0' : 'px-5',
                ].join(' ')}
              >
                {DeepenIcon ? <DeepenIcon size={22} strokeWidth={1.6} className="text-gold" /> : deepenLabel}
              </button>
            ) : (
              <span aria-hidden="true" />
            )}

            <button
              type="button"
              aria-label={submitLabel}
              title={submitLabel}
              onClick={() => {
                editorRef.current?.blur()
                onSubmit?.()
              }}
              disabled={submitDisabled || submitLoading || deepenLoading}
              className="journal-submit-action flex h-14 w-14 items-center justify-center rounded-full border-0 bg-cream text-emerald-deep shadow-xl transition-transform active:scale-95 disabled:opacity-35"
            >
              <SubmitIcon size={25} strokeWidth={2.4} />
            </button>
          </div>
        </>
      ) : formatting ? (
        <div className={`${stickyToolbar ? 'sticky bottom-0 z-10' : 'relative z-0 journal-toolbar--inline'} mt-3 flex shrink-0 items-center gap-1.5 border-t border-cream/10 bg-emerald-deep/95 py-2 backdrop-blur-md`}>
          <span className="mr-auto text-[11px] font-semibold text-faint">Формат</span>
          {formatButtons}
        </div>
      ) : null}
    </div>
  )
}
