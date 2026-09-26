// ── Ближайшее — карточка прогресс-баров к ближайшим вехам (H11) ──
//
// Тонкая полоса с золотым заполнением, как засечки StreakBar, но
// непрерывная — цель у каждой вехи своя (значок, серия, тема).
// Текст спокойный: «Ещё 3 дня до значка „Месяц пути"».
// Без таймеров, без «осталось N часов», без давления.
//
// Рендерит только карточку с барами. Заголовок и обёртку добавляет
// родитель — так блок вписывается и в шторку огонька (StatsView),
// и в Профиль (ProfileGroup).

import './MilestoneBars.css'

function MilestoneBar({ milestone }) {
  return (
    <div className="mx-milestone-row" data-testid="milestone-bar">
      <span className="mx-milestone-label">{milestone.label}</span>
      <span
        className="mx-milestone-track"
        role="progressbar"
        aria-valuenow={milestone.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={milestone.label}
      >
        <span
          className="mx-milestone-fill"
          style={{ width: `${milestone.percent}%` }}
        />
      </span>
    </div>
  )
}

export default function MilestoneBars({ milestones }) {
  if (!milestones || milestones.length === 0) return null

  return (
    <div className="mx-milestone-list" data-testid="milestone-bars">
      {milestones.map(m => (
        <MilestoneBar key={m.id} milestone={m} />
      ))}
    </div>
  )
}
