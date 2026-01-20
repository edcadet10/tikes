import { ShoppingCart, Package, Users, Clock, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export function Home() {
  const { t } = useTranslation()
  
  const todaySales = useLiveQuery(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sales = await db.sales.filter(s => new Date(s.createdAt) >= today).toArray()
    return sales.reduce((sum, sale) => sum + sale.total, 0)
  }, [])

  const todayCount = useLiveQuery(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sales = await db.sales.filter(s => new Date(s.createdAt) >= today).toArray()
    return sales.length
  }, [])

  const totalCredit = useLiveQuery(async () => {
    const customers = await db.customers.toArray()
    return customers.reduce((sum, c) => sum + c.creditBalance, 0)
  }, [])

  const lowStockProducts = useLiveQuery(async () => {
    const products = await db.products.filter(p => p.isActive).toArray()
    return products.filter(p => p.stockQuantity <= p.lowStockThreshold)
  }, [])

  const formatPrice = (n: number) => 'G ' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })

  return (
    <div className="p-4 pb-20">
      <Link to="/history" className="block border-2 border-black p-6 mb-6">
        <p className="text-sm opacity-50 uppercase tracking-wide">{t('todaySales')}</p>
        <p className="text-4xl font-bold mt-1">{formatPrice(todaySales || 0)}</p>
        <p className="text-sm opacity-50 mt-1">{todayCount || 0} lavant</p>
      </Link>

      {(lowStockProducts?.length || 0) > 0 && (
        <Link to="/inventory" className="block border-2 border-black p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" strokeWidth={2} />
            <span className="font-bold">{t('lowStock')}</span>
          </div>
          <div className="space-y-1">
            {lowStockProducts?.slice(0, 3).map(p => (
              <p key={p.id} className="text-sm">
                {p.name} - <span className="font-bold">{p.stockQuantity} rete</span>
              </p>
            ))}
            {(lowStockProducts?.length || 0) > 3 && (
              <p className="text-sm opacity-50">+ {(lowStockProducts?.length || 0) - 3} lot pwodui</p>
            )}
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/sales"
          className="flex flex-col items-center justify-center border-2 border-black p-4 h-24 active:bg-black active:text-white">
          <ShoppingCart className="w-8 h-8 mb-2" strokeWidth={1.5} />
          <span className="font-medium text-sm">{t('newSale')}</span>
        </Link>
        <Link to="/inventory"
          className="flex flex-col items-center justify-center border-2 border-black p-4 h-24 active:bg-black active:text-white">
          <Package className="w-8 h-8 mb-2" strokeWidth={1.5} />
          <span className="font-medium text-sm">{t('addProduct')}</span>
        </Link>
        <Link to="/history"
          className="flex flex-col items-center justify-center border border-black p-4 h-20 active:bg-black active:text-white">
          <Clock className="w-6 h-6 mb-1" strokeWidth={1.5} />
          <span className="text-sm">Istwa</span>
        </Link>
        <Link to="/customers"
          className="flex flex-col items-center justify-center border border-black p-4 h-20 active:bg-black active:text-white">
          <Users className="w-6 h-6 mb-1" strokeWidth={1.5} />
          <span className="text-sm">Kliyan</span>
        </Link>
      </div>

      {(totalCredit || 0) > 0 && (
        <Link to="/customers" className="flex items-center justify-between border border-black p-4">
          <span>{t('creditBalance')}</span>
          <span className="font-bold">{formatPrice(totalCredit || 0)}</span>
        </Link>
      )}
    </div>
  )
}
