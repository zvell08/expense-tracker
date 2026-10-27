import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, where,
  serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'categories'

// Tanpa orderBy di query supaya tidak butuh composite index; urutkan di sisi client.
export function subscribeCustomCategories(userId, callback, onError) {
  const q = query(collection(db, COLLECTION), where('userId', '==', userId))
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => a.label.localeCompare(b.label, 'id'))
      callback(items)
    },
    onError
  )
}

export async function addCustomCategory(userId, data) {
  return addDoc(collection(db, COLLECTION), {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateCustomCategory(categoryId, data) {
  return updateDoc(doc(db, COLLECTION, categoryId), data)
}

export async function deleteCustomCategory(categoryId) {
  return deleteDoc(doc(db, COLLECTION, categoryId))
}
