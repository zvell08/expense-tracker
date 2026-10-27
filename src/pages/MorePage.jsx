import { useState } from 'react'
import { Receipt, Bell, LogOut, Pencil, ChevronRight, Wallet, Tags } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import EditNameForm from '../components/EditNameForm.jsx'

export default function MorePage({ setRoute, unpaidCount }) {
  const { user, logout } = useAuth()
  const [editingName, setEditingName] = useState(false)
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Pengguna'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="section" style={{ marginTop: 16 }}>
      <div className="profile-block">
        <div className="profile-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="profile-email">{displayName}</div>
          <div className="profile-sub">{user?.email}</div>
        </div>
        <button className="icon-btn" onClick={() => setEditingName(true)} aria-label="Ubah nama">
          <Pencil size={15} />
        </button>
      </div>

      <div className="menu-list">
        <button className="menu-item" onClick={() => setRoute('transactions')}>
          <span className="menu-icon"><Receipt size={18} /></span>
          Semua Transaksi
          <ChevronRight size={16} className="menu-arrow" />
        </button>
        <button className="menu-item" onClick={() => setRoute('wallets')}>
          <span className="menu-icon"><Wallet size={18} /></span>
          Dompet
          <ChevronRight size={16} className="menu-arrow" />
        </button>
        <button className="menu-item" onClick={() => setRoute('categories')}>
          <span className="menu-icon"><Tags size={18} /></span>
          Kategori
          <ChevronRight size={16} className="menu-arrow" />
        </button>
        <button className="menu-item" onClick={() => setRoute('reminders')}>
          <span className="menu-icon"><Bell size={18} /></span>
          Tagihan & Reminder
          {unpaidCount > 0 && (
            <span style={{
              background: 'var(--expense)', color: '#fff', fontSize: 11, fontWeight: 700,
              borderRadius: 999, padding: '2px 8px', marginLeft: 10,
            }}>
              {unpaidCount}
            </span>
          )}
          <ChevronRight size={16} className="menu-arrow" />
        </button>
        <button className="menu-item danger" onClick={logout}>
          <span className="menu-icon"><LogOut size={18} /></span>
          Keluar
        </button>
      </div>

      {editingName && <EditNameForm onClose={() => setEditingName(false)} />}
    </div>
  )
}
