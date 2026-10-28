import { useState } from 'react'
import { addGoal } from '../utils/goals'
import { parseAmount, CURRENCIES } from '../utils/format'
import { useAuth } from '../context/AuthContext.jsx'

export default function GoalForm({ onClose }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currency, setCurrency] = useState('IDR')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const targetNum = parseAmount(targetAmount)
    if (!title.trim() || !targetNum || targetNum <= 0) return
    setSubmitting(true)
    try {
      await addGoal(user.uid, { title: title.trim(), targetAmount: targetNum, currency })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Target Keuangan Baru</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="goal-title">Nama Target</label>
            <input
              id="goal-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mis. Dana Darurat, Liburan Bali"
            />
          </div>
          <div className="field">
            <label htmlFor="goal-currency">Mata Uang</label>
            <select id="goal-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="goal-amount">Target Jumlah ({currency})</label>
            <input
              id="goal-amount"
              type="text"
              inputMode="decimal"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="5000000"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? 'Menyimpan…' : 'Buat Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
