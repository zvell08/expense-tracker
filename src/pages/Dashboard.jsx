import { useEffect, useMemo, useState } from 'react'
import { Plus, ArrowLeft } from 'lucide-react'
import BottomNav from '../components/BottomNav.jsx'
import SummaryCards from '../components/SummaryCards.jsx'
import CategoryChart from '../components/CategoryChart.jsx'
import MonthlyChart from '../components/MonthlyChart.jsx'
import TransactionList from '../components/TransactionList.jsx'
import TransactionForm from '../components/TransactionForm.jsx'
import GoalForm from '../components/GoalForm.jsx'
import ReminderForm from '../components/ReminderForm.jsx'
import BudgetPage from './BudgetPage.jsx'
import ReportsPage from './ReportsPage.jsx'
import GoalsPage from './GoalsPage.jsx'
import RemindersPage from './RemindersPage.jsx'
import MorePage from './MorePage.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { subscribeTransactions } from '../utils/firestore'
import { subscribeBudgets } from '../utils/budgets'
import { subscribeGoals } from '../utils/goals'
import { subscribeReminders } from '../utils/reminders'
import { aggregateByCategory, sumByType } from '../utils/aggregate'
import { MONTH_NAMES, monthLabel } from '../utils/format'

const TITLES = {
  home: 'Ringkasan',
  budget: 'Anggaran',
  reports: 'Laporan',
  goals: 'Target Keuangan',
  more: 'Lainnya',
  transactions: 'Semua Transaksi',
  reminders: 'Tagihan & Reminder',
}

// Route yang punya FAB, dan aksi FAB-nya masing-masing
const FAB_ROUTE = {
  home: 'transaction',
  transactions: 'transaction',
  goals: 'goal',
  reminders: 'reminder',
}

const SUB_ROUTES = ['transactions', 'reminders']

export default function Dashboard() {
  const { user } = useAuth()
  const [route, setRoute] = useState('home')
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState({})
  const [goals, setGoals] = useState([])
  const [reminders, setReminders] = useState([])
  const [activeSheet, setActiveSheet] = useState(null)

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())

  useEffect(() => {
    if (!user) return
    const unsubTx = subscribeTransactions(user.uid, setTransactions)
    const unsubBudgets = subscribeBudgets(user.uid, setBudgets)
    const unsubGoals = subscribeGoals(user.uid, setGoals)
    const unsubReminders = subscribeReminders(user.uid, setReminders)
    return () => {
      unsubTx(); unsubBudgets(); unsubGoals(); unsubReminders()
    }
  }, [user])

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
    })
  }, [transactions, selectedYear, selectedMonth])

  const income = sumByType(monthTransactions, 'income')
  const expense = sumByType(monthTransactions, 'expense')
  const categoryData = useMemo(() => aggregateByCategory(monthTransactions), [monthTransactions])

  const monthlyData = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const items = transactions.filter((t) => {
        const td = new Date(t.date)
        return td.getFullYear() === y && td.getMonth() === m
      })
      result.push({
        label: monthLabel(y, m),
        income: sumByType(items, 'income'),
        expense: sumByType(items, 'expense'),
      })
    }
    return result
  }, [transactions, selectedYear, selectedMonth])

  const monthOptions = useMemo(() => {
    const set = new Set([`${now.getFullYear()}-${now.getMonth()}`])
    transactions.forEach((t) => {
      const d = new Date(t.date)
      set.add(`${d.getFullYear()}-${d.getMonth()}`)
    })
    return Array.from(set)
      .map((s) => { const [y, m] = s.split('-').map(Number); return { y, m } })
      .sort((a, b) => (b.y - a.y) || (b.m - a.m))
  }, [transactions])

  const unpaidCount = reminders.filter((r) => !r.isPaid).length
  const isSubRoute = SUB_ROUTES.includes(route)
  const fabTarget = FAB_ROUTE[route]
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Pengguna'

  function openFab() {
    setActiveSheet(fabTarget)
  }

  return (
    <div className="app-shell">
      <div className="top-header">
        <div className="header-back">
          {isSubRoute && (
            <button className="icon-btn" onClick={() => setRoute('more')}>
              <ArrowLeft size={17} />
            </button>
          )}
          <div>
            {!isSubRoute && <p className="greeting">Halo 👋</p>}
            <h1>{route === 'home' ? displayName : TITLES[route]}</h1>
          </div>
        </div>

        {route === 'home' && (
          <select
            className="month-pill"
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number)
              setSelectedYear(y); setSelectedMonth(m)
            }}
          >
            {monthOptions.map(({ y, m }) => (
              <option key={`${y}-${m}`} value={`${y}-${m}`}>
                {MONTH_NAMES[m].slice(0, 3)} {y}
              </option>
            ))}
          </select>
        )}
      </div>

      {route === 'home' && (
        <>
          <SummaryCards income={income} expense={expense} />
          <div className="section">
            <div className="section-header"><h2>Pengeluaran per Kategori</h2></div>
            <CategoryChart data={categoryData} />
          </div>
          <div className="section">
            <div className="section-header"><h2>Tren 6 Bulan</h2></div>
            <MonthlyChart data={monthlyData} />
          </div>
          <div className="section">
            <div className="section-header">
              <h2>Transaksi Terakhir</h2>
              <button className="section-link" onClick={() => setRoute('transactions')}>Lihat semua</button>
            </div>
            <TransactionList transactions={monthTransactions.slice(0, 6)} showFilter={false} />
          </div>
        </>
      )}

      {route === 'budget' && (
        <BudgetPage monthTransactions={monthTransactions} budgets={budgets} />
      )}

      {route === 'reports' && (
        <ReportsPage transactions={transactions} />
      )}

      {route === 'goals' && (
        <GoalsPage goals={goals} />
      )}

      {route === 'more' && (
        <MorePage setRoute={setRoute} unpaidCount={unpaidCount} />
      )}

      {route === 'transactions' && (
        <div className="section" style={{ marginTop: 16 }}>
          <TransactionList transactions={transactions} />
        </div>
      )}

      {route === 'reminders' && (
        <RemindersPage reminders={reminders} />
      )}

      {fabTarget && (
        <button className="fab" onClick={openFab} aria-label="Tambah">
          <Plus size={24} />
        </button>
      )}

      <BottomNav route={route === 'transactions' || route === 'reminders' ? 'more' : route} setRoute={setRoute} />

      {activeSheet === 'transaction' && <TransactionForm onClose={() => setActiveSheet(null)} goals={goals} />}
      {activeSheet === 'goal' && <GoalForm onClose={() => setActiveSheet(null)} />}
      {activeSheet === 'reminder' && <ReminderForm onClose={() => setActiveSheet(null)} />}
    </div>
  )
}
