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

// Pilihan warna untuk kategori & dompet buatan user
export const CATEGORY_COLORS = [
  '#B5502B', '#C89B3C', '#7A6BAF', '#3C7A89', '#B5486B', '#2F6F4E',
  '#4A5A8C', '#10B981', '#60A5FA', '#F97066', '#A78BFA', '#F472B6',
]

// Kategori bawaan + kategori buatan user untuk satu tipe
export function categoriesForType(type, customCategories = []) {
  const defaults = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return [...defaults, ...customCategories.filter((c) => c.type === type)]
}

export function getCategoryById(id, type, customCategories = []) {
  const custom = customCategories.find((c) => c.id === id)
  if (custom) return custom
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return list.find((c) => c.id === id) || list[list.length - 1]
}
