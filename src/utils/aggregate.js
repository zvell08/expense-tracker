import { getCategoryById } from './categories'

// Kelompokkan transaksi pengeluaran menjadi total per kategori (untuk donut chart)
export function aggregateByCategory(transactions, customCategories = []) {
  const map = {}
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      if (!map[t.category]) {
        const cat = resolveCategoryDisplay(t, customCategories)
        map[t.category] = { id: cat.id, label: cat.label, color: cat.color, value: 0 }
      }
      map[t.category].value += Number(t.amount)
    })
  return Object.values(map)
}

// Tentukan label & warna kategori transaksi. Kalau transaksi ini terhubung ke
// target keuangan atau kategori buatan user yang sudah dihapus (categoryLabel/
// categoryColor tersimpan langsung di transaksi), pakai itu. Kategori buatan user
// yang masih ada selalu diutamakan supaya perubahan nama/warna ikut berlaku.
export function resolveCategoryDisplay(t, customCategories = []) {
  const live = customCategories.find((c) => c.id === t.category)
  if (live) {
    return { id: live.id, label: live.label, color: live.color }
  }
  if (t.categoryLabel) {
    return { id: t.category, label: t.categoryLabel, color: t.categoryColor || '#A78BFA' }
  }
  return getCategoryById(t.category, t.type)
}

export function sumByType(transactions, type) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

// ---------- Rentang periode untuk halaman Laporan ----------

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 = Minggu
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getPeriodRange(type, refDate) {
  const d = new Date(refDate)
  if (type === 'week') {
    const start = startOfWeek(d)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  if (type === 'year') {
    const start = new Date(d.getFullYear(), 0, 1)
    const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
    return { start, end }
  }
  // month
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function filterByRange(transactions, range) {
  return transactions.filter((t) => {
    const d = new Date(t.date)
    return d >= range.start && d <= range.end
  })
}

export function shiftPeriod(type, refDate, direction) {
  const d = new Date(refDate)
  if (type === 'week') d.setDate(d.getDate() + direction * 7)
  else if (type === 'year') d.setFullYear(d.getFullYear() + direction)
  else d.setMonth(d.getMonth() + direction)
  return d
}

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// Bucket data untuk bar chart, tergantung tipe periode
export function bucketData(type, refDate, transactions) {
  if (type === 'week') {
    const start = startOfWeek(refDate)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dayStr = d.toISOString().slice(0, 10)
      const items = transactions.filter((t) => t.date === dayStr)
      days.push({
        label: DAY_NAMES[d.getDay()],
        income: sumByType(items, 'income'),
        expense: sumByType(items, 'expense'),
      })
    }
    return days
  }
  if (type === 'year') {
    const year = new Date(refDate).getFullYear()
    const months = []
    for (let m = 0; m < 12; m++) {
      const items = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getFullYear() === year && d.getMonth() === m
      })
      months.push({
        label: MONTH_SHORT[m],
        income: sumByType(items, 'income'),
        expense: sumByType(items, 'expense'),
      })
    }
    return months
  }
  // month -> bucket per minggu (maks 5)
  const d = new Date(refDate)
  const year = d.getFullYear()
  const month = d.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const weeks = []
  for (let start = 1; start <= lastDay; start += 7) {
    const end = Math.min(start + 6, lastDay)
    const items = transactions.filter((t) => {
      const td = new Date(t.date)
      return td.getFullYear() === year && td.getMonth() === month
        && td.getDate() >= start && td.getDate() <= end
    })
    weeks.push({
      label: `${start}-${end}`,
      income: sumByType(items, 'income'),
      expense: sumByType(items, 'expense'),
    })
  }
  return weeks
}

export function formatPeriodLabel(type, refDate) {
  const d = new Date(refDate)
  if (type === 'week') {
    const range = getPeriodRange('week', d)
    const opts = { day: 'numeric', month: 'short' }
    return `${new Intl.DateTimeFormat('id-ID', opts).format(range.start)} - ${new Intl.DateTimeFormat('id-ID', opts).format(range.end)}`
  }
  if (type === 'year') return `${d.getFullYear()}`
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d)
}
