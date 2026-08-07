import { motion } from 'framer-motion';
import DayArc from '../components/Motif';
import { platform } from '../platform';

// ──────────────────────────
// Утренний пилот / Первое действие дня
//
// Этот компонент отвечает за большую карточку под лентой недели,
// которая показывает самое важное дело или предлагает добавить ритуал.
// Он скрывается после полудня согласно логике Today.jsx.
// ──────────────────────────

export default function MorningPilotCard({
  rituals,
  todayState,
  isEmpty,
  next,
  onOpenRituals,
}) {
  // Анимация входа утром: снизу вверх с задержкой 0.1с.
  const variants = {
    hidden: { y: 8, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className="w-full max-w-md rounded-[32px] px-6 py-7 text-center flex flex-col justify-center"
      initial="hidden"
      animate={todayState !== 'dayClosed' ? 'visible' : undefined} // Скрытие днём
      exit={{ opacity: 0 }}
      transition={{
        delay: 0.1,
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1]
      }}
      style={{
        backgroundColor: 'rgb(var(--c-card))', // Чистое правило из tailwind.config.js
      }}
    >
      {/* Иллюстрация */}
      <DayArc
        state={isEmpty ? 'empty' : todayState}
        done={
          rituals.filter((ritual) => ritual.today_level).length
        }
        total={rituals.length}
        className="w-full max-w-[300px] h-[150px] mx-auto text-gold"
      />

      {/* Состояния карточки */}
      {(checkinAsHero || todayState === 'dayClosed') && (
        <>
          <div className="text-[13px] font-semibold mb-2 text-faint">
            {todayState === 'reviewPending' ? 'Анализ дня' : 'Сегодня'}
          </div>

          <h2 className="font-display text-[28px] leading-tight text-cream">
            {todayState === 'reviewPending'
              ? 'Разобрать день?'
              : todayState === 'dayClosed'
                ? 'День закрыт'
                : 'Как ты?'}
          </h2>

          <p className="text-[14px] mt-2 text-muted">
            {todayState === 'reviewPending'
              ? 'Уроки и то, чем стоит гордиться'
              : todayState === 'dayClosed'
                ? 'Вечерний разбор завершён'
                : 'Короткий чек-ин состояния'}
          </p>

          {todayState === 'reviewPending' && (
            <div className="w-full max-w-sm mx-auto mt-5 space-y-2 text-left">
              {[...].map((question) => (
                <div key={question} className="rounded-2xl bg-artbed px-4 py-2.5 text-[12px] text-faint">
                  {question}
                </div>
              ))}
              <span className="text-[11px] text-gold font-semibold px-1 pt-1">
                + три вещи, которыми гордишься
              </span>
            </div>
          )}

          <button
            onClick={() => {
              platform.haptic('medium');
              changeSub('checkin'); // Логика из Today.jsx
            }}
            className="cta-pill text-[16px] px-9 py-4 mx-auto mt-7"
          >
            {todayState === 'reviewPending'
              ? 'Разобрать день'
              : todayState === 'dayClosed'
                ? 'Открыть разбор снова'
                : 'Пройти чек-ин'}
          </button>

          {next && (
            <p className="text-[12px] text-faint mt-5">Дальше: {next.title}</p>
          )}
        </>
      )}

      {!checkinAsHero && !isEmpty && (
        <>
          <div className="text-[13px] font-semibold mb-2 text-faint">
            {next ? 'Самое важное' : 'Путь продолжается'}
          </div>

          <h2 className="font-display text-[28px] leading-tight text-cream">
            {next?.title ?? 'Сегодня ты выше, чем вчера'}
          </h2>

          <p className="text-[14px] mt-2 text-muted">
            {next?.meta ?? 'Все практики закрыты'}
          </p>

          <button
            onClick={() => {
              platform.haptic('medium');
              if (next) {
                onOpenPractice(next.sub);
              } else {
                onGoMentor(); // Логика из Today.jsx
              }
            }}
            className="cta-pill text-[16px] px-9 py-4 mx-auto mt-7"
          >
            {next ? 'Начать' : 'Поговорить с наставником'}
          </button>

          {remainAfter > 0 && (
            <p className="text-[12px] text-faint mt-5">
              После этого останется: {remainAfter}
            </p>
          )}
        </>
      )}

      {!checkinAsHero && isEmpty && (
        <>
          <div className="text-[13px] font-semibold mb-2 text-faint">
            Твой путь ждёт
          </div>

          <h2 className="font-display text-[28px] leading-tight text-cream">
            Добавь первый ритуал
          </h2>

          <p className="text-[14px] mt-2 text-muted">
            Система работает через регулярность — начни с одного
          </p>

          <button
            onClick={() => {
              platform.haptic('medium');
              onOpenPractice('rituals');
            }}
            className="cta-pill text-[16px] px-9 py-4 mx-auto mt-7"
          >
            Начать
          </button>
        </>
      )}
    </motion.div>
  );
}
