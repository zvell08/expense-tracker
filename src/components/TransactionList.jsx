import { useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { formatMoney, formatDate } from '../utils/format'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories'
import { resolveCategoryDisplay } from '../utils/aggregate'
import { deleteTransaction } from '../utils/firestore'
import { walletIdOf, currencyOfTransaction } from '../utils/wallets'
import { useData } from '../context/DataContext.jsx'

function initials(label) {
  return label.trim().charAt(0).toUpperCase()
}

export default function TransactionList({ transactions, showFilter = true, onEdit }) {
  const { customCategories, wallets } = useData()
  const [filter, setFilter] = useState('all')

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...customCategories]
  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.category === filter)

  const showWallet = wallets.length > 1
  const walletName = (t) => wallets.find((w) => w.id === walletIdOf(t))?.name || 'Dompet dihapus'

  return (
    <div className="tx-card">
      {showFilter && (
        <div className="tx-filter-row">
          <select
            className="category-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Semua kategori</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-block">Belum ada transaksi di kategori ini.</div>
      )}

      {filtered.map((t) => {
        const cat = resolveCategoryDisplay(t, customCategories)
        return (
          <div className="tx-row" key={t.id}>
            <div
              className="tx-icon"
              style={{ background: `${cat.color}1f`, color: cat.color }}
            >
              {initials(cat.label)}
            </div>
            <div className="tx-info">
              <div className="tx-desc">{t.description}</div>
              <div className="tx-meta">
                {cat.label} · {formatDate(t.date)}
                {showWallet && ` · ${walletName(t)}`}
              </div>
            </div>
            <div className={`tx-amount ${t.type}`}>
              {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount, currencyOfTransaction(t, wallets))}
            </div>
            {onEdit && !t.category?.startsWith('goal:') && (
              <button className="tx-delete tx-edit" onClick={() => onEdit(t)} title="Edit">
                <Pencil size={15} />
              </button>
            )}
            <button
              className="tx-delete"
              onClick={() => {
                if (window.confirm(`Hapus transaksi "${t.description}"?`)) deleteTransaction(t.id)
              }}
              title="Hapus"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
