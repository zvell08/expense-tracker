import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { formatRupiah, formatDate } from '../utils/format'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories'
import { resolveCategoryDisplay } from '../utils/aggregate'
import { deleteTransaction } from '../utils/firestore'

function initials(label) {
  return label.trim().charAt(0).toUpperCase()
}

export default function TransactionList({ transactions, showFilter = true }) {
  const [filter, setFilter] = useState('all')

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.category === filter)

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
        const cat = resolveCategoryDisplay(t)
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
              <div className="tx-meta">{cat.label} · {formatDate(t.date)}</div>
            </div>
            <div className={`tx-amount ${t.type}`}>
              {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
            </div>
            <button className="tx-delete" onClick={() => deleteTransaction(t.id)} title="Hapus">
              <Trash2 size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
