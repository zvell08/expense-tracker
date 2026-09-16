import { useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { auth } from '../firebase'

export default function EditNameForm({ onClose }) {
  const [name, setName] = useState(auth.currentUser?.displayName || '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() })
      window.location.reload()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Ubah Nama</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="edit-name">Nama</label>
            <input
              id="edit-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              autoFocus
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
