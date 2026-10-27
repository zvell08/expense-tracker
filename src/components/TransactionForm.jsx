import { useState } from 'react'
import { deleteField } from 'firebase/firestore'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories'
import { addTransaction, updateTransaction } from '../utils/firestore'
import { addFundsToGoal } from '../utils/goals'
import { MAIN_WALLET_ID } from '../utils/wallets'
import { parseAmount } from '../utils/format'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function TransactionForm({
  onClose, goals = [], editing = null, defaultWalletId = MAIN_WALLET_ID,
}) {
  const { user } = useAuth()
  const { customCategories, wallets } = useData()
  const [type, setType] = useState(editing?.type || 'expense')
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [category, setCategory] = useState(editing?.category || EXPENSE_CATEGORIES[0].id)
  const [description, setDescription] = useState(editing?.description || '')
  const [date, setDate] = useState(editing?.date || todayStr())
  const [walletId, setWalletId] = useState(
    editing ? (editing.walletId || MAIN_WALLET_ID) : defaultWalletId
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const customForType = customCategories.filter((c) => c.type === type)

  // Transaksi lama dengan kategori buatan yang sudah dihapus: tetap tampilkan pilihannya
  // supaya label/warna lamanya tidak hilang waktu disimpan ulang.
  const orphan = editing
    && editing.type === type
    && editing.categoryLabel
    && !editing.category.startsWith('goal:')
    && !customForType.some((c) => c.id === editing.category)
    ? editing
    : null

  function handleTypeChange(nextType) {
    setType(nextType)
    const list = nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
    setCategory(list[0].id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amountNum = parseAmount(amount)
    if (!amountNum || amountNum <= 0) return
    setSubmitting(true)
    try {
      const isGoal = category.startsWith('goal:')
      const goalId = isGoal ? category.slice(5) : null
      const goal = isGoal ? goals.find((g) => g.id === goalId) : null
      const customCat = customForType.find((c) => c.id === category)
      const keepOrphan = orphan && category === orphan.category

      const categoryLabel = isGoal
        ? (goal?.title || 'Target Keuangan')
        : customCat
          ? customCat.label
          : keepOrphan
            ? orphan.categoryLabel
            : categories.find((c) => c.id === category)?.label

      // Label & warna disimpan di transaksi untuk target keuangan dan kategori buatan,
      // supaya tetap tampil benar walau kategorinya kemudian dihapus.
      let labelFields
      if (isGoal) {
        labelFields = { categoryLabel, categoryColor: goal?.color || '#A78BFA' }
      } else if (customCat) {
        labelFields = { categoryLabel, categoryColor: customCat.color }
      } else if (keepOrphan) {
        labelFields = { categoryLabel, categoryColor: orphan.categoryColor }
      } else if (editing) {
        labelFields = { categoryLabel: deleteField(), categoryColor: deleteField() }
      } else {
        labelFields = {}
      }

      const payload = {
        type,
        amount: amountNum,
        category,
        ...labelFields,
        description: description.trim() || categoryLabel,
        date,
        walletId,
      }

      if (editing) {
        await updateTransaction(editing.id, payload)
      } else {
        await addTransaction(user.uid, payload)
        if (isGoal && goalId) {
          await addFundsToGoal(goalId, amountNum)
        }
      }

      onClose()
    } catch {
      setError('Gagal menyimpan, coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>{editing ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>

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

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="amount">Jumlah (Rp)</label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000 atau 3.5"
            />
          </div>
          <div className="field">
            <label htmlFor="category">Kategori</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
              {customForType.length > 0 && (
                <optgroup label="Kategori Saya">
                  {customForType.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </optgroup>
              )}
              {orphan && (
                <option value={orphan.category}>{orphan.categoryLabel} (dihapus)</option>
              )}
              {!editing && type === 'expense' && goals.length > 0 && (
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
          {wallets.length > 1 && (
            <div className="field">
              <label htmlFor="wallet">Dompet</label>
              <select id="wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
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
