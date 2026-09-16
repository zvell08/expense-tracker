import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, where,
  orderBy, serverTimestamp, updateDoc, increment,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'goals'

export const GOAL_COLORS = ['#10B981', '#60A5FA', '#F5B94D', '#F97066', '#A78BFA', '#34D399', '#F472B6']

export function subscribeGoals(userId, callback) {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function addGoal(userId, data) {
  const color = GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)]
  return addDoc(collection(db, COLLECTION), {
    userId,
    currentAmount: 0,
    color,
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function addFundsToGoal(goalId, amount) {
  return updateDoc(doc(db, COLLECTION, goalId), {
    currentAmount: increment(Number(amount)),
  })
}

export async function deleteGoal(goalId) {
  return deleteDoc(doc(db, COLLECTION, goalId))
}
