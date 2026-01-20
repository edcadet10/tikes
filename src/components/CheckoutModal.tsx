import { useState } from 'react'
import { X, User, CreditCard } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, generateLocalId } from '../db'
import { useStore } from '../stores/useStore'
import type { Customer } from '../types'

interface CheckoutModalProps {
  total: number
  cart: any[]
  onClose: () => void
  onComplete: () => void
}

export function CheckoutModal({ total, cart, onClose, onComplete }: CheckoutModalProps) {
  const { currentUser } = useStore()
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomers, setShowCustomers] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)

  const customers = useLiveQuery(() => db.customers.toArray(), [])
  const formatPrice = (n: number) => 'G ' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })
  const change = cashReceived ? parseFloat(cashReceived) - total : 0

  const handleCompleteSale = async () => {
    setProcessing(true)
    await db.sales.add({
      localId: generateLocalId(),
      customerId: selectedCustomer?.id,
      userId: currentUser?.id,
      items: cart.map(item => ({
        productId: item.productId, productName: item.productName,
        quantity: item.quantity, unitPrice: item.unitPrice, discount: 0, subtotal: item.subtotal
      })),
      subtotal: total, discount: 0, discountType: 'fixed', tax: 0, total: total,
      payments: [{ method: 'cash', amount: paymentType === 'cash' ? total : 0, status: 'completed' }],
      status: 'completed', createdAt: new Date(), syncStatus: 'pending'
    })
    for (const item of cart) {
      const product = await db.products.get(item.productId)
      if (product) await db.products.update(item.productId, { stockQuantity: product.stockQuantity - item.quantity })
    }
    if (paymentType === 'credit' && selectedCustomer) {
      const newBal = selectedCustomer.creditBalance + total
      await db.customers.update(selectedCustomer.id!, { creditBalance: newBal, updatedAt: new Date() })
      await db.creditTransactions.add({
        customerId: selectedCustomer.id!, amount: total, type: 'credit_given',
        balanceAfter: newBal, notes: 'Lavant sou kredi', createdAt: new Date(), syncStatus: 'pending'
      })
    }
    setProcessing(false)
    setCompleted(true)
  }

  if (completed) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm p-8 text-center">
          <p className="text-4xl mb-4">OK</p>
          <p className="text-xl font-bold mb-2">Lavant Fini!</p>
          {paymentType === 'cash' && change > 0 && <p>Monnen: {formatPrice(change)}</p>}
          {paymentType === 'credit' && <p className="text-sm opacity-50">Kredi bay {selectedCustomer?.name}</p>}
          {currentUser && <p className="text-xs opacity-30 mt-2">Pa {currentUser.name}</p>}
          <button onClick={onComplete} className="mt-6 w-full bg-black text-white p-4 font-medium">Fini</button>
        </div>
      </div>
    )
  }

  if (showCustomers) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
        <div className="bg-white w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-black">
            <h2 className="font-bold">Chwazi Kliyan</h2>
            <button onClick={() => setShowCustomers(false)} className="p-2"><X className="w-6 h-6" /></button>
          </div>
          <div className="p-4 space-y-2">
            {customers?.map((c) => (
              <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomers(false) }}
                className="w-full border border-black p-4 text-left active:bg-black active:text-white">
                <p className="font-medium">{c.name}</p>
              </button>
            ))}
            {(!customers || !customers.length) && <p className="text-center opacity-50 py-4">Pa gen kliyan</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full">
        <div className="flex items-center justify-between p-4 border-b border-black">
          <h2 className="text-lg font-bold">Peyman</h2>
          <button onClick={onClose} className="p-2"><X className="w-6 h-6" strokeWidth={1.5} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="text-center py-4">
            <p className="text-sm opacity-50">Total</p>
            <p className="text-4xl font-bold">{formatPrice(total)}</p>
          </div>
          <button onClick={() => setShowCustomers(true)} className="w-full border border-black p-3 flex items-center gap-3">
            <User className="w-5 h-5" strokeWidth={1.5} />
            <span>{selectedCustomer ? selectedCustomer.name : 'Chwazi kliyan (opsyonel)'}</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPaymentType('cash')}
              className={paymentType === 'cash' ? 'border-2 border-black p-4 bg-black text-white' : 'border border-black p-4'}>
              Kach
            </button>
            <button onClick={() => setPaymentType('credit')} disabled={!selectedCustomer}
              className={paymentType === 'credit' ? 'border-2 border-black p-4 bg-black text-white' : 'border border-black p-4 disabled:opacity-30'}>
              <CreditCard className="w-4 h-4 inline mr-1" /> Kredi
            </button>
          </div>
          {paymentType === 'cash' && (
            <>
              <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)}
                placeholder="Lajan resevwa" className="w-full border-2 border-black p-4 text-2xl text-center" autoFocus />
              {change > 0 && <p className="text-center text-xl">Monnen: <b>{formatPrice(change)}</b></p>}
            </>
          )}
          {paymentType === 'credit' && selectedCustomer && (
            <div className="border border-black p-4 text-center">
              <p className="text-sm opacity-50">Nouvo balans {selectedCustomer.name}</p>
              <p className="font-bold">{formatPrice(selectedCustomer.creditBalance + total)}</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-black">
          <button onClick={handleCompleteSale}
            disabled={processing || (paymentType === 'cash' && parseFloat(cashReceived || '0') < total) || (paymentType === 'credit' && !selectedCustomer)}
            className="w-full bg-black text-white p-4 font-medium disabled:opacity-50">
            {processing ? '...' : 'Fini Lavant'}
          </button>
        </div>
      </div>
    </div>
  )
}
