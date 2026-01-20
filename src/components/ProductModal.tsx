import { useState } from 'react'
import { X, Camera } from 'lucide-react'
import { db } from '../db'
import type { Product } from '../types'
import { BarcodeScanner } from './BarcodeScanner'

interface ProductModalProps {
  product: Product | null
  categories: { id?: number; name: string }[]
  onClose: () => void
  initialBarcode?: string
}

export function ProductModal({ product, categories, onClose, initialBarcode }: ProductModalProps) {
  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState(product?.price?.toString() || '')
  const [stock, setStock] = useState(product?.stockQuantity?.toString() || '0')
  const [barcode, setBarcode] = useState(product?.barcode || initialBarcode || '')
  const [categoryId, setCategoryId] = useState(product?.categoryId?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const handleSave = async () => {
    if (!name || !price) return
    setSaving(true)
    const productData = {
      name, price: parseFloat(price), stockQuantity: parseInt(stock) || 0,
      barcode: barcode || undefined, categoryId: categoryId ? parseInt(categoryId) : undefined,
      lowStockThreshold: 5, unitType: 'each' as const, isActive: true,
      createdAt: product?.createdAt || new Date(), updatedAt: new Date(), syncStatus: 'pending' as const
    }
    if (product?.id) { await db.products.update(product.id, productData) }
    else { await db.products.add(productData) }
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (product?.id && confirm('Efase pwodui sa a?')) {
      await db.products.update(product.id, { isActive: false })
      onClose()
    }
  }

  if (showScanner) {
    return <BarcodeScanner onScan={(code) => { setBarcode(code); setShowScanner(false) }} onClose={() => setShowScanner(false)} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-black">
          <h2 className="text-lg font-bold">{product ? 'Modifye Pwodui' : 'Nouvo Pwodui'}</h2>
          <button onClick={onClose} className="p-2"><X className="w-6 h-6" strokeWidth={1.5} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kod Ba</label>
            <div className="flex gap-2">
              <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)}
                placeholder="Eskane oswa tape" className="flex-1 border border-black p-3 focus:outline-none focus:border-2" />
              <button onClick={() => setShowScanner(true)} className="border-2 border-black p-3 active:bg-black active:text-white">
                <Camera className="w-6 h-6" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Non Pwodui *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Egz: Diri, Pwa, Sik..." className="w-full border border-black p-3 focus:outline-none focus:border-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pri (HTG) *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00" className="w-full border border-black p-3 focus:outline-none focus:border-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)}
              placeholder="0" className="w-full border border-black p-3 focus:outline-none focus:border-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-black p-3 focus:outline-none focus:border-2 bg-white">
              <option value="">-- Chwazi --</option>
              {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-black space-y-2">
          <button onClick={handleSave} disabled={!name || !price || saving}
            className="w-full bg-black text-white p-4 font-medium disabled:opacity-50">{saving ? '...' : 'Anrejistre'}</button>
          {product && (<button onClick={handleDelete} className="w-full border border-black p-4 font-medium">Efase</button>)}
        </div>
      </div>
    </div>
  )
}
