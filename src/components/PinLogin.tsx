import { useState } from 'react'
import { Delete } from 'lucide-react'
import type { User } from '../types'

interface PinLoginProps {
  users: User[]
  onLogin: (user: User) => void
  onSkip?: () => void
}

export function PinLogin({ users, onLogin, onSkip }: PinLoginProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      setError(false)
      if (newPin.length === 4 && selectedUser) {
        if (selectedUser.pin === newPin) {
          onLogin(selectedUser)
        } else {
          setError(true)
          setTimeout(() => { setPin(''); setError(false) }, 500)
        }
      }
    }
  }

  const handleDelete = () => { setPin(pin.slice(0, -1)); setError(false) }

  const dotClass = (i: number) => {
    let c = 'w-4 h-4 rounded-full border-2 border-black'
    if (pin.length > i) c += ' bg-black'
    if (error) c += ' border-red-500 bg-red-500'
    return c
  }

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-6 border-b border-black">
          <h1 className="text-2xl font-bold text-center">TiKes</h1>
          <p className="text-center opacity-50 mt-1">Chwazi kont ou</p>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {users.filter(u => u.isActive).map((user) => (
              <button key={user.id} onClick={() => setSelectedUser(user)}
                className="w-full border-2 border-black p-4 text-left active:bg-black active:text-white">
                <p className="font-bold">{user.name}</p>
                <p className="text-sm opacity-50">{user.role === 'owner' ? 'Pwopriyete' : user.role === 'manager' ? 'Jeran' : 'Kesye'}</p>
              </button>
            ))}
          </div>
          {onSkip && (<button onClick={onSkip} className="w-full mt-4 p-4 opacity-50">Kontinye san koneksyon</button>)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-6 border-b border-black">
        <button onClick={() => { setSelectedUser(null); setPin('') }} className="text-sm opacity-50 mb-2">&larr; Retounen</button>
        <h1 className="text-xl font-bold">{selectedUser.name}</h1>
        <p className="opacity-50">Tape PIN 4 chif ou</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="flex gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (<div key={i} className={dotClass(i)} />))}
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((key) => (
            <button key={key || 'empty'} onClick={() => key === 'del' ? handleDelete() : key && handleDigit(key)}
              disabled={!key} className={key ? 'h-16 text-2xl font-bold border border-black flex items-center justify-center active:bg-black active:text-white' : 'h-16'}>
              {key === 'del' ? <Delete className="w-6 h-6" /> : key}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
