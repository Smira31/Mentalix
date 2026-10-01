/*
 * Веха серии (3 / 7 / 21 / 30 дней) — короткая награда сразу после отметки.
 *
 * Рисуется в потоке каркаса, без fullscreen-портала: порталы внутри
 * превью-рамки позиционировались неверно, и от них отказались (см. историю
 * ветки). Автоскрытие живёт в PracticeListFlow, чтобы компонент остался
 * чистым представлением.
 */
export default function PracticeMilestone({ title, name }) {
  return (
    <div className="mx-practice-milestone" role="status" data-testid="practice-milestone">
      <p className="mx-practice-milestone__eyebrow">Веха</p>
      <p className="mx-practice-milestone__title">{title}</p>
      {name && <p className="mx-practice-milestone__name">{name}</p>}
    </div>
  )
}
