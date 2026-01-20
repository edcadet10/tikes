import { db } from '../db'
import { pushSync, pullSync, getAuthToken } from './api'

const LAST_SYNC_KEY = 'tikes_last_sync'

export async function syncToServer() {
  if (!getAuthToken()) return { success: false, error: 'Not authenticated' }
  
  try {
    // Get all pending items
    const [products, customers, sales, categories, creditTransactions] = await Promise.all([
      db.products.filter(p => p.syncStatus === 'pending').toArray(),
      db.customers.filter(c => c.syncStatus === 'pending').toArray(),
      db.sales.filter(s => s.syncStatus === 'pending').toArray(),
      db.categories.toArray(),
      db.creditTransactions.filter(t => t.syncStatus === 'pending').toArray()
    ])

    if (!products.length && !customers.length && !sales.length && !creditTransactions.length) {
      return { success: true, message: 'Nothing to sync' }
    }

    const result = await pushSync({ products, customers, sales, categories, creditTransactions })

    // Mark items as synced
    await Promise.all([
      ...products.map(p => db.products.update(p.id!, { syncStatus: 'synced' })),
      ...customers.map(c => db.customers.update(c.id!, { syncStatus: 'synced' })),
      ...sales.map(s => db.sales.update(s.id!, { syncStatus: 'synced' })),
      ...creditTransactions.map(t => db.creditTransactions.update(t.id!, { syncStatus: 'synced' }))
    ])

    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
    return { success: true, synced: result.synced }
  } catch (error) {
    console.error('Sync to server failed:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function syncFromServer() {
  if (!getAuthToken()) return { success: false, error: 'Not authenticated' }
  
  try {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY)
    const data = await pullSync(lastSync || undefined)

    // Update local database with server data
    if (data.products?.length) {
      for (const prod of data.products) {
        const existing = await db.products.where('localId').equals(prod.localId || '').first()
        if (existing) {
          await db.products.update(existing.id!, { ...prod, syncStatus: 'synced' })
        } else {
          await db.products.add({ ...prod, syncStatus: 'synced' })
        }
      }
    }

    if (data.customers?.length) {
      for (const cust of data.customers) {
        const existing = await db.customers.where('localId').equals(cust.localId || '').first()
        if (existing) {
          await db.customers.update(existing.id!, { ...cust, syncStatus: 'synced' })
        } else {
          await db.customers.add({ ...cust, syncStatus: 'synced' })
        }
      }
    }

    localStorage.setItem(LAST_SYNC_KEY, data.syncedAt)
    return { success: true, received: data }
  } catch (error) {
    console.error('Sync from server failed:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function fullSync() {
  const pushResult = await syncToServer()
  const pullResult = await syncFromServer()
  return { push: pushResult, pull: pullResult }
}

export function getLastSyncTime() {
  return localStorage.getItem(LAST_SYNC_KEY)
}
