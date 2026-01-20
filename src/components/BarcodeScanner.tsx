import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { X, Camera, Keyboard, RefreshCw } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isSecure = typeof window !== 'undefined' && 
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost')

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop()
        }
      } catch (e) {
        console.log('Stop error (safe to ignore):', e)
      }
      scannerRef.current = null
    }
  }

  const startScanner = async () => {
    setError(null)
    setStarting(true)

    await stopScanner()

    // Wait for DOM
    await new Promise(r => setTimeout(r, 300))

    if (!containerRef.current) {
      setError('Erè entèn')
      setStarting(false)
      return
    }

    try {
      // Check camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      stream.getTracks().forEach(track => track.stop())

      const scanner = new Html5Qrcode('barcode-reader-container')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777
        },
        (decodedText) => {
          stopScanner()
          onScan(decodedText)
        },
        () => {} // Ignore errors during scanning
      )

      setStarting(false)
    } catch (err: any) {
      console.error('Scanner error:', err)
      setStarting(false)
      
      if (err.name === 'NotAllowedError') {
        setError('Ou bezwen bay pèmisyon pou kamera')
      } else if (err.name === 'NotFoundError') {
        setError('Pa jwenn kamera')
      } else if (!isSecure) {
        setError('Kamera bezwen HTTPS')
      } else {
        setError(err.message || 'Pa kapab ouvri kamera')
      }
    }
  }

  useEffect(() => {
    if (!manualMode && isSecure) {
      startScanner()
    } else if (!isSecure) {
      setManualMode(true)
      setStarting(false)
    }

    return () => {
      stopScanner()
    }
  }, [manualMode])

  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  const handleManualSubmit = async () => {
    if (manualCode.trim()) {
      await stopScanner()
      onScan(manualCode.trim())
    }
  }

  const switchToManual = async () => {
    await stopScanner()
    setManualMode(true)
    setError(null)
  }

  const switchToCamera = () => {
    setManualMode(false)
    setError(null)
  }

  // Manual mode
  if (manualMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 text-white">
          <span className="font-medium">Antre Kod Ba</span>
          <button onClick={handleClose} className="p-2">
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="Tape kod ba a"
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
          
          {isSecure && (
            <button onClick={switchToCamera} className="mt-6 text-white flex items-center gap-2 opacity-70">
              <Camera className="w-4 h-4" /> Itilize kamera
            </button>
          )}
        </div>
        
        <div className="p-4">
          <button onClick={handleClose} className="w-full border border-white text-white p-3">
            Anile
          </button>
        </div>
      </div>
    )
  }

  // Camera mode
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

      <div className="flex-1 flex flex-col items-center justify-center p-4" ref={containerRef}>
        {starting && !error && (
          <p className="text-white mb-4">Ap ouvri kamera...</p>
        )}
        
        {error ? (
          <div className="text-white text-center">
            <p className="mb-4">{error}</p>
            <button onClick={startScanner} className="border border-white px-4 py-2 flex items-center gap-2 mx-auto mb-4">
              <RefreshCw className="w-4 h-4" /> Eseye ankò
            </button>
          </div>
        ) : (
          <>
            <div id="barcode-reader-container" style={{ width: '100%', maxWidth: '400px' }} />
            {!starting && (
              <p className="text-white text-center mt-4 text-sm opacity-70">Mete kod ba nan kare a</p>
            )}
          </>
        )}
      </div>

      <div className="p-4 space-y-2">
        <button onClick={switchToManual} className="w-full border border-white text-white p-3 flex items-center justify-center gap-2">
          <Keyboard className="w-4 h-4" /> Tape manyèlman
        </button>
      </div>
    </div>
  )
}
