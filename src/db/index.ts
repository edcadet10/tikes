import Dexie, { type EntityTable } from 'dexie'
import type { 
  Product, 
  Category, 
  Customer, 
  Sale, 
  CreditTransaction,
  User,
  Settings 
} from '../types'

// TiKès Database - Offline-first with Dexie.js
class TiKesDatabase extends Dexie {
  products!: EntityTable<Product, 'id'>
  categories!: EntityTable<Category, 'id'>
  customers!: EntityTable<Customer, 'id'>
  sales!: EntityTable<Sale, 'id'>
  creditTransactions!: EntityTable<CreditTransaction, 'id'>
  users!: EntityTable<User, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor() {
    super('TiKesDB')

    this.version(1).stores({
      products: '++id, name, categoryId, barcode, isActive, syncStatus',
      categories: '++id, name, sortOrder',
      customers: '++id, name, phone, syncStatus',
      sales: '++id, localId, customerId, userId, status, createdAt, syncStatus',
      creditTransactions: '++id, customerId, saleId, type, createdAt, syncStatus',
      users: '++id, phone, role, isActive',
      settings: '++id'
    })

    this.version(2).stores({
      products: '++id, localId, name, categoryId, barcode, isActive, syncStatus',
      categories: '++id, name, sortOrder',
      customers: '++id, localId, name, phone, syncStatus',
      sales: '++id, localId, customerId, userId, status, createdAt, syncStatus',
      creditTransactions: '++id, customerId, saleId, type, createdAt, syncStatus',
      users: '++id, phone, role, isActive',
      settings: '++id'
    })
  }
}

export const db = new TiKesDatabase()

// Helper to generate unique local IDs
export function generateLocalId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return timestamp + '-' + random
}

// Initialize default settings if not exists
export async function initializeDatabase() {
  const settingsCount = await db.settings.count()
  if (settingsCount === 0) {
    await db.settings.add({
      language: 'ht',
      currency: 'HTG',
      businessName: 'Ti Biznis Mwen',
      taxRate: 0,
      receiptFooter: 'Mèsi pou acha ou!'
    })
  }

  // Add default categories if none exist
  const categoryCount = await db.categories.count()
  if (categoryCount === 0) {
    await db.categories.bulkAdd([
      { name: 'Manje', icon: 'utensils', sortOrder: 1, createdAt: new Date() },
      { name: 'Bwason', icon: 'cup-soda', sortOrder: 2, createdAt: new Date() },
      { name: 'Pwodui Netwayaj', icon: 'spray-can', sortOrder: 3, createdAt: new Date() },
      { name: 'Lòt', icon: 'box', sortOrder: 4, createdAt: new Date() }
    ])
  }
}

export default db
