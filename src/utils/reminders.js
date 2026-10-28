import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, where,
  orderBy, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'reminders'

export function subscribeReminders(userId, callback) {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('dueDate', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function addReminder(userId, data) {
  return addDoc(collection(db, COLLECTION), {
    userId,
    isPaid: false,
    ...data,
    createdAt: serverTimestamp(),
  })
}

// Tanggal jatuh tempo bulan berikutnya (hari dipotong ke akhir bulan kalau perlu, mis. 31 -> 28/30)
function nextMonthDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const lastDay = new Date(y, m + 1, 0).getDate()
  const next = new Date(y, m, Math.min(d, lastDay))
  const pad = (n) => String(n).padStart(2, '0')
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

// Kalau tagihan berulang ditandai lunas, otomatis bikin tagihan bulan berikutnya (sekali saja)
export async function toggleReminderPaid(reminder) {
  const markingPaid = !reminder.isPaid
  const patch = { isPaid: markingPaid }

  if (markingPaid && reminder.recurring && !reminder.nextCreated) {
    await addDoc(collection(db, COLLECTION), {
      userId: reminder.userId,
      title: reminder.title,
      amount: reminder.amount,
      currency: reminder.currency || 'IDR',
      dueDate: nextMonthDate(reminder.dueDate),
      recurring: true,
      isPaid: false,
      createdAt: serverTimestamp(),
    })
    patch.nextCreated = true
  }

  return updateDoc(doc(db, COLLECTION, reminder.id), patch)
}

export async function deleteReminder(reminderId) {
  return deleteDoc(doc(db, COLLECTION, reminderId))
}
