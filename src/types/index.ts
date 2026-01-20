// TiKès Type Definitions

export interface Product {
  id?: number
  name: string
  price: number
  cost?: number
  categoryId?: number
  barcode?: string
  imageUrl?: string
  stockQuantity: number
  lowStockThreshold: number
  unitType: 'each' | 'kg' | 'lb' | 'dozen' | 'liter'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export interface Category {
  id?: number
  name: string
  icon?: string
  sortOrder: number
  createdAt: Date
}

export interface Customer {
  id?: number
  name: string
  phone?: string
  notes?: string
  totalPurchases: number
  creditBalance: number
  createdAt: Date
  updatedAt: Date
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export interface Sale {
  id?: number
  localId: string // UUID for offline-first
  customerId?: number
  userId?: number
  items: SaleItem[]
  subtotal: number
  discount: number
  discountType: 'percentage' | 'fixed'
  tax: number
  total: number
  payments: Payment[]
  status: 'completed' | 'voided' | 'pending'
  notes?: string
  createdAt: Date
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export interface SaleItem {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

export interface Payment {
  method: 'cash' | 'moncash' | 'natcash' | 'card'
  amount: number
  reference?: string
  status: 'completed' | 'pending' | 'failed'
}

export interface CreditTransaction {
  id?: number
  customerId: number
  saleId?: number
  amount: number
  type: 'credit_given' | 'payment_received'
  balanceAfter: number
  notes?: string
  createdAt: Date
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export interface User {
  id?: number
  name: string
  phone: string
  pin: string
  role: 'owner' | 'manager' | 'cashier'
  isActive: boolean
  createdAt: Date
}

export interface Settings {
  id?: number
  language: 'ht' | 'fr'
  currency: 'HTG' | 'USD'
  businessName: string
  businessPhone?: string
  businessAddress?: string
  taxRate: number
  receiptFooter?: string
}
