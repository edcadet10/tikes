import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera, Keyboard } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'manual' | 'camera'>('manual')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const mountedRef = useRef(true)

  const startCamera = async () => {
    setCameraError(null)
    setStarting(true)
    setMode('camera')

    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop() } catch (e) {}
        scannerRef.current = null
      }

      // Check if we're on HTTPS or localhost
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
      if (!isSecure) {
        throw new Error('Kamera bezwen HTTPS. Tape kod la manyèlman.')
      }

      const scanner = new Html5Qrcode('barcode-reader', { verbose: false })
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 160 } },
        (decodedText) => {
          if (mountedRef.current) {
            scanner.stop().catch(() => {})
            onScan(decodedText)
          }
        },
        () => {}
      )

      if (mountedRef.current) setStarting(false)
    } catch (err: any) {
      console.error('Scanner error:', err)
      if (mountedRef.current) {
        setStarting(false)
        setCameraError(err.message || 'Pa kapab ouvri kamera')
        setMode('manual')
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (scannerRef.current) scannerRef.current.stop().catch(() => {})
    }
  }, [])

  const handleClose = () => {
    if (scannerRef.current) scannerRef.current.stop().catch(() => {})
    onClose()
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      if (scannerRef.current) scannerRef.current.stop().catch(() => {})
      onScan(manualCode.trim())
    }
  }

  if (mode === 'camera' && !cameraError) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-medium">Eskane Kod Ba</span>
          </div>
          <button onClick={handleClose} className="p-2">
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {starting && <p className="text-white mb-4">Ap ouvri kamera...</p>}
          <div id="barcode-reader" style={{ width: '100%', maxWidth: '400px' }} />
          <p className="text-white text-center mt-4 text-sm opacity-70">Mete kod ba nan kare a</p>
        </div>

        <div className="p-4">
          <button onClick={() => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); setMode('manual') }} 
            className="w-full border border-white text-white p-3 flex items-center justify-center gap-2">
            <Keyboard className="w-4 h-4" /> Tape manyèlman
          </button>
        </div>
      </div>
    )
  }

  // Manual mode (default)
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="font-medium">Antre Kod Ba</span>
        <button onClick={handleClose} className="p-2">
          <X className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {cameraError && (
          <p className="text-white text-sm mb-4 text-center opacity-70">{cameraError}</p>
        )}
        
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
          placeholder="Tape oswa eskane kod ba"
          className="w-full max-w-xs border-2 border-white bg-transparent text-white p-4 text-center text-xl"
          autoFocus
        />
        
        <button
          onClick={handleManualSubmit}
          disabled={!manualCode.trim()}
          className="mt-4 w-full max-w-xs bg-white text-black p-4 font-medium disabled:opacity-50"
        >
          Konfime
        </button>
        
        <button
          onClick={startCamera}
          className="mt-6 text-white flex items-center gap-2 opacity-70"
        >
          <Camera className="w-4 h-4" /> Eseye kamera
        </button>
      </div>
      
      <div className="p-4">
        <button onClick={handleClose} className="w-full border border-white text-white p-3">
          Anile
        </button>
      </div>
    </div>
  )
}
