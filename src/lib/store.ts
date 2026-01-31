"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  
  filters: {
    dateFrom?: string
    dateTo?: string
    status?: string
    customerId?: string
    vendorId?: string
    search?: string
  }
  setFilters: (filters: Partial<UIState['filters']>) => void
  clearFilters: () => void
  
  pagination: {
    page: number
    pageSize: number
  }
  setPagination: (pagination: Partial<UIState['pagination']>) => void
  resetPagination: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      filters: {},
      setFilters: (filters) => set((state) => ({ 
        filters: { ...state.filters, ...filters } 
      })),
      clearFilters: () => set({ filters: {} }),
      
      pagination: {
        page: 1,
        pageSize: 10,
      },
      setPagination: (pagination) => set((state) => ({ 
        pagination: { ...state.pagination, ...pagination } 
      })),
      resetPagination: () => set({ pagination: { page: 1, pageSize: 10 } }),
    }),
    {
      name: 'erp-ui-storage',
    }
  )
)

// Re-export useStore as an alias to useUIStore to prevent build errors
// while we transition business data to APIs.
// @ts-ignore
export const useStore = (...args: any[]) => {
  const uiStore = useUIStore(...args)
  return {
    ...uiStore,
    // Provide empty arrays for business data to prevent crashes
    customers: [],
    vendors: [],
    products: [],
    enquiries: [],
    quotations: [],
    salesOrders: [],
    purchaseRequests: [],
    purchaseOrders: [],
    inventory: [],
    grns: [],
    invoices: [],
    payments: [],
    dispatches: [],
    inspections: [],
    ncrs: [],
    mtcs: [],
    notifications: [],
    // Provide dummy functions to prevent crashes
    addInvoice: () => {},
    addPayment: () => {},
    addPurchaseRequest: () => {},
    generateNumber: (prefix: string) => {
      const year = new Date().getFullYear()
      const random = Math.floor(1000 + Math.random() * 9000)
      return `${prefix}-${year}-${random}`
    },
  }
}

export const generateNumber = (prefix: string): string => {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${year}-${random}`
}
