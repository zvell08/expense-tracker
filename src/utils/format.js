export function formatRupiah(amount) {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// Terima input angka dalam format apa aja yang wajar: "3.5", "3,5", "1.500,50",
// "1,500.50" — otomatis nebak mana yang pemisah desimal vs pemisah ribuan.
export function parseAmount(raw) {
  if (raw === null || raw === undefined) return NaN
  let s = String(raw).trim().replace(/[^0-9.,-]/g, '')
  if (s === '') return NaN

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // koma di belakang -> koma pemisah desimal, titik pemisah ribuan
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // titik di belakang -> titik pemisah desimal, koma pemisah ribuan
      s = s.replace(/,/g, '')
    }
  } else if (lastComma !== -1) {
    s = s.replace(',', '.')
  }

  const num = parseFloat(s)
  return Number.isFinite(num) ? num : NaN
}

export function formatDate(dateStr) {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function monthLabel(year, monthIndex) {
  return `${MONTH_NAMES[monthIndex].slice(0, 3)} ${String(year).slice(2)}`
}
