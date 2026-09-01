const MAX_TAGS_PER_ENTRY = 8

export default function TagPicker({
  tags = [],
  selectedTagIds = [],
  onToggle,
  maxTags = MAX_TAGS_PER_ENTRY,
  disabled = false,
  label = 'Теги записи',
}) {
  const reachedLimit = selectedTagIds.length >= maxTags

  return (
    <div aria-label={label} className="flex flex-wrap gap-2">
      {tags.map(tag => {
        const selected = selectedTagIds.includes(tag.id)
        const unavailable = disabled || (!selected && reachedLimit)

        return (
          <button
            key={tag.id}
            type="button"
            aria-pressed={selected}
            aria-label={`${selected ? 'Снять' : 'Добавить'} тег ${tag.name}`}
            disabled={unavailable}
            onClick={() => onToggle?.(tag.id)}
            className={[
              'min-h-9 rounded-full px-3 text-[12px] font-semibold transition-colors',
              selected ? 'bg-gold text-emerald-deep' : 'bg-cream/5 text-muted',
              unavailable ? 'cursor-not-allowed opacity-45' : 'active:bg-gold/20',
            ].join(' ')}
          >
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}

export { MAX_TAGS_PER_ENTRY }
