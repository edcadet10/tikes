import { useState } from 'react'
import { Search, Plus, Users, Phone } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { CustomerModal } from '../components/CustomerModal'
import { CustomerDetail } from '../components/CustomerDetail'
import type { Customer } from '../types'

export function Customers() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const customers = useLiveQuery(() => db.customers.toArray(), [])

  const formatPrice = (n: number) => 'G ' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })

  const filtered = customers?.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  )

  const totalCredit = customers?.reduce((sum, c) => sum + c.creditBalance, 0) || 0

  return (
    <div className="flex flex-col h-screen pb-16">
      <div className="p-4 bg-white border-b border-black sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{t('customers')}</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="border-2 border-black px-4 py-2 flex items-center gap-2 active:bg-black active:text-white"
          >
            <Plus className="w-5 h-5" strokeWidth={1.5} />
            <span>{t('add')}</span>
          </button>
        </div>

        {totalCredit > 0 && (
          <div className="border border-black p-3 mb-4 flex justify-between items-center">
            <span className="text-sm">Total Kredi</span>
            <span className="font-bold">{formatPrice(totalCredit)}</span>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" strokeWidth={1.5} />
          <input
            type="text"
            placeholder={t('search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-black focus:outline-none focus:border-2"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered && filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((customer) => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="w-full border border-black p-4 text-left active:bg-black active:text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-current flex items-center justify-center flex-shrink-0">
                    <span className="font-bold">{customer.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-sm opacity-50 flex items-center gap-1">
                        <Phone className="w-3 h-3" strokeWidth={1.5} />
                        {customer.phone}
                      </p>
                    )}
                  </div>
                  {customer.creditBalance > 0 && (
                    <div className="text-right">
                      <p className="text-xs opacity-50">{t('credit')}</p>
                      <p className="font-bold">{formatPrice(customer.creditBalance)}</p>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 opacity-50">
            <Users className="w-16 h-16 mx-auto mb-4" strokeWidth={1} />
            <p>Pa gen kliyan anko</p>
            <p className="text-sm mt-1">Klike + pou ajoute</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <CustomerModal
          customer={null}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  )
}
