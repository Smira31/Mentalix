const TABS = [
  { key: 'hub', label: 'Хаб', href: '?ui_lab=hub' },
  { key: 'baseline', label: 'Эталон', href: '?ui_lab=baseline' },
  { key: 'compare', label: 'Сравнение', href: '?ui_lab=compare' },
  { key: 'daily-canonical', label: 'Дневной цикл', href: '?ui_lab=daily-canonical' },
  { key: 'practice-flow', label: 'PracticeFlow', href: '?ui_lab=practice-flow' },
]

export default function UiLabSwitch({ active }) {
  return (
    <nav className="mx-ui-lab-switch" aria-label="Разделы UI Lab">
      {TABS.map(tab => (
        <a key={tab.key} href={tab.href} aria-current={tab.key === active ? 'page' : undefined}>
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
