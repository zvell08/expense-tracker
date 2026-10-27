import { useState } from 'react'
import { Pencil } from 'lucide-react'
import GoalRing from '../components/GoalRing.jsx'
import { categoriesForType } from '../utils/categories'
import { useData } from '../context/DataContext.jsx'
import { setBudget } from '../utils/budgets'
import { formatRupiah, parseAmount } from '../utils/format'
import { useAuth } from '../context/AuthContext.jsx'

function BudgetRow({ category, spent, budget }) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(budget || '')

  const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const over = budget > 0 && spent > budget
  const barColor = over ? 'var(--expense)' : percent > 75 ? 'var(--gold)' : 'var(--accent)'

  async function handleSave() {
    const parsed = parseAmount(value)
    if (Number.isFinite(parsed) && parsed >= 0) {
      await setBudget(user.uid, category.id, parsed)
    }
    setEditing(false)
  }

  return (
    <div className="budget-row">
      <div className="budget-row-top">
        <div className="budget-cat-name">
          <span className="legend-dot" style={{ background: category.color }} />
          {category.label}
        </div>
        <button className="budget-edit-btn" onClick={() => setEditing((e) => !e)}>
          <Pencil size={13} />
        </button>
      </div>

      {budget > 0 ? (
        <>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percent}%`, background: barColor }} />
          </div>
          <div className="budget-numbers" style={{ marginTop: 6 }}>
            {formatRupiah(spent)} / {formatRupiah(budget)}
            {over && <span style={{ color: 'var(--expense)', marginLeft: 6 }}>· melebihi budget</span>}
          </div>
        </>
      ) : (
        <div className="empty-note">Belum ada budget diatur.</div>
      )}

      {editing && (
        <div className="budget-edit-row">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Jumlah budget (Rp)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button onClick={handleSave}>Simpan</button>
        </div>
      )}
    </div>
  )
}

export default function BudgetPage({ monthTransactions, budgets }) {
  const { customCategories } = useData()
  const EXPENSE_CATEGORIES = categoriesForType('expense', customCategories)
  const spentByCategory = {}
  monthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Number(t.amount)
    })

  const budgetedCategories = EXPENSE_CATEGORIES.filter((c) => Number(budgets[c.id]) > 0)
  const totalBudget = budgetedCategories.reduce((sum, c) => sum + (Number(budgets[c.id]) || 0), 0)
  const totalSpent = budgetedCategories.reduce((sum, c) => sum + (spentByCategory[c.id] || 0), 0)

  return (
    <>
      <div className="section" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="section-header" style={{ marginBottom: 10 }}>
            <h2>Sisa Budget per Kategori</h2>
          </div>

          {budgetedCategories.length === 0 ? (
            <p className="empty-note">Atur budget per kategori di bawah untuk mulai memantau pengeluaran.</p>
          ) : (
            <>
              <div className="ring-row">
                {budgetedCategories.map((cat) => {
                  const budget = Number(budgets[cat.id]) || 0
                  const spent = spentByCategory[cat.id] || 0
                  const remaining = Math.max(0, budget - spent)
                  const remainingPercent = budget > 0 ? Math.max(0, ((budget - spent) / budget) * 100) : 0
                  const over = spent > budget

                  return (
                    <div className="ring-item" key={cat.id}>
                      <GoalRing
                        percent={remainingPercent}
                        color={over ? 'var(--expense)' : cat.color}
                        size={64}
                        stroke={6}
                      />
                      <div className="ring-item-label">{cat.label}</div>
                      <div className="ring-item-amount">
                        {over
                          ? `Lebih ${formatRupiah(spent - budget)}`
                          : `${formatRupiah(remaining)} sisa`}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="budget-numbers" style={{ marginTop: 14 }}>
                Total sisa {formatRupiah(Math.max(0, totalBudget - totalSpent))} dari {formatRupiah(totalBudget)}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Budget per Kategori</h2>
        </div>
        <div className="tx-card">
          {EXPENSE_CATEGORIES.map((cat) => (
            <BudgetRow
              key={cat.id}
              category={cat}
              spent={spentByCategory[cat.id] || 0}
              budget={Number(budgets[cat.id]) || 0}
            />
          ))}
        </div>
      </div>
    </>
  )
}
