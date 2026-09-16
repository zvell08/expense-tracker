import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Satu dokumen per user, berisi map { kategoriId: jumlahBudget }
export function subscribeBudgets(userId, callback) {
  const ref = doc(db, 'budgets', userId)
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data().categories || {}) : {})
  })
}

export async function setBudget(userId, categoryId, amount) {
  const ref = doc(db, 'budgets', userId)
  await setDoc(ref, { userId, categories: { [categoryId]: Number(amount) } }, { merge: true })
}
