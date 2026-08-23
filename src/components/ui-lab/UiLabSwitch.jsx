const TABS = [
  { key: 'experiments', label: 'Эксперименты (25)', href: '?ui_lab=1' },
  { key: 'showcase', label: 'Витрина', href: '?ui_lab=showcase' },
]

export default function UiLabSwitch({ active }) {
  return (
    <nav className="mx-ui-lab-switch" aria-label="Разделы ui-lab">
      {TABS.map(tab => (
        <a key={tab.key} href={tab.href} aria-current={tab.key === active ? 'page' : undefined}>
          {tab.label}
        </a>
      ))}
    </nav>
  )
}
