import { useState } from 'react'
import { X } from 'lucide-react'
import { db } from '../db'
import type { Customer } from '../types'

interface CreditModalProps {
  customer: Customer
  type: 'credit_given' | 'payment_received'
  onClose: () => void
}

export function CreditModal({ customer, type, onClose }: CreditModalProps) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const formatPrice = (n: number) => 'G ' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })

  const handleSave = async () => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) return
    setSaving(true)

    const newBalance = type === 'credit_given'
      ? customer.creditBalance + amountNum
      : customer.creditBalance - amountNum

    await db.creditTransactions.add({
      customerId: customer.id!,
      amount: amountNum,
      type,
      balanceAfter: Math.max(0, newBalance),
      notes: notes.trim() || undefined,
      createdAt: new Date(),
      syncStatus: 'pending'
    })

    await db.customers.update(customer.id!, {
      creditBalance: Math.max(0, newBalance),
      updatedAt: new Date()
    })

    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full">
        <div className="flex items-center justify-between p-4 border-b border-black">
          <h2 className="text-lg font-bold">
            {type === 'credit_given' ? 'Bay Kredi' : 'Resevwa Peyman'}
          </h2>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center py-2">
            <p className="text-sm opacity-50">{customer.name}</p>
            <p className="text-sm">Balans aktyel: <span className="font-bold">{formatPrice(customer.creditBalance)}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Montan (HTG)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border-2 border-black p-4 text-2xl text-center focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Not (opsyonel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Rezon..."
              className="w-full border border-black p-3 focus:outline-none focus:border-2"
            />
          </div>
        </div>

        <div className="p-4 border-t border-black">
          <button
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0 || saving}
            className="w-full bg-black text-white p-4 font-medium disabled:opacity-50"
          >
            {saving ? '...' : 'Konfime'}
          </button>
        </div>
      </div>
    </div>
  )
}
