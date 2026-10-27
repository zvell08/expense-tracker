import { useMemo } from 'react'
import { Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
import { computeWalletBalances, deleteWallet, deleteTransfer, walletIdOf } from '../utils/wallets'
import { formatRupiah, formatDate } from '../utils/format'
import { useData } from '../context/DataContext.jsx'

export default function WalletsPage({ transactions, onEdit, onTransfer }) {
  const { wallets, transfers, permissionError } = useData()

  const balances = useMemo(
    () => computeWalletBalances(wallets, transactions, transfers),
    [wallets, transactions, transfers]
  )
  const total = wallets.reduce((sum, w) => sum + (balances[w.id] || 0), 0)
  const nameOf = (id) => wallets.find((w) => w.id === id)?.name || 'Dompet dihapus'

  async function handleDelete(wallet) {
    const inUse = transactions.some((t) => walletIdOf(t) === wallet.id)
      || transfers.some((tr) => tr.fromWalletId === wallet.id || tr.toWalletId === wallet.id)
    if (inUse) {
      window.alert('Dompet ini masih punya transaksi atau transfer, jadi belum bisa dihapus. Hapus atau pindahkan dulu transaksinya.')
      return
    }
    if (window.confirm(`Hapus dompet "${wallet.name}"?`)) {
      try {
        await deleteWallet(wallet.id)
      } catch {
        window.alert('Gagal menghapus dompet, coba lagi.')
      }
    }
  }

  return (
    <div className="section" style={{ marginTop: 16 }}>
      {permissionError && (
        <div className="notice">
          Dompet dan transfer belum bisa dipakai: Security Rules Firestore belum diperbarui. Lihat README bagian "Firestore Security Rules".
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="empty-note" style={{ margin: 0 }}>Total semua dompet</div>
        <div className="wallet-total">{formatRupiah(total)}</div>
      </div>

      {wallets.length > 1 && (
        <button className="export-btn" onClick={onTransfer} style={{ marginBottom: 16 }}>
          <ArrowLeftRight size={15} /> Transfer Antar Dompet
        </button>
      )}

      <div className="tx-card">
        {wallets.map((w) => (
          <div className="tx-row" key={w.id}>
            <div className="tx-icon" style={{ background: `${w.color}1f`, color: w.color }}>
              {w.name.charAt(0).toUpperCase()}
            </div>
            <div className="tx-info">
              <div className="tx-desc">{w.name}</div>
              <div className="tx-meta">{w.isMain ? 'Dompet bawaan' : `Saldo awal ${formatRupiah(w.initialBalance || 0)}`}</div>
            </div>
            <div className={`tx-amount ${(balances[w.id] || 0) >= 0 ? 'income' : 'expense'}`}>
              {formatRupiah(balances[w.id] || 0)}
            </div>
            {!w.isMain && (
              <>
                <button className="tx-delete tx-edit" onClick={() => onEdit(w)} title="Edit">
                  <Pencil size={15} />
                </button>
                <button className="tx-delete" onClick={() => handleDelete(w)} title="Hapus">
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {wallets.length === 1 && (
        <p className="empty-note" style={{ marginTop: 12 }}>
          Ketuk tombol + untuk menambah dompet, mis. rekening bank atau e-wallet.
        </p>
      )}

      {transfers.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 22 }}>
            <h2>Riwayat Transfer</h2>
          </div>
          <div className="tx-card">
            {transfers.slice(0, 15).map((tr) => (
              <div className="tx-row" key={tr.id}>
                <div className="tx-icon" style={{ background: 'var(--surface-2)', color: 'var(--accent-strong)' }}>
                  <ArrowLeftRight size={16} />
                </div>
                <div className="tx-info">
                  <div className="tx-desc">{nameOf(tr.fromWalletId)} → {nameOf(tr.toWalletId)}</div>
                  <div className="tx-meta">{tr.note ? `${tr.note} · ` : ''}{formatDate(tr.date)}</div>
                </div>
                <div className="tx-amount">{formatRupiah(tr.amount)}</div>
                <button
                  className="tx-delete"
                  onClick={() => {
                    if (window.confirm('Hapus transfer ini?')) deleteTransfer(tr.id)
                  }}
                  title="Hapus"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
