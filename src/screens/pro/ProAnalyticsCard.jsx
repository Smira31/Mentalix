import { ChevronRight } from 'lucide-react'

import Card from '../../components/ui/Card'

/*
 * Mentalix Pro (PRO-002b/c): вход в разбор недели из аналитики.
 *
 * Одна карточка над графиками в разделе «Аналитика» (вкладка «Прогресс»):
 * открывает уже реализованный путь ProScreen — разбор → план → прогресс
 * плана, вложенным <Screen>, без новой вкладки и дублирующего экрана.
 * Прежний вход из профиля убран; подписка, тарифы и согласие остаются в
 * профиле. Карточка не входит в настройку графиков
 * (analyticsCardPreferences): порядок, скрытие и фильтры не затрагивает.
 * Доступ (флаг Pro, согласие, ограничения) по-прежнему проверяет backend.
 */
export default function ProAnalyticsCard({ onOpen }) {
  return (
    <Card
      className="mt-4 p-4"
      onClick={onOpen}
      testId="progress-pro-card"
      aria-label="Разбор и план недели"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="font-display block text-[15px] text-cream">Разбор и план недели</span>
          <span className="mt-1 block text-[12px] leading-relaxed text-muted">
            AI-разбор записей, план на неделю и отметки выполнения — часть Pro
          </span>
        </span>
        <ChevronRight
          size={16}
          strokeWidth={2}
          aria-hidden="true"
          className="shrink-0 text-muted"
        />
      </span>
    </Card>
  )
}
