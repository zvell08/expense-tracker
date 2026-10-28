import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import GoalRing from '../components/GoalRing.jsx'
import { addFundsToGoal, deleteGoal, GOAL_COLORS } from '../utils/goals'
import { formatMoney, parseAmount } from '../utils/format'

function GoalCard({ goal, index }) {
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState('')
  const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  const color = goal.color || GOAL_COLORS[index % GOAL_COLORS.length]

  async function handleAddFunds() {
    const parsed = parseAmount(amount)
    if (parsed && parsed > 0) {
      await addFundsToGoal(goal.id, parsed)
      setAmount('')
      setAdding(false)
    }
  }

  return (
    <div className="goal-card">
      <GoalRing percent={percent} color={color} />
      <div className="goal-info">
        <div className="goal-title">{goal.title}</div>
        <div className="goal-amounts">
          {formatMoney(goal.currentAmount, goal.currency || 'IDR')} / {formatMoney(goal.targetAmount, goal.currency || 'IDR')}
        </div>
        {adding && (
          <div className="budget-edit-row" style={{ marginTop: 8 }}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Jumlah (Rp)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <button onClick={handleAddFunds}>+</button>
          </div>
        )}
      </div>
      <div className="goal-actions">
        <button className="goal-delete-btn" onClick={() => deleteGoal(goal.id)}>
          <Trash2 size={15} />
        </button>
        <button className="goal-add-btn" onClick={() => setAdding((a) => !a)}>
          <Plus size={11} style={{ verticalAlign: -1 }} /> Isi
        </button>
      </div>
    </div>
  )
}

export default function GoalsPage({ goals }) {
  return (
    <div className="section" style={{ marginTop: 16 }}>
      <div className="tx-card">
        {goals.length === 0 ? (
          <div className="empty-block">
            Belum ada target keuangan. Ketuk tombol + untuk bikin target baru (mis. Dana Darurat, Liburan, dll).
          </div>
        ) : (
          goals.map((g, i) => <GoalCard key={g.id} goal={g} index={i} />)
        )}
      </div>
    </div>
  )
}
