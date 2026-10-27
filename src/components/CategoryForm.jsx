import { useState } from 'react'
import ColorSwatches from './ColorSwatches.jsx'
import { CATEGORY_COLORS } from '../utils/categories'
import { addCustomCategory, updateCustomCategory } from '../utils/customCategories'
import { useAuth } from '../context/AuthContext.jsx'

export default function CategoryForm({ onClose, editing = null }) {
  const { user } = useAuth()
  const [type, setType] = useState(editing?.type || 'expense')
  const [label, setLabel] = useState(editing?.label || '')
  const [color, setColor] = useState(editing?.color || CATEGORY_COLORS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!label.trim()) return
    setSubmitting(true)
    setError('')
    try {
      if (editing) {
        await updateCustomCategory(editing.id, { label: label.trim(), color })
      } else {
        await addCustomCategory(user.uid, { type, label: label.trim(), color })
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
        <h2>{editing ? 'Edit Kategori' : 'Kategori Baru'}</h2>

        {!editing && (
          <div className="type-toggle">
            <button
              type="button"
              className={type === 'expense' ? 'active expense' : ''}
              onClick={() => setType('expense')}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              className={type === 'income' ? 'active income' : ''}
              onClick={() => setType('income')}
            >
              Pemasukan
            </button>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="cat-label">Nama Kategori</label>
            <input
              id="cat-label"
              type="text"
              required
              maxLength={30}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="mis. Kopi, Parkir, Freelance"
              autoFocus
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
