import {
  useEffect,
  useState,
} from 'react'

import WebApp from '@twa-dev/sdk'

import { api } from '../../lib/api'
import { PERSONAS } from './personas'


function haptic(
  style = 'light',
) {
  WebApp.HapticFeedback?.impactOccurred(
    style,
  )
}


function trim(
  text,
  max = 90,
) {
  const clean = String(
    text || '',
  )
    .replace(/\s+/g, ' ')
    .trim()

  return clean.length > max
    ? `${clean
        .slice(0, max)
        .trimEnd()}…`
    : clean
}


export default function PersonaPicker({
  user,
  onPick,
}) {
  const [
    previews,
    setPreviews,
  ] = useState({})


  useEffect(() => {
    if (!user) return

    let alive = true

    Promise.all(
      PERSONAS.map(
        (persona) =>
          api.mentalix
            .history(
              user.id,
              persona.key,
            )
            .then(
              (messages) => [
                persona.key,
                Array.isArray(
                  messages,
                )
                  ? messages[
                      messages.length -
                        1
                    ]
                  : null,
              ],
            )
            .catch(() => [
              persona.key,
              null,
            ]),
      ),
    ).then((pairs) => {
      if (!alive) return

      const next = {}

      pairs.forEach(
        ([key, last]) => {
          if (last?.content) {
            next[key] = last
          }
        },
      )

      setPreviews(next)
    })

    return () => {
      alive = false
    }
  }, [user])


  return (
    <div className="w-full max-w-sm px-6 pb-24 animate-fade-in">
      <h2 className="font-display text-lg mb-1 text-cream/90">
        С кем поговорим
      </h2>

      <p className="text-[11px] text-cream/40 mb-5">
        три собеседника, три разговора
      </p>


      <div className="space-y-3">
        {PERSONAS.map(
          (persona) => {
            const Icon =
              persona.Icon

            const last =
              previews[
                persona.key
              ]

            return (
              <div
                key={
                  persona.key
                }
                className="rounded-[24px] border border-cream/15 bg-emerald-light/15 overflow-hidden"
              >
                <button
                  onClick={() => {
                    haptic(
                      'light',
                    )

                    onPick(
                      persona.key,
                      '',
                    )
                  }}
                  className="w-full text-left p-4 flex items-start gap-4 transition-transform active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center shrink-0">
                    <Icon
                      size={24}
                      className="text-gold"
                      strokeWidth={
                        1.75
                      }
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display text-lg text-cream">
                        {
                          persona.name
                        }
                      </span>

                      <span className="text-[11px] text-gold">
                        {
                          persona.tagline
                        }
                      </span>
                    </div>

                    <p className="text-xs text-cream/50 leading-snug mt-1">
                      {
                        persona.desc
                      }
                    </p>
                  </div>
                </button>


                <div className="px-4 pb-4">
                  {last ? (
                    <button
                      onClick={() => {
                        haptic(
                          'light',
                        )

                        onPick(
                          persona.key,
                          '',
                        )
                      }}
                      className="w-full text-left rounded-2xl bg-emerald-light/25 border border-cream/10 px-3.5 py-3 active:scale-[0.99]"
                    >
                      <div className="text-[10px] uppercase tracking-wide text-gold mb-1">
                        Продолжить
                        разговор
                      </div>

                      <p className="text-xs text-cream/55 leading-snug">
                        {last.role ===
                        'user'
                          ? 'Ты: '
                          : ''}

                        {trim(
                          last.content,
                        )}
                      </p>
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {persona.starters.map(
                        (
                          starter,
                        ) => (
                          <button
                            key={
                              starter
                            }
                            onClick={() => {
                              haptic(
                                'light',
                              )

                              onPick(
                                persona.key,
                                starter,
                              )
                            }}
                            className="rounded-full border border-cream/15 bg-emerald-light/25 px-3.5 py-2 text-xs text-cream/70 active:scale-95"
                          >
                            {
                              starter
                            }
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          },
        )}
      </div>


      <p className="text-[11px] text-cream/30 leading-snug mt-5 px-1">
        У каждого своя история —
        разговоры не смешиваются.
      </p>
    </div>
  )
}