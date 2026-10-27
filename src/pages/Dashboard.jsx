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
import WalletForm from '../components/WalletForm.jsx'
import TransferForm from '../components/TransferForm.jsx'
import CategoryForm from '../components/CategoryForm.jsx'
import WalletsPage from './WalletsPage.jsx'
import CategoriesPage from './CategoriesPage.jsx'
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
import { subscribeCustomCategories } from '../utils/customCategories'
import {
  MAIN_WALLET, subscribeWallets, subscribeTransfers, walletIdOf,
} from '../utils/wallets'
import { DataProvider } from '../context/DataContext.jsx'
import { aggregateByCategory, sumByType } from '../utils/aggregate'
import { MONTH_NAMES, monthLabel } from '../utils/format'

const pad2 = (n) => String(n).padStart(2, '0')
const monthStart = (y, m) => {
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`
}

const TITLES = {
  home: 'Ringkasan',
  budget: 'Anggaran',
  reports: 'Laporan',
  goals: 'Target Keuangan',
  more: 'Lainnya',
  transactions: 'Semua Transaksi',
  reminders: 'Tagihan & Reminder',
  wallets: 'Dompet',
  categories: 'Kategori',
}

// Route yang punya FAB, dan aksi FAB-nya masing-masing
const FAB_ROUTE = {
  home: 'transaction',
  transactions: 'transaction',
  goals: 'goal',
  reminders: 'reminder',
  wallets: 'wallet',
  categories: 'category',
}

const SUB_ROUTES = ['transactions', 'reminders', 'wallets', 'categories']

export default function Dashboard() {
  const { user } = useAuth()
  const [route, setRoute] = useState('home')
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState({})
  const [goals, setGoals] = useState([])
  const [reminders, setReminders] = useState([])
  const [activeSheet, setActiveSheet] = useState(null)
  const [editingTx, setEditingTx] = useState(null)
  const [editingWallet, setEditingWallet] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [customCategories, setCustomCategories] = useState([])
  const [wallets, setWallets] = useState([MAIN_WALLET])
  const [transfers, setTransfers] = useState([])
  const [permissionError, setPermissionError] = useState(false)
  const [walletFilter, setWalletFilter] = useState('all')

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())

  useEffect(() => {
    if (!user) return
    const unsubTx = subscribeTransactions(user.uid, setTransactions)
    const unsubBudgets = subscribeBudgets(user.uid, setBudgets)
    const unsubGoals = subscribeGoals(user.uid, setGoals)
    const unsubReminders = subscribeReminders(user.uid, setReminders)
    // Koleksi baru: kalau Security Rules belum diperbarui, jangan bikin app error, cukup beri tahu
    const onDeny = (err) => {
      if (err?.code === 'permission-denied') setPermissionError(true)
    }
    const unsubCategories = subscribeCustomCategories(user.uid, setCustomCategories, onDeny)
    const unsubWallets = subscribeWallets(user.uid, setWallets, onDeny)
    const unsubTransfers = subscribeTransfers(user.uid, setTransfers, onDeny)
    return () => {
      unsubTx(); unsubBudgets(); unsubGoals(); unsubReminders()
      unsubCategories(); unsubWallets(); unsubTransfers()
    }
  }, [user])

  // Kalau dompet yang lagi difilter sudah dihapus, balik ke "semua dompet"
  const activeWalletFilter = walletFilter === 'all' || wallets.some((w) => w.id === walletFilter)
    ? walletFilter
    : 'all'

  const scopedTransactions = useMemo(() => {
    if (activeWalletFilter === 'all') return transactions
    return transactions.filter((t) => walletIdOf(t) === activeWalletFilter)
  }, [transactions, activeWalletFilter])

  const inSelectedMonth = (list) => list.filter((t) => {
    const d = new Date(t.date)
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
  })

  const monthTransactions = useMemo(
    () => inSelectedMonth(scopedTransactions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopedTransactions, selectedYear, selectedMonth]
  )

  // Anggaran tidak ikut filter dompet, karena budget berlaku untuk semua dompet
  const allMonthTransactions = useMemo(
    () => inSelectedMonth(transactions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, selectedYear, selectedMonth]
  )

  const income = sumByType(monthTransactions, 'income')
  const expense = sumByType(monthTransactions, 'expense')

  // Sisa uang dari semua bulan sebelum bulan yang lagi dipilih (dibawa ke bulan ini),
  // termasuk saldo awal dompet dan transfer (kalau lagi lihat satu dompet).
  const { carryOver, monthTransfer } = useMemo(() => {
    const startStr = monthStart(selectedYear, selectedMonth)
    const endStr = monthStart(selectedYear, selectedMonth + 1)
    const fromTx = scopedTransactions
      .filter((t) => t.date < startStr)
      .reduce(
        (sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)),
        0
      )

    if (activeWalletFilter === 'all') {
      const initial = wallets.reduce((sum, w) => sum + (Number(w.initialBalance) || 0), 0)
      return { carryOver: fromTx + initial, monthTransfer: 0 }
    }

    const wallet = wallets.find((w) => w.id === activeWalletFilter)
    const net = (tr) => (
      (tr.toWalletId === activeWalletFilter ? Number(tr.amount) : 0)
      - (tr.fromWalletId === activeWalletFilter ? Number(tr.amount) : 0)
    )
    return {
      carryOver: fromTx
        + (Number(wallet?.initialBalance) || 0)
        + transfers.filter((tr) => tr.date < startStr).reduce((s, tr) => s + net(tr), 0),
      monthTransfer: transfers
        .filter((tr) => tr.date >= startStr && tr.date < endStr)
        .reduce((s, tr) => s + net(tr), 0),
    }
  }, [scopedTransactions, wallets, transfers, activeWalletFilter, selectedYear, selectedMonth])

  const categoryData = useMemo(
    () => aggregateByCategory(monthTransactions, customCategories),
    [monthTransactions, customCategories]
  )

  const monthlyData = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const items = scopedTransactions.filter((t) => {
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
  }, [scopedTransactions, selectedYear, selectedMonth])

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
    setEditingWallet(null)
    setEditingCategory(null)
    setActiveSheet(fabTarget)
  }

  function closeWalletSheet() {
    setActiveSheet(null)
    setEditingWallet(null)
  }

  function closeCategorySheet() {
    setActiveSheet(null)
    setEditingCategory(null)
  }

  const dataValue = { customCategories, wallets, transfers, permissionError }
  const hasMultipleWallets = wallets.length > 1

  function closeTransactionSheet() {
    setActiveSheet(null)
    setEditingTx(null)
  }

  function startEdit(tx) {
    setEditingTx(tx)
    setActiveSheet('transaction')
  }

  return (
    <DataProvider value={dataValue}>
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
          <div className="header-pills">
            {hasMultipleWallets && (
              <select
                className="month-pill wallet-pill"
                value={activeWalletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
              >
                <option value="all">Semua dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            )}
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
          </div>
        )}
      </div>

      {route === 'home' && (
        <>
          <SummaryCards income={income} expense={expense} carryOver={carryOver} transfer={monthTransfer} />
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
            <TransactionList transactions={monthTransactions.slice(0, 6)} showFilter={false} onEdit={startEdit} />
          </div>
        </>
      )}

      {route === 'budget' && (
        <BudgetPage monthTransactions={allMonthTransactions} budgets={budgets} />
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
          <TransactionList transactions={transactions} onEdit={startEdit} />
        </div>
      )}

      {route === 'reminders' && (
        <RemindersPage reminders={reminders} />
      )}

      {route === 'wallets' && (
        <WalletsPage
          transactions={transactions}
          onEdit={(w) => { setEditingWallet(w); setActiveSheet('wallet') }}
          onTransfer={() => setActiveSheet('transfer')}
        />
      )}

      {route === 'categories' && (
        <CategoriesPage onEdit={(c) => { setEditingCategory(c); setActiveSheet('category') }} />
      )}

      {fabTarget && (
        <button className="fab" onClick={openFab} aria-label="Tambah">
          <Plus size={24} />
        </button>
      )}

      <BottomNav route={SUB_ROUTES.includes(route) ? 'more' : route} setRoute={setRoute} />

      {activeSheet === 'transaction' && (
        <TransactionForm
          onClose={closeTransactionSheet}
          goals={goals}
          editing={editingTx}
          defaultWalletId={activeWalletFilter === 'all' ? undefined : activeWalletFilter}
        />
      )}
      {activeSheet === 'goal' && <GoalForm onClose={() => setActiveSheet(null)} />}
      {activeSheet === 'reminder' && <ReminderForm onClose={() => setActiveSheet(null)} />}
      {activeSheet === 'wallet' && <WalletForm onClose={closeWalletSheet} editing={editingWallet} />}
      {activeSheet === 'transfer' && <TransferForm onClose={() => setActiveSheet(null)} />}
      {activeSheet === 'category' && <CategoryForm onClose={closeCategorySheet} editing={editingCategory} />}
    </div>
    </DataProvider>
  )
}
