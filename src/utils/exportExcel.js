import * as XLSX from 'xlsx'
import { resolveCategoryDisplay } from './aggregate'
import { formatDate } from './format'

function sanitizeFileName(text) {
  return text.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function exportReportToExcel({
  periodLabel, income, expense, transactions, categoryData, customCategories = [], wallets = [],
  currency = 'IDR',
}) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Ringkasan
  const summaryRows = [
    { Keterangan: 'Periode', Nilai: periodLabel },
    { Keterangan: 'Mata Uang', Nilai: currency },
    { Keterangan: 'Total Pemasukan', Nilai: income },
    { Keterangan: 'Total Pengeluaran', Nilai: expense },
    { Keterangan: 'Selisih', Nilai: income - expense },
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows, { skipHeader: false })
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')

  // Sheet 2: Daftar Transaksi
  const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
  const txRows = sortedTx.map((t) => {
    const cat = resolveCategoryDisplay(t, customCategories)
    return {
      Tanggal: formatDate(t.date),
      Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      Dompet: wallets.find((w) => w.id === (t.walletId || 'main'))?.name || 'Dompet Utama',
      Kategori: cat.label,
      Deskripsi: t.description || '',
      Jumlah: Number(t.amount),
    }
  })
  const wsTx = XLSX.utils.json_to_sheet(txRows)
  wsTx['!cols'] = [{ wch: 14 }, { wch: 13 }, { wch: 16 }, { wch: 20 }, { wch: 28 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi')

  // Sheet 3: Per Kategori (pengeluaran)
  const catTotal = categoryData.reduce((s, c) => s + c.value, 0)
  const catRows = [...categoryData]
    .sort((a, b) => b.value - a.value)
    .map((c) => ({
      Kategori: c.label,
      Jumlah: c.value,
      Persentase: catTotal > 0 ? `${Math.round((c.value / catTotal) * 100)}%` : '0%',
    }))
  const wsCat = XLSX.utils.json_to_sheet(catRows)
  wsCat['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsCat, 'Per Kategori')

  const fileName = `Laporan-Keuangan-${currency}-${sanitizeFileName(periodLabel)}.xlsx`
  XLSX.writeFile(wb, fileName)
}
