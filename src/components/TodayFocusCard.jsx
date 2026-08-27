import { useState } from 'react'
import { ListChecks } from 'lucide-react'

import { platform } from '../platform'

/*
 * «Разгрузить голову»: вход — компактная пилюля, чтобы не
 * конкурировать по весу с «Самое важное» и MorningPilotCard.
 * Разрешённое состояние переиспользует визуальный язык
 * MorningPilotCard (выделенная золотом строка + приглушённые
 * остальные), а не изобретает новый.
 */

export default function TodayFocusCard({ focus, onOpenFlow, onClearFocus, readOnly = false }) {
  const [expanded, setExpanded] = useState(false)

  if (!focus?.picked) {
    return (
      <button
        type="button"
        onClick={() => {
          platform.haptic('light')

          onOpenFlow()
        }}
        className="w-full rounded-full bg-cream/5 border border-cream/10 text-cream text-[12px] font-semibold py-3 px-5 mb-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <ListChecks size={16} className="text-gold" />
        Разгрузить голову
      </button>
    )
  }

  const rest = (focus.items || []).filter(item => item !== focus.picked)

  return (
    <section className="rounded-[28px] bg-emerald px-5 py-5 mb-4 border border-cream/10 animate-fade-in">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-gold mb-2">
        {focus.firstStep ? 'Первый шаг · до 5 минут' : 'Точка внимания · сегодня'}
      </span>

      <div className="rounded-2xl px-4 py-3.5 bg-gold/10 border border-gold/25">
        <span className="block text-left text-[14px] font-bold text-cream leading-snug">
          {focus.firstStep || focus.picked}
        </span>

        {focus.firstStep && (
          <span className="block text-left text-[12px] text-muted mt-1.5 truncate">
            {focus.picked}
          </span>
        )}
      </div>

      {rest.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            className="text-[12px] font-semibold text-muted mt-3 active:opacity-60"
          >
            {expanded ? 'Свернуть' : `Остальное (${rest.length})`}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {rest.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-2xl px-4 py-3 bg-cream/5 border border-transparent text-left text-[12px] text-muted truncate"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!readOnly && (
        <div className="flex items-center gap-4 mt-3">
          <button
            type="button"
            onClick={onOpenFlow}
            className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60"
          >
            выбрать другое
          </button>

          <button
            type="button"
            onClick={() => {
              platform.haptic('light')

              onClearFocus?.()
            }}
            className="text-[12px] font-semibold text-muted -m-2 p-2 active:opacity-60"
          >
            убрать фокус
          </button>
        </div>
      )}
    </section>
  )
}
