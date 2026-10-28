import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, where,
  serverTimestamp, updateDoc, setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

// Transaksi lama (dan yang tanpa walletId) otomatis masuk ke dompet utama ini.
export const MAIN_WALLET_ID = 'main'
export const MAIN_WALLET = {
  id: MAIN_WALLET_ID,
  name: 'Dompet Utama',
  currency: 'IDR',
  color: '#10B981',
  initialBalance: 0,
  isMain: true,
}

export function walletIdOf(transaction) {
  return transaction.walletId || MAIN_WALLET_ID
}

// Dompet lama (tanpa field currency) dianggap IDR
export function currencyOfWallet(wallet) {
  return wallet?.currency || 'IDR'
}

export function currencyOfTransaction(transaction, wallets) {
  return currencyOfWallet(wallets.find((w) => w.id === walletIdOf(transaction)))
}

// ---------- Dompet ----------

// Pengaturan Dompet Utama (nama, mata uang, dll) disimpan sebagai satu dokumen di collection
// wallets dengan id "main_<uid>" dan flag isMain, lalu digabung ke MAIN_WALLET (id tetap "main").
export function subscribeWallets(userId, callback, onError) {
  const q = query(collection(db, 'wallets'), where('userId', '==', userId))
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const mainOverride = docs.find((w) => w.isMain)
      const items = docs.filter((w) => !w.isMain)
      items.sort((a, b) => a.name.localeCompare(b.name, 'id'))
      const main = mainOverride
        ? { ...MAIN_WALLET, ...mainOverride, id: MAIN_WALLET_ID, isMain: true }
        : MAIN_WALLET
      callback([main, ...items])
    },
    onError
  )
}

export async function saveMainWallet(userId, data) {
  return setDoc(
    doc(db, 'wallets', `main_${userId}`),
    { userId, isMain: true, ...data },
    { merge: true }
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
