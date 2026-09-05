import { useEffect, useState } from 'react'

const enabled = import.meta.env.DEV || import.meta.env.VERCEL_ENV === 'preview'

export default function PreviewApiDiagnostic() {
  const [diagnostic, setDiagnostic] = useState(null)

  useEffect(() => {
    if (!enabled) return undefined

    const handleDiagnostic = event => {
      setDiagnostic(event.detail || null)
    }

    window.addEventListener('mentalix:api-diagnostic', handleDiagnostic)
    return () => window.removeEventListener('mentalix:api-diagnostic', handleDiagnostic)
  }, [])

  if (!enabled || !diagnostic) return null

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[100] max-w-md rounded-2xl border border-red-300/30 bg-[#240f12]/95 p-4 text-cream shadow-2xl backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-red-200">
            Preview API diagnostic
          </p>
          <p className="mt-1 text-[16px] font-semibold">
            HTTP {diagnostic.status ?? 'network'} · {diagnostic.kind}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full px-2 py-1 text-[16px] text-red-100/80"
          onClick={() => setDiagnostic(null)}
          aria-label="Скрыть диагностику"
        >
          ×
        </button>
      </div>
      <p className="mt-2 break-all font-mono text-[12px] text-red-100/80">{diagnostic.path}</p>
      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/25 p-3 font-mono text-[12px] leading-relaxed text-red-50">
        {diagnostic.body || 'Пустое тело ответа'}
      </pre>
      <p className="mt-2 text-[12px] text-red-100/70">
        Диагностика доступна только в Preview и не включается в Production.
      </p>
    </aside>
  )
}
