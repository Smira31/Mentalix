import { platform, platformName } from '../platform'


/*
 * Telegram MainButton/SecondaryButton (platform/telegram.hooks.js)
 * рисуются вне веб-вью и в браузере молча ничего не делают — у
 * web.adapter.js нет и не должно быть их эквивалента (это
 * документированная граница платформенного слоя). Экраны, которые
 * отдают подтверждение шага/формы только этим хукам, в браузере
 * остаются без единой кнопки действия.
 *
 * WebActionBar — DOM-эквивалент для таких экранов: рендерится
 * только вне Telegram, использует те же токены CTA (--btn-bg/
 * --btn-text через .cta-pill), что и Telegram-кнопка. Ставить
 * последним shrink-0 дочерним элементом flex-колонки fullscreen-
 * шелла (CHECKIN_SHELL_CLASS / FULLSCREEN_SHELL_CLASS) — тогда
 * кнопка остаётся над виртуальной клавиатурой по той же схеме,
 * что уже сузила высоту шелла под visualViewport.
 */
export default function WebActionBar({
  action,
  secondaryAction,
  className = '',
}) {
  if (platformName === 'telegram') return null
  if (!action && !secondaryAction) return null

  return (
    <div
      className={[
        'shrink-0 w-full max-w-md mx-auto px-5 pb-4 pt-3 flex flex-col items-center gap-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {action && (
        <button
          type="button"
          onClick={() => {
            platform.haptic('light')
            action.onClick()
          }}
          disabled={action.disabled}
          className="cta-pill w-full py-4 text-[16px] disabled:opacity-40"
        >
          {action.text}
        </button>
      )}

      {secondaryAction && (
        <button
          type="button"
          onClick={() => {
            platform.haptic('light')
            secondaryAction.onClick()
          }}
          className="py-2 text-[14px] font-semibold text-muted border-0 bg-transparent"
        >
          {secondaryAction.text}
        </button>
      )}
    </div>
  )
}
