// Kategori pengeluaran — warna dipakai konsisten di chart & label
export const EXPENSE_CATEGORIES = [
  { id: 'makanan', label: 'Makanan & Minuman', color: '#B5502B' },
  { id: 'transportasi', label: 'Transportasi', color: '#C89B3C' },
  { id: 'belanja', label: 'Belanja', color: '#7A6BAF' },
  { id: 'tagihan', label: 'Tagihan & Utilitas', color: '#3C7A89' },
  { id: 'hiburan', label: 'Hiburan', color: '#B5486B' },
  { id: 'kesehatan', label: 'Kesehatan', color: '#2F6F4E' },
  { id: 'pendidikan', label: 'Pendidikan', color: '#4A5A8C' },
  { id: 'lainnya', label: 'Lainnya', color: '#7A7566' },
]

export const INCOME_CATEGORIES = [
  { id: 'gaji', label: 'Gaji', color: '#2F6F4E' },
  { id: 'bonus', label: 'Bonus / THR', color: '#5B8C5A' },
  { id: 'usaha', label: 'Usaha Sampingan', color: '#3C7A89' },
  { id: 'lainnya-masuk', label: 'Lainnya', color: '#7A7566' },
]

export function getCategoryById(id, type) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return list.find((c) => c.id === id) || list[list.length - 1]
}
