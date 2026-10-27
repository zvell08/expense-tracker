import { Pencil, Trash2 } from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories'
import { deleteCustomCategory } from '../utils/customCategories'
import { useData } from '../context/DataContext.jsx'

function Row({ category, custom, onEdit }) {
  async function handleDelete() {
    const ok = window.confirm(
      `Hapus kategori "${category.label}"? Transaksi lama tetap tersimpan dengan nama kategori ini.`
    )
    if (!ok) return
    try {
      await deleteCustomCategory(category.id)
    } catch {
      window.alert('Gagal menghapus kategori, coba lagi.')
    }
  }

  return (
    <div className="tx-row">
      <div className="tx-icon" style={{ background: `${category.color}1f`, color: category.color }}>
        {category.label.trim().charAt(0).toUpperCase()}
      </div>
      <div className="tx-info">
        <div className="tx-desc">{category.label}</div>
        <div className="tx-meta">{custom ? 'Buatan kamu' : 'Bawaan'}</div>
      </div>
      {custom && (
        <>
          <button className="tx-delete tx-edit" onClick={() => onEdit(category)} title="Edit">
            <Pencil size={15} />
          </button>
          <button className="tx-delete" onClick={handleDelete} title="Hapus">
            <Trash2 size={15} />
          </button>
        </>
      )}
    </div>
  )
}

function Group({ title, defaults, customs, onEdit }) {
  return (
    <>
      <div className="section-header" style={{ marginTop: 18 }}>
        <h2>{title}</h2>
      </div>
      <div className="tx-card">
        {customs.map((c) => <Row key={c.id} category={c} custom onEdit={onEdit} />)}
        {defaults.map((c) => <Row key={c.id} category={c} custom={false} />)}
      </div>
    </>
  )
}

export default function CategoriesPage({ onEdit }) {
  const { customCategories, permissionError } = useData()

  return (
    <div className="section" style={{ marginTop: 16 }}>
      {permissionError && (
        <div className="notice">
          Kategori buatan sendiri belum bisa dipakai: Security Rules Firestore belum diperbarui. Lihat README bagian "Firestore Security Rules".
        </div>
      )}
      <p className="empty-note" style={{ margin: 0 }}>
        Ketuk tombol + untuk membuat kategori sendiri. Kategori bawaan tidak bisa diubah.
      </p>
      <Group
        title="Pengeluaran"
        defaults={EXPENSE_CATEGORIES}
        customs={customCategories.filter((c) => c.type === 'expense')}
        onEdit={onEdit}
      />
      <Group
        title="Pemasukan"
        defaults={INCOME_CATEGORIES}
        customs={customCategories.filter((c) => c.type === 'income')}
        onEdit={onEdit}
      />
    </div>
  )
}
