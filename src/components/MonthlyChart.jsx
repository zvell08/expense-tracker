import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts'
import { formatRupiah } from '../utils/format'

export default function MonthlyChart({ data }) {
  return (
    <div className="card">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={3}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            fontSize={11}
            stroke="var(--ink-soft)"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            fontSize={10.5}
            stroke="var(--ink-soft)"
            tickFormatter={(v) => `${Math.round(v / 1000)}rb`}
            width={40}
          />
          <Tooltip
            contentStyle={{ background: '#1F232C', border: '1px solid #262B35', borderRadius: 10, fontSize: 12.5 }}
            labelStyle={{ color: '#F3F4F6' }}
            itemStyle={{ color: '#F3F4F6' }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            formatter={(value, name) => [
              formatRupiah(value),
              name === 'income' ? 'Pemasukan' : 'Pengeluaran',
            ]}
          />
          <Bar dataKey="income" fill="#34D399" radius={[3, 3, 0, 0]} maxBarSize={14} />
          <Bar dataKey="expense" fill="#F97066" radius={[3, 3, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-legend-chips">
        <span><span className="chip-dot" style={{ background: '#34D399' }} />Pemasukan</span>
        <span><span className="chip-dot" style={{ background: '#F97066' }} />Pengeluaran</span>
      </div>
    </div>
  )
}
