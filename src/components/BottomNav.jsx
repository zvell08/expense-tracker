import { Home, PiggyBank, BarChart3, Target, Menu } from 'lucide-react'

const TABS = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'budget', label: 'Anggaran', icon: PiggyBank },
  { id: 'reports', label: 'Laporan', icon: BarChart3 },
  { id: 'goals', label: 'Target', icon: Target },
  { id: 'more', label: 'Lainnya', icon: Menu },
]

export default function BottomNav({ route, setRoute }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={route === id ? 'active' : ''}
          onClick={() => setRoute(id)}
        >
          <Icon size={19} strokeWidth={route === id ? 2.4 : 1.8} />
          {label}
        </button>
      ))}
    </nav>
  )
}
