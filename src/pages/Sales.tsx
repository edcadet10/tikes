import { useState } from 'react'
import { Search, Plus, Minus, Trash2, Camera } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { useStore, useCartTotals } from '../stores/useStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { CheckoutModal } from '../components/CheckoutModal'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { ProductModal } from '../components/ProductModal'

export function Sales() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [newBarcode, setNewBarcode] = useState<string | null>(null)
  
  const { subtotal, itemCount, cart } = useCartTotals()
  const { addToCart, removeFromCart, updateCartItemQuantity, clearCart } = useStore()

  const products = useLiveQuery(() => db.products.filter(p => p.isActive && p.stockQuantity > 0).toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery)
  )

  const formatPrice = (n: number) => 'G ' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false)
    const product = await db.products.where('barcode').equals(barcode).first()
    if (product && product.isActive && product.stockQuantity > 0) {
      addToCart(product)
    } else if (product) {
      alert('Pwodui pa disponib')
    } else {
      setNewBarcode(barcode)
    }
  }

  if (showScanner) {
    return <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
  }

  return (
    <div className="flex flex-col h-screen pb-16">
      <div className="p-4 bg-white border-b border-black sticky top-0 z-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" strokeWidth={1.5} />
            <input type="text" placeholder={t('search') + '...'} value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-black focus:outline-none focus:border-2" />
          </div>
          <button onClick={() => setShowScanner(true)} className="border-2 border-black p-3 active:bg-black active:text-white">
            <Camera className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered && filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((product) => (
              <button key={product.id} onClick={() => addToCart(product)}
                className="border border-black p-3 text-left active:bg-black active:text-white">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-lg font-bold mt-1">{formatPrice(product.price)}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 opacity-50">
            <p>{t('noItems')}</p>
            <p className="text-sm mt-1">Ajoute pwodui nan Envante</p>
          </div>
        )}
      </div>

      {itemCount > 0 && (
        <div className="bg-white border-t-2 border-black p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm">{itemCount} atik</span>
              <p className="text-2xl font-bold">{formatPrice(subtotal)}</p>
            </div>
            <button onClick={() => setShowCheckout(true)} className="bg-black text-white px-6 py-3 font-medium">{t('checkout')}</button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{item.productName}</span>
                <button onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                  className="w-6 h-6 border border-black flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                  className="w-6 h-6 border border-black flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                <button onClick={() => removeFromCart(item.productId)} className="w-6 h-6"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal total={subtotal} cart={cart} onClose={() => setShowCheckout(false)}
          onComplete={() => { clearCart(); setShowCheckout(false) }} />
      )}

      {newBarcode && (
        <ProductModal product={null} categories={categories || []} initialBarcode={newBarcode}
          onClose={() => setNewBarcode(null)} />
      )}
    </div>
  )
}
