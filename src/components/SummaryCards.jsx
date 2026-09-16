import { formatRupiah } from '../utils/format'

export default function SummaryCards({ income, expense }) {
  const balance = income - expense

  return (
    <div className="hero-card">
      <div className="label">Saldo Bulan Ini</div>
      <div className="balance">{formatRupiah(balance)}</div>
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="dot income" />
          <div className="stat-text">
            <div className="stat-label">Pemasukan</div>
            <div className="stat-value">{formatRupiah(income)}</div>
          </div>
        </div>
        <div className="hero-stat">
          <span className="dot expense" />
          <div className="stat-text">
            <div className="stat-label">Pengeluaran</div>
            <div className="stat-value">{formatRupiah(expense)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
