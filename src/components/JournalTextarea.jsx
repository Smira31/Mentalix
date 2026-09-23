import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bold, Check, Highlighter, Italic, Plus } from 'lucide-react'

import { platform } from '../platform'
import { parseInlineMarkdown, parseMarkdownBlocks } from '../lib/journalMarkdown'
import { useVisualViewportGeometry } from '../lib/visualViewport'
import PracticeWritingCanvas from './PracticeWritingCanvas'
import './WritingControls.css'

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

  return chunks
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\u00a0/g, ' ')
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
  formatting = true,
  onClose,
  autoFocus = false,
  keepFocusOnSubmit = false,
  submitIcon = 'check',
  desktopInline = false,
  writingCanvas = false,
  guidedFlow = false,
  showAddAction = false,
}) {
  const editorRef = useRef(null)
  const emittedValueRef = useRef(null)
  const [formatOpen, setFormatOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const viewportGeometry = useVisualViewportGeometry()
  useEffect(() => {
    if (!autoFocus || !editorRef.current) return undefined

    const focusEditor = () => {
      editorRef.current?.focus({ preventScroll: true })
    }
    const frame = window.requestAnimationFrame(focusEditor)
    const retry = window.setTimeout(focusEditor, 80)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
    }
  }, [autoFocus])
  const keyboardOpen =
    guidedFlow &&
    typeof window !== 'undefined' &&
    viewportGeometry?.height !== null &&
    viewportGeometry?.height !== undefined &&
    window.innerHeight - viewportGeometry.height > 80
  const keyboardDockStyle = keyboardOpen
    ? {
        top: `${viewportGeometry.height + viewportGeometry.offsetTop - 76}px`,
        bottom: 'auto',
      }
    : undefined

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || emittedValueRef.current === value) return

    if (formatting) renderMarkdown(editor, value)
    else renderPlainText(editor, value)

    emittedValueRef.current = value
  }, [formatting, value])

  if (writingCanvas && !formatting) {
    return (
      <PracticeWritingCanvas
        value={value}
        onChange={onChange}
        question={ariaLabel}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        onSubmit={onSubmit}
        submitLabel={submitLabel}
        submitDisabled={submitDisabled}
        submitLoading={submitLoading}
        onDeepen={onDeepen}
        deepenLabel={deepenLabel}
        deepenDisabled={deepenDisabled}
        deepenLoading={deepenLoading}
        onClose={onClose}
        autoFocus={autoFocus}
        className={className}
      />
    )
  }

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
    <div
      className={`flex min-h-0 flex-col ${guidedFlow ? 'journal-textarea--guided' : ''} ${className}`}
    >
      <div
        ref={editorRef}
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        autoFocus={autoFocus}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => {
          emitValue()
          if (!guidedFlow) return
          let parent = editorRef.current?.parentElement
          while (parent && parent !== document.body) {
            // The editor owns this scroll reset during guided input.
            // eslint-disable-next-line react-hooks/immutability
            if (parent.scrollHeight > parent.clientHeight) parent.scrollTop = 0
            parent = parent.parentElement
          }
          window.scrollTo({ top: 0, behavior: 'auto' })
        }}
        onFocus={() => {
          const viewport = window.visualViewport
          if (!guidedFlow || !viewport) return

          const resetFlowScroll = () => {
            let parent = editorRef.current?.parentElement
            while (parent && parent !== document.body) {
              if (parent.scrollHeight > parent.clientHeight) {
                parent.scrollTo({ top: 0, behavior: 'auto' })
              }
              parent = parent.parentElement
            }
            window.scrollTo({ top: 0, behavior: 'auto' })
          }

          window.requestAnimationFrame(resetFlowScroll)
          window.setTimeout(resetFlowScroll, 120)
        }}
        onPaste={event => {
          event.preventDefault()
          insertPlainText(
            event.currentTarget.ownerDocument,
            event.clipboardData.getData('text/plain')
          )
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
            <div
              className={[
                'fixed bottom-[calc(var(--app-safe-bottom)+86px)] left-5 z-[71] flex items-center gap-2 rounded-full border border-cream/10 bg-emerald-deep/95 p-2 shadow-xl backdrop-blur-md',
                desktopInline ? 'md:static md:bottom-auto md:left-auto md:mb-3 md:ml-auto' : '',
              ].join(' ')}
            >
              {formatButtons}
            </div>
          )}

          <div
            className={[
              'fixed bottom-[calc(var(--app-safe-bottom)+10px)] left-[var(--mx-screen-x)] right-[var(--mx-screen-x)] z-[70] mx-auto flex min-w-0 items-center justify-between gap-2',
              'max-w-[430px]',
              'journal-textarea__floating-actions',
              desktopInline
                ? 'md:static md:bottom-auto md:left-auto md:right-auto md:z-0 md:mx-0 md:mt-6 md:w-full md:max-w-none'
                : '',
              guidedFlow ? 'journal-textarea__floating-actions--guided' : '',
            ].join(' ')}
              style={keyboardDockStyle}
            >
            <div className="flex shrink-0 items-center gap-1.5">
              {(showAddAction || floatingToolbar) && (
                <button
                  type="button"
                  aria-label={addOpen ? 'Скрыть дополнительные действия' : 'Дополнительные действия'}
                  aria-expanded={addOpen}
                  onPointerDown={event => event.preventDefault()}
                  onClick={() => setAddOpen(current => !current)}
                  className="mx-keyboard-control mx-keyboard-plus flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full border border-[rgb(var(--c-border))] bg-emerald-light text-cream"
                >
                  <Plus size={22} />
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
                    'mx-keyboard-control mx-keyboard-format flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full border text-[18px] font-semibold italic transition-colors active:scale-95',
                    formatOpen
                      ? 'border-gold/40 bg-gold/15 text-gold'
                      : 'border-[rgb(var(--c-border))] bg-emerald-light text-cream',
                  ].join(' ')}
                >
                  Aa
                </button>
              ) : null}
            </div>

            <div className="flex min-w-0 shrink items-center justify-end gap-1.5">
              {onDeepen ? (
                <button
                  type="button"
                  onClick={onDeepen}
                  disabled={
                    (deepenDisabled ?? !String(value || '').trim()) || submitLoading || deepenLoading
                  }
                  className="mx-keyboard-control mx-keyboard-deepen h-[45px] min-w-0 shrink rounded-full border border-[rgb(var(--c-border))] bg-emerald-light px-5 text-[17px] font-medium text-cream transition-transform active:scale-[0.98] max-[360px]:px-[14px] disabled:opacity-35"
                >
                  {deepenLabel}
                </button>
              ) : null}

              <button
                type="button"
                aria-label={submitLabel}
                title={submitLabel}
                onClick={() => {
                  if (!keepFocusOnSubmit) {
                    editorRef.current?.blur()
                  }
                  onSubmit?.()
                }}
                disabled={submitDisabled || submitLoading || deepenLoading}
                className="mx-keyboard-control mx-keyboard-submit flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-full border border-[rgb(var(--c-border))] bg-[#F2F2F2] text-emerald-deep transition-transform active:scale-95 disabled:opacity-35"
              >
                {submitIcon === 'arrow' ? (
                  <ArrowRight size={25} strokeWidth={2.4} />
                ) : (
                  <Check size={25} strokeWidth={2.4} />
                )}
              </button>
            </div>
          </div>
          {showAddAction && addOpen && (
            <div className="fixed bottom-[calc(var(--app-safe-bottom)+86px)] left-5 z-[71] flex gap-2 rounded-2xl border border-cream/10 bg-emerald-deep/95 p-2 shadow-xl">
              {['Voice Memo', 'Camera', 'Photo', 'Draw'].map(item => (
                <button
                  key={item}
                  type="button"
                  className="rounded-xl px-2 py-2 text-[11px] text-muted"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </>
      ) : formatting ? (
        <div
          className={`${stickyToolbar ? 'sticky bottom-0 z-10' : 'relative z-0 journal-toolbar--inline'} mt-3 flex shrink-0 items-center gap-1.5 border-t border-cream/10 bg-emerald-deep/95 py-2 backdrop-blur-md`}
        >
          <span className="mr-auto text-[11px] font-semibold text-faint">Формат</span>
          {formatButtons}
        </div>
      ) : null}
    </div>
  )
}
