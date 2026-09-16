import { useState } from 'react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories'
import { addTransaction } from '../utils/firestore'
import { addFundsToGoal } from '../utils/goals'
import { useAuth } from '../context/AuthContext.jsx'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function TransactionForm({ onClose, goals = [] }) {
  const { user } = useAuth()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayStr())
  const [submitting, setSubmitting] = useState(false)

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  function handleTypeChange(nextType) {
    setType(nextType)
    const list = nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
    setCategory(list[0].id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      const isGoal = category.startsWith('goal:')
      const goalId = isGoal ? category.slice(5) : null
      const goal = isGoal ? goals.find((g) => g.id === goalId) : null

      const categoryLabel = isGoal
        ? (goal?.title || 'Target Keuangan')
        : categories.find((c) => c.id === category)?.label

      await addTransaction(user.uid, {
        type,
        amount: Number(amount),
        category,
        ...(isGoal ? { categoryLabel, categoryColor: goal?.color || '#A78BFA' } : {}),
        description: description.trim() || categoryLabel,
        date,
      })

      if (isGoal && goalId) {
        await addFundsToGoal(goalId, amount)
      }

      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Tambah Transaksi</h2>

        <div className="type-toggle">
          <button
            type="button"
            className={type === 'expense' ? 'active expense' : ''}
            onClick={() => handleTypeChange('expense')}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            className={type === 'income' ? 'active income' : ''}
            onClick={() => handleTypeChange('income')}
          >
            Pemasukan
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="amount">Jumlah (Rp)</label>
            <input
              id="amount"
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label htmlFor="category">Kategori</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
              {type === 'expense' && goals.length > 0 && (
                <optgroup label="Target Keuangan">
                  {goals.map((g) => (
                    <option key={g.id} value={`goal:${g.id}`}>{g.title}</option>
                  ))}
                </optgroup>
              )}
            </select>
            {category.startsWith('goal:') && (
              <p className="empty-note" style={{ marginTop: 6, marginBottom: 0 }}>
                Jumlah ini otomatis nambah progress target keuangan kamu.
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="description">Catatan (opsional)</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="mis. Makan siang tim"
            />
          </div>
          <div className="field">
            <label htmlFor="date">Tanggal</label>
            <input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
