import { Check, Trash2 } from 'lucide-react'
import { toggleReminderPaid, deleteReminder } from '../utils/reminders'
import { formatRupiah, formatDate } from '../utils/format'

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

function ReminderRow({ r }) {
  const diff = daysUntil(r.dueDate)
  const dueSoon = !r.isPaid && diff <= 3
  let metaText = formatDate(r.dueDate)
  if (!r.isPaid) {
    if (diff < 0) metaText = `Terlambat ${Math.abs(diff)} hari`
    else if (diff === 0) metaText = 'Jatuh tempo hari ini'
    else metaText = `${diff} hari lagi · ${formatDate(r.dueDate)}`
  }

  return (
    <div className="reminder-row">
      <button
        className={`reminder-check ${r.isPaid ? 'checked' : ''}`}
        onClick={() => toggleReminderPaid(r)}
      >
        {r.isPaid && <Check size={13} strokeWidth={3} />}
      </button>
      <div className="reminder-info">
        <div className={`reminder-title ${r.isPaid ? 'paid' : ''}`}>{r.title}</div>
        <div className={`reminder-meta ${dueSoon ? 'due-soon' : 'ok'}`}>{metaText}</div>
      </div>
      <div className="reminder-amount">{formatRupiah(r.amount)}</div>
      <button className="reminder-delete" onClick={() => {
        if (window.confirm(`Hapus tagihan "${r.title}"?`)) deleteReminder(r.id)
      }}>
        <Trash2 size={15} />
      </button>
    </div>
  )
}

export default function RemindersPage({ reminders }) {
  const unpaid = reminders.filter((r) => !r.isPaid)
  const paid = reminders.filter((r) => r.isPaid)

  return (
    <div className="section" style={{ marginTop: 16 }}>
      <div className="section-header">
        <h2>Belum Dibayar</h2>
      </div>
      <div className="tx-card">
        {unpaid.length === 0 ? (
          <div className="empty-block">Semua tagihan sudah dibayar. 🎉</div>
        ) : (
          unpaid.map((r) => <ReminderRow key={r.id} r={r} />)
        )}
      </div>

      {paid.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 22 }}>
            <h2>Sudah Dibayar</h2>
          </div>
          <div className="tx-card">
            {paid.map((r) => <ReminderRow key={r.id} r={r} />)}
          </div>
        </>
      )}
    </div>
  )
}
