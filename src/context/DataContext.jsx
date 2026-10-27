import { createContext, useContext } from 'react'
import { MAIN_WALLET } from '../utils/wallets'

// Data tambahan yang dipakai banyak komponen: kategori buatan user, dompet, dan transfer.
// Diisi oleh Dashboard.
const DataContext = createContext({
  customCategories: [],
  wallets: [MAIN_WALLET],
  transfers: [],
  permissionError: false,
})

export const DataProvider = DataContext.Provider

export function useData() {
  return useContext(DataContext)
}
