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

export async function toggleReminderPaid(reminderId, currentValue) {
  return updateDoc(doc(db, COLLECTION, reminderId), { isPaid: !currentValue })
}

export async function deleteReminder(reminderId) {
  return deleteDoc(doc(db, COLLECTION, reminderId))
}
