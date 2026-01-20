import { useState } from 'react'
import { Search, Plus, Package, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { ProductModal } from '../components/ProductModal'
import type { Product } from '../types'

export function Inventory() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  const products = useLiveQuery(
    () => db.products.filter(p => p.isActive).toArray(),
    []
  )

  const categories = useLiveQuery(() => db.categories.toArray(), [])

  const lowStockCount = products?.filter(p => p.stockQuantity <= p.lowStockThreshold).length || 0

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const isLowStock = p.stockQuantity <= p.lowStockThreshold
    return matchesSearch && (showLowStockOnly ? isLowStock : true)
  })

  const formatPrice = (price: number) => {
    return 'G ' + price.toLocaleString('en-US', { minimumFractionDigits: 2 })
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const isLowStock = (product: Product) => product.stockQuantity <= product.lowStockThreshold

  return (
    <div className="flex flex-col h-screen pb-16">
      <div className="p-4 bg-white border-b border-black sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{t('products')}</h1>
          <button
            onClick={openAddModal}
            className="border-2 border-black px-4 py-2 flex items-center gap-2 active:bg-black active:text-white"
          >
            <Plus className="w-5 h-5" strokeWidth={1.5} />
            <span>{t('add')}</span>
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder={t('search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-black focus:outline-none focus:border-2"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {lowStockCount > 0 && (
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`w-full p-3 flex items-center justify-between border-b border-black ${showLowStockOnly ? 'bg-black text-white' : ''}`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-medium">{t('lowStock')}</span>
            </div>
            <span className="font-bold">{lowStockCount} pwodui</span>
          </button>
        )}

        <div className="p-4">
          {filteredProducts && filteredProducts.length > 0 ? (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => openEditModal(product)}
                  className={`w-full border p-4 flex items-center gap-4 text-left active:bg-black active:text-white ${isLowStock(product) ? 'border-2 border-black' : 'border-black'}`}
                >
                  <div className="w-12 h-12 border border-current flex items-center justify-center relative">
                    <Package className="w-6 h-6" strokeWidth={1.5} />
                    {isLowStock(product) && (
                      <AlertTriangle className="w-4 h-4 absolute -top-1 -right-1 bg-white" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className={`text-sm ${isLowStock(product) ? 'font-bold' : 'opacity-60'}`}>
                      Stock: {product.stockQuantity}
                      {isLowStock(product) && ' (Ba)'}
                    </p>
                  </div>
                  <p className="font-bold">{formatPrice(product.price)}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" strokeWidth={1} />
              <p>Pa gen pwodui anko</p>
              <p className="text-sm opacity-50 mt-1">Klike + pou ajoute</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories || []}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
