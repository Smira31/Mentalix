import Card from '../../components/ui/Card'
import PillButton from '../../components/ui/PillButton'

/*
 * Приглашение включить согласие для AI-разбора. Использует существующий
 * проверенный поток приложения: GET/PUT /api/mentalix/consent
 * (api.mentalix.setContextConsent) — новых endpoint'ов согласия нет.
 */
export default function ProConsentCard({ onEnable, saving, note, testId = 'pro-consent-enable' }) {
  return (
    <Card className="mt-4">
      <p className="mx-pro-size-note font-semibold text-cream">Нужно согласие на использование записей</p>
      <p className="mx-pro-size-meta mt-1 leading-relaxed text-muted">
        Разбор собирается только из записей, которые ты разрешил использовать в AI. Отдельные
        чек-ины для контекста выбираются в «Истории». AI не заменяет помощь специалиста.
      </p>
      {note && (
        <p role="status" className="mx-pro-size-label mt-2 leading-relaxed text-muted">
          {note}
        </p>
      )}
      <PillButton
        variant="light"
        testId={testId}
        onClick={onEnable}
        disabled={saving}
        className="mt-3 w-full"
      >
        {saving ? 'Включаем…' : 'Разрешить выбранный персональный контекст'}
      </PillButton>
    </Card>
  )
}
