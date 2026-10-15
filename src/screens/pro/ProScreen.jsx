import { useState } from 'react'

import Screen from '../../components/Screen'
import ProReportView from './ProReportView'
import ProPlanView from './ProPlanView'
import ProProgressView from './ProProgressView'

/*
 * Mentalix Pro (PRO-002b/c): «мой разбор.» — один вложенный экран, открытый
 * карточкой «Прогресс → Аналитика» (без новой вкладки). Внутри — путь из
 * спецификации MXL-PRO-001
 * §7: разбор → план недели → выполнение (статусы на карточках плана) →
 * прогресс. Доступ ко всем трём частям проверяет backend (флаги Pro и
 * активная подписка); frontend ошибок не имитирует.
 */
export default function ProScreen({ user, onBack }) {
  const [view, setView] = useState('report')

  return (
    <Screen onBack={onBack} backTestId="pro-back-button">
      {view === 'report' && <ProReportView user={user} onOpenPlan={() => setView('plan')} />}
      {view === 'plan' && (
        <ProPlanView
          user={user}
          onOpenReport={() => setView('report')}
          onOpenProgress={() => setView('progress')}
        />
      )}
      {view === 'progress' && <ProProgressView user={user} onOpenPlan={() => setView('plan')} />}
    </Screen>
  )
}
