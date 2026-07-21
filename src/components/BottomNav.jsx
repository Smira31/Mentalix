// Иконки — встроенный SVG, без внешних библиотек
const Icon = ({ d, size = 20, fill = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);

const icons = {
  today: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />,
  path: (
    <>
      <path d="m3 20 5.5-9 4 5 3-4.5L21 20z" />
      <circle cx="16" cy="6" r="1.5" />
    </>
  ),
  analytics: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  mentalix: (
    <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3z" />
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </>
  ),
};

const TABS = [
  { id: 'today', label: 'Сегодня' },
  { id: 'path', label: 'Мой путь' },
  { id: 'analytics', label: 'Аналитика' },
  { id: 'mentalix', label: 'Mentalix' },
  { id: 'profile', label: 'Профиль' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-emerald-deep/95 backdrop-blur-md
                 border-t border-emerald-light/20 px-3 pt-2
                 pb-[calc(env(safe-area-inset-bottom)+8px)]"
    >
      <ul className="flex items-center justify-between max-w-md mx-auto">
        {TABS.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onChange(id)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="w-full flex flex-col items-center gap-1 group"
              >
                <span
                  className={[
                    'flex items-center justify-center rounded-full',
                    'transition-all duration-300 ease-out',
                    isActive
                      ? 'w-12 h-12 bg-gold -translate-y-1 shadow-lg shadow-gold/25 text-emerald-deep'
                      : 'w-11 h-11 bg-emerald group-active:bg-emerald-light text-mint/70',
                  ].join(' ')}
                >
                  <Icon d={icons[id]} fill={id === 'mentalix' && isActive} />
                </span>
                <span
                  className={[
                    'text-[10px] font-medium transition-all duration-300',
                    isActive
                      ? 'text-gold opacity-100'
                      : 'text-mint/50 opacity-0 h-0',
                  ].join(' ')}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
