import { useMemo } from 'react'
import { Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
import {
  computeWalletBalances, deleteWallet, deleteTransfer, walletIdOf, currencyOfWallet,
} from '../utils/wallets'
import { formatMoney, formatDate } from '../utils/format'
import { useData } from '../context/DataContext.jsx'

export default function WalletsPage({ transactions, onEdit, onTransfer }) {
  const { wallets, transfers, permissionError } = useData()

  const balances = useMemo(
    () => computeWalletBalances(wallets, transactions, transfers),
    [wallets, transactions, transfers]
  )
  // Total dihitung terpisah per mata uang (tidak ada konversi kurs)
  const totalsByCurrency = wallets.reduce((acc, w) => {
    const code = currencyOfWallet(w)
    acc[code] = (acc[code] || 0) + (balances[w.id] || 0)
    return acc
  }, {})
  // Transfer butuh minimal dua dompet dengan mata uang yang sama
  const canTransfer = wallets.some((w) =>
    wallets.some((o) => o.id !== w.id && currencyOfWallet(o) === currencyOfWallet(w))
  )
  const moneyOf =(w, amount) => formatMoney(amount, currencyOfWallet(w))
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
        {Object.entries(totalsByCurrency).map(([code, amount]) => (
          <div className="wallet-total" key={code}>{formatMoney(amount, code)}</div>
        ))}
      </div>

      {canTransfer && (
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
              <div className="tx-meta">{w.isMain && !(Number(w.initialBalance) > 0) ? 'Dompet bawaan' : `Saldo awal ${moneyOf(w, w.initialBalance || 0)}`}</div>
            </div>
            <div className={`tx-amount ${(balances[w.id] || 0) >= 0 ? 'income' : 'expense'}`}>
              {moneyOf(w, balances[w.id] || 0)}
            </div>
            <button className="tx-delete tx-edit" onClick={() => onEdit(w)} title="Edit">
              <Pencil size={15} />
            </button>
            {!w.isMain && (
              <button className="tx-delete" onClick={() => handleDelete(w)} title="Hapus">
                <Trash2 size={15} />
              </button>
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
                <div className="tx-amount">
                  {formatMoney(tr.amount, currencyOfWallet(wallets.find((w) => w.id === tr.fromWalletId)))}
                </div>
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
