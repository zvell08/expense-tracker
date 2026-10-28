import { useState } from 'react'
import ColorSwatches from './ColorSwatches.jsx'
import { CATEGORY_COLORS } from '../utils/categories'
import { addWallet, updateWallet, saveMainWallet } from '../utils/wallets'
import { parseAmount, CURRENCIES } from '../utils/format'
import { useAuth } from '../context/AuthContext.jsx'

export default function WalletForm({ onClose, editing = null }) {
  const { user } = useAuth()
  const [name, setName] = useState(editing?.name || '')
  const [initialBalance, setInitialBalance] = useState(
    editing ? String(editing.initialBalance || 0) : ''
  )
  const [currency, setCurrency] = useState(editing?.currency || 'IDR')
  const [color, setColor] = useState(editing?.color || CATEGORY_COLORS[1])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const balance = initialBalance.trim() === '' ? 0 : parseAmount(initialBalance)
    if (!Number.isFinite(balance)) return
    setSubmitting(true)
    setError('')
    try {
      const data = { name: name.trim(), color, initialBalance: balance, currency }
      if (editing?.isMain) {
        await saveMainWallet(user.uid, data)
      } else if (editing) {
        await updateWallet(editing.id, data)
      } else {
        await addWallet(user.uid, data)
      }
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
        <h2>{editing ? 'Edit Dompet' : 'Dompet Baru'}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="w-name">Nama Dompet</label>
            <input
              id="w-name"
              type="text"
              required
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. BCA, GoPay, Tunai"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="w-currency">Mata Uang</label>
            <select
              id="w-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!!editing && !editing.isMain}
            >
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            {editing && !editing.isMain && (
              <p className="empty-note" style={{ marginTop: 6, marginBottom: 0 }}>
                Mata uang dompet tidak bisa diubah setelah dibuat.
              </p>
            )}
            {editing?.isMain && currency !== (editing.currency || 'IDR') && (
              <p className="empty-note" style={{ marginTop: 6, marginBottom: 0 }}>
                Perhatian: transaksi lama di dompet ini akan dibaca sebagai {currency}, angkanya tidak dikonversi.
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="w-balance">Saldo Awal ({currency})</label>
            <input
              id="w-balance"
              type="text"
              inputMode="decimal"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="field">
            <label>Warna</label>
            <ColorSwatches value={color} onChange={setColor} />
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
