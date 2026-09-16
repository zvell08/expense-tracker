import { useState } from 'react'
import { addGoal } from '../utils/goals'
import { useAuth } from '../context/AuthContext.jsx'

export default function GoalForm({ onClose }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !targetAmount || Number(targetAmount) <= 0) return
    setSubmitting(true)
    try {
      await addGoal(user.uid, { title: title.trim(), targetAmount: Number(targetAmount) })
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
            <label htmlFor="goal-amount">Target Jumlah (Rp)</label>
            <input
              id="goal-amount"
              type="number"
              min="1"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="5000000"
              inputMode="numeric"
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
