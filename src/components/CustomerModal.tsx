import { useState } from 'react'
import { X } from 'lucide-react'
import { db } from '../db'
import type { Customer } from '../types'

interface CustomerModalProps {
  customer: Customer | null
  onClose: () => void
  onSaved?: (customer: Customer) => void
}

export function CustomerModal({ customer, onClose, onSaved }: CustomerModalProps) {
  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [notes, setNotes] = useState(customer?.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)

    const customerData = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      totalPurchases: customer?.totalPurchases || 0,
      creditBalance: customer?.creditBalance || 0,
      createdAt: customer?.createdAt || new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending' as const
    }

    let savedCustomer: Customer
    if (customer?.id) {
      await db.customers.update(customer.id, customerData)
      savedCustomer = { ...customerData, id: customer.id }
    } else {
      const id = await db.customers.add(customerData)
      savedCustomer = { ...customerData, id }
    }

    setSaving(false)
    if (onSaved) onSaved(savedCustomer)
    onClose()
  }

  const handleDelete = async () => {
    if (customer?.id && confirm('Efase kliyan sa a?')) {
      await db.customers.delete(customer.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-black">
          <h2 className="text-lg font-bold">
            {customer ? 'Modifye Kliyan' : 'Nouvo Kliyan'}
          </h2>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Non *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Non kliyan an"
              className="w-full border border-black p-3 focus:outline-none focus:border-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="509 0000 0000"
              className="w-full border border-black p-3 focus:outline-none focus:border-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Not</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Not sou kliyan an..."
              rows={3}
              className="w-full border border-black p-3 focus:outline-none focus:border-2 resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-black space-y-2">
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full bg-black text-white p-4 font-medium disabled:opacity-50"
          >
            {saving ? '...' : 'Anrejistre'}
          </button>
          {customer && (
            <button
              onClick={handleDelete}
              className="w-full border border-black p-4 font-medium"
            >
              Efase
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
