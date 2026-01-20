import { useState } from 'react'
import { ChevronLeft, ChevronRight, Share2, Receipt } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Sale } from '../types'

export function History() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const startOfDay = new Date(selectedDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(selectedDate)
  endOfDay.setHours(23, 59, 59, 999)

  const sales = useLiveQuery(
    () => db.sales
      .filter(s => {
        const d = new Date(s.createdAt)
        return d >= startOfDay && d <= endOfDay
      })
      .reverse()
      .sortBy('createdAt'),
    [selectedDate.toDateString()]
  )

  const dayTotal = sales?.reduce((sum, s) => sum + s.total, 0) || 0
  const saleCount = sales?.length || 0

  const formatPrice = (n: number) => 'G ' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })
  const formatTime = (d: Date) => new Date(d).toLocaleTimeString('fr-HT', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (d: Date) => new Date(d).toLocaleDateString('fr-HT', { weekday: 'short', day: 'numeric', month: 'short' })

  const prevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d)
  }

  const nextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    if (d <= new Date()) setSelectedDate(d)
  }

  const shareReceipt = (sale: Sale) => {
    const items = sale.items.map(i => i.productName + ' x' + i.quantity + ' = ' + formatPrice(i.subtotal)).join('\n')
    const text = 'RESI TiKes\n' + formatDate(sale.createdAt) + ' ' + formatTime(sale.createdAt) + '\n\n' + items + '\n\nTOTAL: ' + formatPrice(sale.total) + '\n\nMesi!'
    
    if (navigator.share) {
      navigator.share({ title: 'Resi TiKes', text })
    } else {
      const waUrl = 'https://wa.me/?text=' + encodeURIComponent(text)
      window.open(waUrl, '_blank')
    }
  }

  if (selectedSale) {
    return (
      <div className="flex flex-col h-screen pb-16">
        <div className="p-4 border-b border-black flex items-center justify-between">
          <button onClick={() => setSelectedSale(null)} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <h1 className="font-bold">Resi</h1>
          <button onClick={() => shareReceipt(selectedSale)} className="p-2 -mr-2">
            <Share2 className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center mb-4">
            <p className="text-sm opacity-50">{formatDate(selectedSale.createdAt)}</p>
            <p className="text-sm opacity-50">{formatTime(selectedSale.createdAt)}</p>
          </div>
          <div className="border border-black divide-y divide-black">
            {selectedSale.items.map((item, i) => (
              <div key={i} className="p-3 flex justify-between">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm opacity-50">x{item.quantity} @ {formatPrice(item.unitPrice)}</p>
                </div>
                <p className="font-bold">{formatPrice(item.subtotal)}</p>
              </div>
            ))}
          </div>
          <div className="border border-black border-t-0 p-4 flex justify-between">
            <p className="font-bold text-lg">TOTAL</p>
            <p className="font-bold text-lg">{formatPrice(selectedSale.total)}</p>
          </div>
          <button onClick={() => shareReceipt(selectedSale)}
            className="w-full mt-4 border-2 border-black p-4 flex items-center justify-center gap-2 active:bg-black active:text-white">
            <Share2 className="w-5 h-5" strokeWidth={1.5} />
            <span>Pataje sou WhatsApp</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen pb-16">
      <div className="p-4 border-b border-black">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevDay} className="p-2 border border-black">
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <p className="font-bold">{formatDate(selectedDate)}</p>
          <button onClick={nextDay} className="p-2 border border-black" 
            disabled={selectedDate.toDateString() === new Date().toDateString()}>
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="border-2 border-black p-4 text-center">
          <p className="text-sm opacity-50">Total Jou a</p>
          <p className="text-3xl font-bold">{formatPrice(dayTotal)}</p>
          <p className="text-sm opacity-50 mt-1">{saleCount} lavant</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sales && sales.length > 0 ? (
          <div className="space-y-2">
            {sales.map((sale) => (
              <button key={sale.id} onClick={() => setSelectedSale(sale)}
                className="w-full border border-black p-4 text-left active:bg-black active:text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{formatTime(sale.createdAt)}</p>
                    <p className="text-sm opacity-50">{sale.items.length} atik</p>
                  </div>
                  <p className="font-bold text-lg">{formatPrice(sale.total)}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 opacity-50">
            <Receipt className="w-16 h-16 mx-auto mb-4" strokeWidth={1} />
            <p>Pa gen lavant jou sa a</p>
          </div>
        )}
      </div>
    </div>
  )
}
