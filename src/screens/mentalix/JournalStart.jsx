import {
  ArrowRight,
  MoreHorizontal,
  Plus,
} from 'lucide-react'

import WebApp from '@twa-dev/sdk'
import BackButton from '../../components/BackButton'

import { PERSONAS } from './personas'


function haptic(style = 'light') {
  WebApp.HapticFeedback?.impactOccurred(style)
}


export default function JournalStart({
  persona,
  input,
  setInput,
  onSend,
  onBack,
  onOpenHistory,
  sending,
  PersonaArt,
}) {
  const meta = PERSONAS.find(
    (item) =>
      item.key === persona,
  )

  const Icon = meta.Icon


  return (
    <div className="w-full max-w-md mx-auto px-5 flex flex-col min-h-[calc(100vh-160px)] animate-fade-in">

      {/* ── шапка ── */}

      <div className="flex items-center pt-1">
        <BackButton onClick={onBack} />


        <div className="ml-4 flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl border border-gold/25 bg-gold/[0.04] flex items-center justify-center shrink-0">
            <Icon
              size={22}
              className="text-gold"
              strokeWidth={1.7}
            />
          </div>

          <div className="min-w-0">
            <div className="font-display text-[18px] text-cream leading-none">
              {meta.name}
            </div>

            <div className="text-[10px] text-gold mt-1 uppercase tracking-[0.05em]">
              {meta.tagline}
            </div>
          </div>
        </div>


        <button
          type="button"
          onClick={() => {
            haptic('light')
            onOpenHistory()
          }}
          aria-label="История разговора"
          className="ml-auto w-10 h-10 flex items-center justify-center text-cream/65 active:scale-90 transition-transform"
        >
          <MoreHorizontal
            size={24}
            strokeWidth={1.7}
          />
        </button>
      </div>


      {/* ── иллюстрация ── */}

      <div className="mt-4 -mx-1">
        <div className="h-[245px] flex items-center justify-center">
          <PersonaArt
            persona={persona}
          />
        </div>
      </div>


      {/* ── персона спрашивает ── */}

      <div className="flex items-center gap-3 mt-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold whitespace-nowrap">
          {meta.asking}
        </span>

        <div className="flex-1 h-px bg-gold/35" />

        <span className="w-2.5 h-2.5 border border-gold/70 rotate-45 shrink-0" />
      </div>


      {/* ── вопрос ── */}

      <div className="pt-8">
        <h1
          className="text-[35px] leading-[1.14] text-cream font-normal tracking-[-0.025em] whitespace-pre-line"
          style={{
            fontFamily:
              'Georgia, "Times New Roman", serif',
          }}
        >
          {meta.question}
        </h1>

        <div className="w-8 h-px bg-gold mt-7 mb-5" />

        <p className="text-[15px] leading-[1.62] text-cream/50 max-w-[300px]">
          {meta.intro}
        </p>
      </div>


      <div className="flex-1 min-h-[70px]" />


      {/* ── поле ввода ── */}

      <div className="pb-3">
        <div className="min-h-[62px] rounded-full border border-cream/15 bg-emerald-light/15 flex items-center px-2 gap-2">

          <button
            type="button"
            onClick={() => {
              haptic('light')
            }}
            aria-label="Добавить"
            className="w-11 h-11 rounded-full bg-cream/[0.05] flex items-center justify-center text-cream/55 shrink-0 active:scale-90 transition-transform"
          >
            <Plus
              size={23}
              strokeWidth={1.5}
            />
          </button>


          <input
            value={input}

            onChange={(event) =>
              setInput(
                event.target.value,
              )
            }

            onKeyDown={(event) => {
              if (
                event.key === 'Enter'
              ) {
                onSend()
              }
            }}

            placeholder="Начни писать..."

            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[16px] text-cream placeholder:text-cream/28 px-1"
          />


          <button
            type="button"
            onClick={onSend}

            disabled={
              sending ||
              !input.trim()
            }

            aria-label="Отправить"

            className="w-12 h-12 rounded-full bg-gold text-emerald-deep flex items-center justify-center shrink-0 disabled:opacity-35 active:scale-90 transition-transform"
          >
            <ArrowRight
              size={24}
              strokeWidth={1.9}
            />
          </button>

        </div>
      </div>

    </div>
  )
}