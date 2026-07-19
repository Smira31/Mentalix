export default function Placeholder({ title, hint }) {
  return (
    <div className="w-full max-w-sm px-6 text-center pt-16">
      <h2 className="font-display text-lg mb-2 text-cream/90">{title}</h2>
      <p className="text-sm text-cream/40">{hint || 'Этот раздел появится на следующих шагах'}</p>
    </div>
  )
}
