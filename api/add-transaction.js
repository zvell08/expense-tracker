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
// Field opsional: desc (default = nama kategori), date (default = hari ini, format YYYY-MM-DD)

import admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  })
}

const db = admin.firestore()

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

function normalizeCategory(raw) {
  if (!raw) return null
  const key = String(raw).trim().toLowerCase().replace(/[^a-z]/g, '')
  return CATEGORY_ALIASES[key] || null
}

export default async function handler(req, res) {
  const params = req.method === 'GET' ? req.query : req.body

  if (!params || params.secret !== process.env.SHORTCUT_SECRET) {
    return res.status(401).json({ ok: false, error: 'Kode rahasia salah atau tidak ada.' })
  }

  const { type, amount, category: rawCategory, desc, date } = params
  const category = normalizeCategory(rawCategory)

  if (!['expense', 'income'].includes(type)) {
    return res.status(400).json({ ok: false, error: 'type harus "expense" atau "income".' })
  }
  const amountNum = Number(amount)
  if (!amountNum || amountNum <= 0) {
    return res.status(400).json({ ok: false, error: 'amount harus angka lebih dari 0.' })
  }

  const labels = type === 'expense' ? EXPENSE_LABELS : INCOME_LABELS
  const categoryLabel = category && labels[category]
  if (!categoryLabel) {
    return res.status(400).json({
      ok: false,
      error: `category "${rawCategory}" tidak dikenal. Pilihan: ${Object.keys(labels).join(', ')}`,
    })
  }

  try {
    await db.collection('transactions').add({
      userId: process.env.SHORTCUT_USER_ID,
      type,
      amount: amountNum,
      category,
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
