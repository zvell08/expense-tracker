import { formatRupiah } from '../utils/format'

export default function SummaryCards({ income, expense, carryOver = 0, transfer = 0 }) {
  // Saldo = sisa dari bulan-bulan sebelumnya + pemasukan - pengeluaran bulan ini
  // (+ transfer bersih bulan ini, hanya relevan kalau lagi lihat satu dompet)
  const balance = carryOver + income - expense + transfer

  return (
    <div className="hero-card">
      <div className="label">Saldo Kamu</div>
      <div className="balance">{formatRupiah(balance)}</div>
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="dot carry" />
          <div className="stat-text">
            <div className="stat-label">Sisa bulan lalu</div>
            <div className="stat-value">{formatRupiah(carryOver)}</div>
          </div>
        </div>
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
        {transfer !== 0 && (
          <div className="hero-stat">
            <span className="dot carry" />
            <div className="stat-text">
              <div className="stat-label">Transfer</div>
              <div className="stat-value">{transfer > 0 ? '+' : '-'}{formatRupiah(Math.abs(transfer))}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
