// Serverless function (Vercel) — endpoint khusus buat Siri Shortcuts / automasi lain
// menambahkan transaksi ke Firestore tanpa perlu login lewat aplikasi.
//
// Contoh pemanggilan (GET, gampang dipakai dari Shortcuts "Get Contents of URL"):
// https://domain-kamu.vercel.app/api/add-transaction
//   ?secret=RAHASIA
//   &type=expense
//   &amount=50000
//   &category=makanan
//   &desc=Makan%20siang
//
// Field yang wajib: secret, type (expense/income), amount, category
// Field opsional: desc (default = nama kategori), date (default = hari ini, format YYYY-MM-DD),
// wallet (nama dompet, default = Dompet Utama). category juga bisa nama kategori buatan sendiri.

import admin from 'firebase-admin'
import { timingSafeEqual } from 'node:crypto'

// Inisialisasi lazy supaya env var yang kosong/salah jadi respons 500 yang jelas, bukan crash
function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      ),
    })
  }
  return admin.firestore()
}

function secretMatches(given) {
  const expected = process.env.SHORTCUT_SECRET
  if (!expected || typeof given !== 'string') return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

const EXPENSE_LABELS = {
  makanan: 'Makanan & Minuman', transportasi: 'Transportasi', belanja: 'Belanja',
  tagihan: 'Tagihan & Utilitas', hiburan: 'Hiburan', kesehatan: 'Kesehatan',
  pendidikan: 'Pendidikan', lainnya: 'Lainnya',
}
const INCOME_LABELS = {
  gaji: 'Gaji', bonus: 'Bonus / THR', usaha: 'Usaha Sampingan', 'lainnya-masuk': 'Lainnya',
}

// Terima juga nama kategori polos (mis. dari menu Siri Shortcuts: "Makanan", "Transportasi", dst)
// selain kode resmi (mis. "makanan"), biar Shortcut nggak perlu nerjemahin manual.
const CATEGORY_ALIASES = {
  makanan: 'makanan', transportasi: 'transportasi', belanja: 'belanja',
  tagihan: 'tagihan', hiburan: 'hiburan', kesehatan: 'kesehatan',
  pendidikan: 'pendidikan', lainnya: 'lainnya',
  gaji: 'gaji', bonus: 'bonus', usaha: 'usaha', 'lainnyamasuk': 'lainnya-masuk',
}

// Normalisasi nama untuk pencocokan longgar (huruf kecil, tanpa spasi/tanda baca)
function normalizeName(raw) {
  return String(raw || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function normalizeCategory(raw) {
  if (!raw) return null
  const key = String(raw).trim().toLowerCase().replace(/[^a-z]/g, '')
  return CATEGORY_ALIASES[key] || null
}

export default async function handler(req, res) {
  const params = req.method === 'GET' ? req.query : req.body

  // Secret boleh lewat header "x-secret" (lebih aman, tidak masuk log URL) atau parameter "secret"
  const givenSecret = req.headers['x-secret'] || params?.secret
  if (!params || !secretMatches(givenSecret)) {
    return res.status(401).json({ ok: false, error: 'Kode rahasia salah atau tidak ada.' })
  }

  const { type, amount, category: rawCategory, desc, date, wallet: rawWallet } = params

  if (!['expense', 'income'].includes(type)) {
    return res.status(400).json({ ok: false, error: 'type harus "expense" atau "income".' })
  }
  const amountNum = Number(amount)
  if (!amountNum || amountNum <= 0) {
    return res.status(400).json({ ok: false, error: 'amount harus angka lebih dari 0.' })
  }

  try {
    const userId = process.env.SHORTCUT_USER_ID
    const db = getDb()

    // Kategori: kode/nama bawaan dulu, kalau tidak ada cocokkan dengan kategori buatan user
    const labels = type === 'expense' ? EXPENSE_LABELS : INCOME_LABELS
    let category = normalizeCategory(rawCategory)
    let categoryLabel = category && labels[category]
    let categoryColor = null

    if (!categoryLabel && rawCategory) {
      const snap = await db.collection('categories')
        .where('userId', '==', userId)
        .where('type', '==', type)
        .get()
      const wanted = normalizeName(rawCategory)
      const match = snap.docs.find((d) => normalizeName(d.data().label) === wanted)
      if (match) {
        category = match.id
        categoryLabel = match.data().label
        categoryColor = match.data().color
      }
    }

    if (!categoryLabel) {
      return res.status(400).json({
        ok: false,
        error: `category "${rawCategory}" tidak dikenal. Pilihan bawaan: ${Object.keys(labels).join(', ')}, atau nama kategori buatanmu.`,
      })
    }

    // Dompet (opsional): cocokkan nama dompet; kosong atau "utama" = Dompet Utama
    let walletId = 'main'
    if (rawWallet && !['utama', 'dompetutama', 'main'].includes(normalizeName(rawWallet))) {
      const snap = await db.collection('wallets').where('userId', '==', userId).get()
      const wanted = normalizeName(rawWallet)
      const match = snap.docs.find((d) => normalizeName(d.data().name) === wanted)
      if (!match) {
        return res.status(400).json({ ok: false, error: `wallet "${rawWallet}" tidak ditemukan.` })
      }
      // Dokumen pengaturan Dompet Utama (isMain) tetap dipakai sebagai id "main"
      walletId = match.data().isMain ? 'main' : match.id
    }

    await db.collection('transactions').add({
      userId,
      type,
      amount: amountNum,
      category,
      ...(categoryColor ? { categoryLabel, categoryColor } : {}),
      walletId,
      description: (desc && String(desc).trim()) || categoryLabel,
      date: date || new Date().toISOString().slice(0, 10),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'siri-shortcut',
    })
    return res.status(200).json({ ok: true, message: 'Transaksi tersimpan.' })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}
