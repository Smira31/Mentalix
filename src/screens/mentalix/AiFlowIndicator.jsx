const FLOW_STEPS = [
  { key: 'idea', label: 'идея' },
  { key: 'action', label: 'действие' },
  { key: 'analysis', label: 'анализ' },
  { key: 'next', label: 'новый шаг' },
]

export default function AiFlowIndicator({ active = 'idea' }) {
  const activeIndex = Math.max(
    FLOW_STEPS.findIndex(step => step.key === active),
    0,
  )

  return (
    <div
      aria-label="Цикл разговора: идея, действие, анализ, новый шаг"
      className="w-full max-w-md mx-auto"
    >
      <div className="flex items-center gap-1.5" role="list">
        {FLOW_STEPS.map((step, index) => {
          const isActive = index === activeIndex
          const isPast = index < activeIndex

          return (
            <div
              key={step.key}
              role="listitem"
              className="flex min-w-0 flex-1 items-center gap-1.5"
            >
              <span
                className={[
                  'h-1.5 w-full rounded-full',
                  isActive || isPast ? 'bg-gold' : 'bg-cream/15',
                ].join(' ')}
              />
              {index < FLOW_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="h-px w-1 shrink-0 bg-cream/15"
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-faint">
        {FLOW_STEPS.map((step, index) => (
          <span
            key={step.key}
            className={index === activeIndex ? 'text-gold' : ''}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}
