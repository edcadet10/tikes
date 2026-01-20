import { useState } from 'react'
import { Globe, Download, Users, LogOut, Plus, Cloud, RefreshCw } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { useStore } from '../stores/useStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { EmployeeModal } from '../components/EmployeeModal'
import { fullSync, getLastSyncTime } from '../services/sync'
import { getAuthToken } from '../services/api'
import type { User } from '../types'

export function Settings() {
  const { t, language } = useTranslation()
  const { currentUser, logout, setLanguage } = useStore()
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  const employees = useLiveQuery(() => db.users.filter(u => u.isActive).toArray(), [])
  const isConnected = !!getAuthToken()
  const lastSync = getLastSyncTime()

  const langClass = (lang: string) => {
    const base = 'w-full text-left px-4 py-3'
    return language === lang ? base + ' bg-black text-white' : base
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage('')
    try {
      const result = await fullSync()
      if (result.push.success && result.pull.success) {
        setSyncMessage('Senkronize!')
      } else {
        setSyncMessage('Erè: ' + (result.push.error || result.pull.error))
      }
    } catch (error) {
      setSyncMessage('Erè senkronizasyon')
    }
    setSyncing(false)
    setTimeout(() => setSyncMessage(''), 3000)
  }

  const handleExport = async () => {
    const data = {
      products: await db.products.toArray(),
      customers: await db.customers.toArray(),
      sales: await db.sales.toArray(),
      categories: await db.categories.toArray(),
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tikes-backup-' + new Date().toISOString().split('T')[0] + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const openEmployeeModal = (emp: User | null) => {
    setEditingEmployee(emp)
    setShowEmployeeModal(true)
  }

  const formatLastSync = () => {
    if (!lastSync) return 'Jamè'
    const date = new Date(lastSync)
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-screen pb-16">
      <div className="p-4 bg-white border-b border-black sticky top-0 z-10">
        <h1 className="text-xl font-bold">{t('settings')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentUser && (
          <div className="border border-black p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-sm opacity-50">{currentUser.role === 'owner' ? 'Pwopriyete' : currentUser.role === 'manager' ? 'Jeran' : 'Kesye'}</p>
            </div>
            <button onClick={logout} className="p-2"><LogOut className="w-5 h-5" strokeWidth={1.5} /></button>
          </div>
        )}

        <div className="border border-black">
          <div className="p-4 border-b border-black flex items-center gap-3">
            <Cloud className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-medium">Senkronizasyon</span>
          </div>
          <div className="p-4">
            <p className="text-sm opacity-50 mb-2">Dènye senkronizasyon: {formatLastSync()}</p>
            {isConnected ? (
              <button 
                onClick={handleSync} 
                disabled={syncing}
                className="w-full border border-black p-3 flex items-center justify-center gap-2 active:bg-black active:text-white disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                <span>{syncing ? 'Senkronize...' : 'Senkronize Kounye a'}</span>
              </button>
            ) : (
              <p className="text-sm opacity-50">Pa konekte ak sèvè</p>
            )}
            {syncMessage && <p className="text-sm mt-2 text-center">{syncMessage}</p>}
          </div>
        </div>

        <div className="border border-black">
          <div className="p-4 border-b border-black flex items-center gap-3">
            <Globe className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-medium">{t('language')}</span>
          </div>
          <button onClick={() => setLanguage('ht')} className={langClass('ht')}>Kreyol Ayisyen</button>
          <button onClick={() => setLanguage('fr')} className={langClass('fr')}>Francais</button>
        </div>

        <div className="border border-black">
          <div className="p-4 border-b border-black flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-medium">Anplwaye</span>
            </div>
            <button onClick={() => openEmployeeModal(null)} className="p-1"><Plus className="w-5 h-5" /></button>
          </div>
          {employees?.map((emp) => (
            <button key={emp.id} onClick={() => openEmployeeModal(emp)}
              className="w-full p-4 border-b border-black last:border-b-0 text-left active:bg-black active:text-white">
              <p className="font-medium">{emp.name}</p>
              <p className="text-sm opacity-50">{emp.role === 'owner' ? 'Pwopriyete' : emp.role === 'manager' ? 'Jeran' : 'Kesye'}</p>
            </button>
          ))}
          {(!employees || employees.length === 0) && (
            <p className="p-4 text-center opacity-50">Pa gen anplwaye</p>
          )}
        </div>

        <button onClick={handleExport} className="w-full border border-black p-4 flex items-center justify-center gap-3 active:bg-black active:text-white">
          <Download className="w-5 h-5" strokeWidth={1.5} />
          <span>Ekspote Done (JSON)</span>
        </button>

        <div className="border border-black p-4 text-center">
          <p className="font-medium">TiKes</p>
          <p className="text-sm opacity-50">Sistem kes pou ti biznis</p>
          <p className="text-xs opacity-30 mt-2">v1.0.0</p>
        </div>
      </div>

      {showEmployeeModal && (
        <EmployeeModal employee={editingEmployee} onClose={() => setShowEmployeeModal(false)} />
      )}
    </div>
  )
}
