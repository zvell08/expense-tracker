import { useState } from 'react'
import { addReminder } from '../utils/reminders'
import { useAuth } from '../context/AuthContext.jsx'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function ReminderForm({ onClose }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(todayStr())
  const [recurring, setRecurring] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      await addReminder(user.uid, {
        title: title.trim(),
        amount: Number(amount),
        dueDate,
        recurring,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Tagihan Baru</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="r-title">Nama Tagihan</label>
            <input
              id="r-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mis. Listrik, Internet, Cicilan"
            />
          </div>
          <div className="field">
            <label htmlFor="r-amount">Jumlah (Rp)</label>
            <input
              id="r-amount"
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="150000"
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label htmlFor="r-date">Jatuh Tempo</label>
            <input
              id="r-date"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              id="r-recurring"
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <label htmlFor="r-recurring" style={{ margin: 0 }}>Berulang tiap bulan</label>
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
