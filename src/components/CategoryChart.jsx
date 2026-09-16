import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatRupiah } from '../utils/format'

export default function CategoryChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="card">
        <p className="empty-note">Belum ada pengeluaran bulan ini.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={54}
            outerRadius={82}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1F232C', border: '1px solid #262B35', borderRadius: 10, fontSize: 12.5 }}
            labelStyle={{ color: '#F3F4F6' }}
            itemStyle={{ color: '#F3F4F6' }}
            formatter={(value) => formatRupiah(value)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="category-legend">
        {data
          .sort((a, b) => b.value - a.value)
          .map((entry) => (
            <div className="legend-row" key={entry.id}>
              <span className="legend-dot" style={{ background: entry.color }} />
              <span>{entry.label}</span>
              <span className="amount">
                {formatRupiah(entry.value)}
                <span className="pct">({Math.round((entry.value / total) * 100)}%)</span>
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
