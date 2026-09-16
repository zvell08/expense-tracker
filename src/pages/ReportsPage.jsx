import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts'
import {
  getPeriodRange, filterByRange, shiftPeriod, bucketData, formatPeriodLabel,
  aggregateByCategory, sumByType,
} from '../utils/aggregate'
import { exportReportToExcel } from '../utils/exportExcel'
import { formatRupiah } from '../utils/format'

const PERIODS = [
  { id: 'week', label: 'Minggu' },
  { id: 'month', label: 'Bulan' },
  { id: 'year', label: 'Tahun' },
]

export default function ReportsPage({ transactions }) {
  const [periodType, setPeriodType] = useState('month')
  const [refDate, setRefDate] = useState(new Date())

  const range = useMemo(() => getPeriodRange(periodType, refDate), [periodType, refDate])
  const periodTx = useMemo(() => filterByRange(transactions, range), [transactions, range])
  const chartData = useMemo(() => bucketData(periodType, refDate, transactions), [periodType, refDate, transactions])
  const categoryData = useMemo(() => aggregateByCategory(periodTx), [periodTx])

  const income = sumByType(periodTx, 'income')
  const expense = sumByType(periodTx, 'expense')
  const net = income - expense
  const catTotal = categoryData.reduce((s, c) => s + c.value, 0)
  const periodLabel = formatPeriodLabel(periodType, refDate)

  function handleExport() {
    exportReportToExcel({
      periodLabel,
      income,
      expense,
      transactions: periodTx,
      categoryData,
    })
  }

  return (
    <div className="section" style={{ marginTop: 16 }}>
      <div className="period-toggle">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            className={periodType === p.id ? 'active' : ''}
            onClick={() => setPeriodType(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="period-nav">
        <button onClick={() => setRefDate(shiftPeriod(periodType, refDate, -1))}>
          <ChevronLeft size={17} />
        </button>
        <span className="period-label">{periodLabel}</span>
        <button onClick={() => setRefDate(shiftPeriod(periodType, refDate, 1))}>
          <ChevronRight size={17} />
        </button>
      </div>

      <button className="export-btn" onClick={handleExport} disabled={periodTx.length === 0}>
        <Download size={15} /> Export ke Excel
      </button>

      <div className="report-summary">
        <div className="cell">
          <div className="label">Pemasukan</div>
          <div className="value" style={{ color: 'var(--income)' }}>{formatRupiah(income)}</div>
        </div>
        <div className="cell">
          <div className="label">Pengeluaran</div>
          <div className="value" style={{ color: 'var(--expense)' }}>{formatRupiah(expense)}</div>
        </div>
        <div className="cell net">
          <div className="label">Selisih</div>
          <div className={`value ${net >= 0 ? 'positive' : 'negative'}`}>{formatRupiah(net)}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={chartData} barGap={3}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10.5} stroke="var(--ink-soft)" />
            <YAxis
              axisLine={false} tickLine={false} fontSize={10}
              stroke="var(--ink-soft)"
              tickFormatter={(v) => `${Math.round(v / 1000)}rb`}
              width={38}
            />
            <Tooltip
              contentStyle={{ background: '#1F232C', border: '1px solid #262B35', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: '#F3F4F6' }}
              itemStyle={{ color: '#F3F4F6' }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              formatter={(value, name) => [formatRupiah(value), name === 'income' ? 'Pemasukan' : 'Pengeluaran']}
            />
            <Bar dataKey="income" fill="#34D399" radius={[3, 3, 0, 0]} maxBarSize={16} />
            <Bar dataKey="expense" fill="#F97066" radius={[3, 3, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend-chips">
          <span><span className="chip-dot" style={{ background: '#34D399' }} />Pemasukan</span>
          <span><span className="chip-dot" style={{ background: '#F97066' }} />Pengeluaran</span>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 22 }}>
        <h2>Pengeluaran per Kategori</h2>
      </div>
      <div className="card">
        {categoryData.length === 0 ? (
          <p className="empty-note">Tidak ada pengeluaran di periode ini.</p>
        ) : (
          <div className="category-legend">
            {categoryData
              .sort((a, b) => b.value - a.value)
              .map((c) => (
                <div className="legend-row" key={c.id}>
                  <span className="legend-dot" style={{ background: c.color }} />
                  <span>{c.label}</span>
                  <span className="amount">
                    {formatRupiah(c.value)}
                    <span className="pct">({Math.round((c.value / catTotal) * 100)}%)</span>
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
