import { useState } from 'react'
import { X } from 'lucide-react'
import { db } from '../db'
import type { User } from '../types'

interface EmployeeModalProps {
  employee: User | null
  onClose: () => void
}

export function EmployeeModal({ employee, onClose }: EmployeeModalProps) {
  const [name, setName] = useState(employee?.name || '')
  const [phone, setPhone] = useState(employee?.phone || '')
  const [pin, setPin] = useState(employee?.pin || '')
  const [role, setRole] = useState<'owner' | 'manager' | 'cashier'>(employee?.role || 'cashier')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || pin.length !== 4) return
    setSaving(true)
    const data = {
      name, phone, pin, role, isActive: true,
      createdAt: employee?.createdAt || new Date()
    }
    if (employee?.id) {
      await db.users.update(employee.id, data)
    } else {
      await db.users.add(data)
    }
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (employee?.id && confirm('Efase anplwaye sa a?')) {
      await db.users.update(employee.id, { isActive: false })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-black">
          <h2 className="text-lg font-bold">{employee ? 'Modifye Anplwaye' : 'Nouvo Anplwaye'}</h2>
          <button onClick={onClose} className="p-2"><X className="w-6 h-6" strokeWidth={1.5} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Non *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-black p-3 focus:outline-none focus:border-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-black p-3 focus:outline-none focus:border-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PIN (4 chif) *</label>
            <input type="text" value={pin} onChange={(e) => setPin(e.target.value.replace(/D/g, '').slice(0, 4))}
              placeholder="0000" maxLength={4}
              className="w-full border border-black p-3 focus:outline-none focus:border-2 text-center text-2xl tracking-widest" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Wol</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)}
              className="w-full border border-black p-3 focus:outline-none focus:border-2 bg-white">
              <option value="cashier">Kesye</option>
              <option value="manager">Jeran</option>
              <option value="owner">Pwopriyete</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-black space-y-2">
          <button onClick={handleSave} disabled={!name || pin.length !== 4 || saving}
            className="w-full bg-black text-white p-4 font-medium disabled:opacity-50">{saving ? '...' : 'Anrejistre'}</button>
          {employee && employee.role !== 'owner' && (
            <button onClick={handleDelete} className="w-full border border-black p-4 font-medium">Efase</button>
          )}
        </div>
      </div>
    </div>
  )
}
