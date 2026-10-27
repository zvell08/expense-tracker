import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, where,
  serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

// Transaksi lama (dan yang tanpa walletId) otomatis masuk ke dompet utama ini.
export const MAIN_WALLET_ID = 'main'
export const MAIN_WALLET = {
  id: MAIN_WALLET_ID,
  name: 'Dompet Utama',
  color: '#10B981',
  initialBalance: 0,
  isMain: true,
}

export function walletIdOf(transaction) {
  return transaction.walletId || MAIN_WALLET_ID
}

// ---------- Dompet ----------

export function subscribeWallets(userId, callback, onError) {
  const q = query(collection(db, 'wallets'), where('userId', '==', userId))
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => a.name.localeCompare(b.name, 'id'))
      callback([MAIN_WALLET, ...items])
    },
    onError
  )
}

export async function addWallet(userId, data) {
  return addDoc(collection(db, 'wallets'), {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateWallet(walletId, data) {
  return updateDoc(doc(db, 'wallets', walletId), data)
}

export async function deleteWallet(walletId) {
  return deleteDoc(doc(db, 'wallets', walletId))
}

// ---------- Transfer antar dompet ----------
// Disimpan di collection terpisah supaya tidak ikut terhitung sebagai pemasukan/pengeluaran.

export function subscribeTransfers(userId, callback, onError) {
  const q = query(collection(db, 'transfers'), where('userId', '==', userId))
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      callback(items)
    },
    onError
  )
}

export async function addTransfer(userId, data) {
  return addDoc(collection(db, 'transfers'), {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function deleteTransfer(transferId) {
  return deleteDoc(doc(db, 'transfers', transferId))
}

// ---------- Saldo ----------

// Saldo semua waktu per dompet: saldo awal + pemasukan - pengeluaran + transfer masuk - transfer keluar
export function computeWalletBalances(wallets, transactions, transfers) {
  const balances = {}
  wallets.forEach((w) => { balances[w.id] = Number(w.initialBalance) || 0 })

  transactions.forEach((t) => {
    const id = walletIdOf(t)
    if (!(id in balances)) return
    balances[id] += t.type === 'income' ? Number(t.amount) : -Number(t.amount)
  })

  transfers.forEach((tr) => {
    if (tr.fromWalletId in balances) balances[tr.fromWalletId] -= Number(tr.amount)
    if (tr.toWalletId in balances) balances[tr.toWalletId] += Number(tr.amount)
  })

  return balances
}
