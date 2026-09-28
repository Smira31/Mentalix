import { Suspense } from 'react'
import ScreenErrorBoundary from './ScreenErrorBoundary'

/*
 * Обёртка вложенного экрана Today: Suspense + изоляция ошибок.
 *
 * Ленивый чанк под-экрана (мысль дня, тема недели, чек-ин, путь)
 * не должен ронять всё приложение и оставлять человека на пустом
 * тёмном экране без кнопок — Suspense с fallback={null} при
 * зависшем/потерянном чанке показывает именно его.
 *
 * Ошибка загрузки или рантайма показывает «Экран не открылся»
 * с выходом назад к «Сегодня»; смена resetKey (человек вышел и
 * открыл другой под-экран) снимает ошибку.
 */
export default function SubScreenBoundary({ resetKey, onExit, children }) {
  return (
    <ScreenErrorBoundary resetKey={resetKey} onHome={onExit}>
      <Suspense fallback={null}>{children}</Suspense>
    </ScreenErrorBoundary>
  )
}
