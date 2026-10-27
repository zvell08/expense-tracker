import { useState } from 'react'
import { addTransfer } from '../utils/wallets'
import { parseAmount } from '../utils/format'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function TransferForm({ onClose }) {
  const { user } = useAuth()
  const { wallets } = useData()
  const [fromId, setFromId] = useState(wallets[0].id)
  const [toId, setToId] = useState(wallets[1]?.id || wallets[0].id)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amountNum = parseAmount(amount)
    if (!amountNum || amountNum <= 0) return
    if (fromId === toId) {
      setError('Dompet asal dan tujuan harus berbeda.')
      return
    }
    setSubmitting(true)
    try {
      await addTransfer(user.uid, {
        fromWalletId: fromId,
        toWalletId: toId,
        amount: amountNum,
        note: note.trim(),
        date,
      })
      onClose()
    } catch (err) {
      setError(err.code === 'permission-denied'
        ? 'Ditolak Firestore. Perbarui Security Rules dulu (lihat README).'
        : 'Gagal menyimpan, coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Transfer Antar Dompet</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="t-from">Dari</label>
            <select id="t-from" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="t-to">Ke</label>
            <select id="t-to" value={toId} onChange={(e) => setToId(e.target.value)}>
              {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="t-amount">Jumlah (Rp)</label>
            <input
              id="t-amount"
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
            />
          </div>
          <div className="field">
            <label htmlFor="t-note">Catatan (opsional)</label>
            <input
              id="t-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="mis. Top up GoPay"
            />
          </div>
          <div className="field">
            <label htmlFor="t-date">Tanggal</label>
            <input
              id="t-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? 'Menyimpan…' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
