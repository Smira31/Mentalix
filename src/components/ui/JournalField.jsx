/*
 * <JournalField> — поле без рамки в стиле «Тема недели».
 *
 * Состоит из:
 *  - вопрос (крупный заголовок);
 *  - подсказка (текст с боковой чертой);
 *  - поле ввода (без рамки, прозрачный фон);
 *  - кнопка над клавиатурой (RoundNextButton или кастомный submit).
 *
 * Используется в DailyThoughtInput и PracticeFieldFlow.
 */
export default function JournalField({
  question,
  hint,
  children,
  className = '',
}) {
  return (
    <div className={`mx-journal-field ${className}`}>
      {question && <h2 className="mx-journal-field__question">{question}</h2>}
      {hint && <p className="mx-journal-field__hint">{hint}</p>}
      {children}
    </div>
  )
}
