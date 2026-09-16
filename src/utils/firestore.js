import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'transactions'

// Berlangganan realtime ke semua transaksi milik satu user
export function subscribeTransactions(userId, callback) {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(items)
  })
}

export async function addTransaction(userId, transaction) {
  return addDoc(collection(db, COLLECTION), {
    userId,
    ...transaction,
    createdAt: serverTimestamp(),
  })
}

export async function deleteTransaction(transactionId) {
  return deleteDoc(doc(db, COLLECTION, transactionId))
}
