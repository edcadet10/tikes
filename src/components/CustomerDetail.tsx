import { useState } from 'react'
import { X, Phone, Plus, Minus, Edit2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Customer } from '../types'
import { CreditModal } from './CreditModal'
import { CustomerModal } from './CustomerModal'

interface CustomerDetailProps {
  customer: Customer
  onClose: () => void
}

export function CustomerDetail({ customer: initialCustomer, onClose }: CustomerDetailProps) {
  const [showCreditModal, setShowCreditModal] = useState<'credit_given' | 'payment_received' | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const customer = useLiveQuery(
    () => db.customers.get(initialCustomer.id!),
    [initialCustomer.id]
  ) || initialCustomer

  const transactions = useLiveQuery(
    () => db.creditTransactions
      .where('customerId')
      .equals(initialCustomer.id!)
      .reverse()
      .sortBy('createdAt'),
    [initialCustomer.id]
  )

  const formatPrice = (n: number) => 'G ' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })
  const formatDate = (d: Date) => new Date(d).toLocaleDateString('fr-HT', { day: '2-digit', month: 'short' })

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-black">
        <h2 className="text-lg font-bold">{customer.name}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEditModal(true)} className="p-2">
            <Edit2 className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-black">
          {customer.phone && (
            <p className="flex items-center gap-2 text-sm opacity-60 mb-2">
              <Phone className="w-4 h-4" strokeWidth={1.5} />
              {customer.phone}
            </p>
          )}
          <div className="text-center py-4">
            <p className="text-sm opacity-50">Balans Kredi</p>
            <p className="text-4xl font-bold">{formatPrice(customer.creditBalance)}</p>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowCreditModal('credit_given')}
            className="border border-black p-4 flex items-center justify-center gap-2 active:bg-black active:text-white"
          >
            <Plus className="w-5 h-5" strokeWidth={1.5} />
            <span>Bay Kredi</span>
          </button>
          <button
            onClick={() => setShowCreditModal('payment_received')}
            className="border border-black p-4 flex items-center justify-center gap-2 active:bg-black active:text-white"
          >
            <Minus className="w-5 h-5" strokeWidth={1.5} />
            <span>Peyman</span>
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-bold mb-3">Istwa</h3>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="border border-black p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {tx.type === 'credit_given' ? 'Kredi bay' : 'Peyman resevwa'}
                    </p>
                    <p className="text-xs opacity-50">{formatDate(tx.createdAt)}</p>
                    {tx.notes && <p className="text-xs opacity-50 mt-1">{tx.notes}</p>}
                  </div>
                  <p className={tx.type === 'credit_given' ? 'font-bold' : 'font-bold'}>
                    {tx.type === 'credit_given' ? '+' : '-'}{formatPrice(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center opacity-50 py-4">Pa gen istwa</p>
          )}
        </div>
      </div>

      {showCreditModal && (
        <CreditModal
          customer={customer}
          type={showCreditModal}
          onClose={() => setShowCreditModal(null)}
        />
      )}

      {showEditModal && (
        <CustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}
