import RoundSubmitButton from './RoundSubmitButton'

/*
 * Разбор текста листа: «мысль листа» — последний абзац, целиком жирный (**…**).
 * Живёт рядом с блоком «МЫСЛЬ», потому что этот разбор общий у листов вводки и
 * у вступления шага без листов: иначе один и тот же текст давал бы разное
 * оформление на разных шагах.
 */
export function splitSheetThought(text) {
  const parts = String(text ?? '').split(/\n\n+/)
  const last = parts[parts.length - 1].trim()
  const bold = last.match(/^\*\*([\s\S]+)\*\*$/)
  if (!bold) return { body: text, thought: null }
  return { body: parts.slice(0, -1).join('\n\n'), thought: bold[1].trim() }
}

/*
 * Лист «Пути героя» — одна сцена на все экраны чтения шага: листы вводки-сторис
 * (необязательное поле шага pages) и вступление шага без листов. Оформление
 * задано здесь один раз, поэтому листы и вступление не расходятся: тот же кадр
 * шага, та же колонка текста, тот же блок мысли и та же белая круглая кнопка
 * «›» внизу.
 *
 * Колонку .mx-hj-step-intro, её оболочку <Screen> и геометрию иллюстрации
 * (.mx-hj-hero--flex) держат экраны шага; компонент рисует только части колонки:
 * сцену листа и нижнюю группу. Сцена центрирует связку «кадр + текст + мысль»
 * (justify-content: center в HeroJourneyStory.css), поэтому смысловой вывод
 * читается вместе с текстом, а не отдельным островом у нижнего края.
 *
 * Поля:
 *  illustration — кадр шага или заглушка (у листов 2+ не показывается);
 *  label        — узел метки листа: у листов вводки серая метка eyebrow, у
 *                 вступления — белая подпись поверх кадра (контраст к фону);
 *  body         — текст листа; разметку абзацев держит вызывающий экран;
 *  thought      — «мысль листа»: последний абзац текста целиком жирным;
 *  page         — номер листа для автотестов (у вступления не задан);
 *  sheetKey     — ключ проявления (смена листа перезапускает fadeIn сцены);
 *  viewportTestId / sheetTestId — testid сцены и листа (только у листов вводки);
 *  gestures     — обработчики тапа и свайпа по сцене (только у листов вводки);
 *  action       — передняя кнопка нижней группы: { testId, label, onClick }.
 */
export default function HeroJourneySheet({
  illustration = null,
  label = null,
  body,
  thought = null,
  page = null,
  sheetKey = null,
  viewportTestId = null,
  sheetTestId = null,
  gestures = null,
  action,
}) {
  return (
    <>
      {/* Сцена листа: тап-зоны считаются по её ширине (обработчики на элементе,
          а не на документе — так жест не конфликтует с Telegram). */}
      <div
        className="mx-hj-story__viewport"
        data-testid={viewportTestId || undefined}
        {...gestures}
      >
        {illustration}

        <div className="mx-hj-step-intro__text mx-protected-text">
          <div className="mx-hj-step-intro__text-scroll">
            <div
              key={sheetKey}
              className="mx-hj-story__sheet"
              data-testid={sheetTestId || undefined}
              data-page={page ?? undefined}
            >
              {label}
              {body}
            </div>
          </div>
        </div>

        {/* Мысль листа — последний жирный абзац: серая метка «МЫСЛЬ»
            (стилем метки листа) и крупная строка одним блоком сразу под
            текстом листа. Без мысли метки нет. */}
        {thought && (
          <div className="mx-hj-story__thought-block">
            <div
              data-testid="hero-story-thought-label"
              className="mx-hj-eyebrow mx-hj-story__label"
            >
              Мысль
            </div>
            <p data-testid="hero-story-thought" className="mx-hj-story__thought mx-protected-text">
              {thought}
            </p>
          </div>
        )}
      </div>

      <div className="mx-hj-story__bottom">
        <RoundSubmitButton
          testId={action.testId}
          label={action.label}
          icon="chevron"
          onClick={action.onClick}
        />
      </div>
    </>
  )
}
