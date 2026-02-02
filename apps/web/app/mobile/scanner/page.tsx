"use client"

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { Camera, CameraOff, Flashlight, FlashlightOff, RotateCcw } from 'lucide-react'

export default function MobileScannerPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [flashlight, setFlashlight] = useState(false)
  const [lastScan, setLastScan] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    initializeCamera()
    return () => {
      stopScanning()
    }
  }, [])

  const initializeCamera = async () => {
    try {
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader
      
      const videoDevices = await codeReader.listVideoInputDevices()
      setDevices(videoDevices)
      
      if (videoDevices.length > 0) {
        // Prefer back camera for mobile
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        ) || videoDevices[videoDevices.length - 1]
        
        setSelectedDevice(backCamera.deviceId)
      }
    } catch (err: any) {
      setError(`Camera initialization failed: ${err.message}`)
    }
  }

  const startScanning = async () => {
    if (!codeReaderRef.current || !selectedDevice || !videoRef.current) return

    try {
      setIsScanning(true)
      setError('')
      
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice,
        videoRef.current,
        (result, err) => {
          if (result) {
            const scannedText = result.getText()
            if (scannedText !== lastScan?.text) {
              setResult(scannedText)
              setLastScan({ text: scannedText, timestamp: new Date() })
              processQRCode(scannedText)
            }
          }
          if (err && !(err.name === 'NotFoundException')) {
            console.error('Scan error:', err)
          }
        }
      )
    } catch (err: any) {
      setError(`Scanning failed: ${err.message}`)
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    setIsScanning(false)
  }

  const processQRCode = async (qrText: string) => {
    try {
      // Try to parse as base64 JSON (our format)
      let qrData
      try {
        const decoded = Buffer.from(qrText, 'base64').toString('utf8')
        qrData = JSON.parse(decoded)
      } catch {
        // If not our format, treat as plain text
        qrData = { rawText: qrText }
      }

      // Show scan result
      setResult(JSON.stringify(qrData, null, 2))

      // If it's our registration QR code, show check-in option
      if (qrData.registrationId && qrData.eventId) {
        const checkIn = confirm(
          `Check in ${qrData.name || 'attendee'} for ${qrData.type || 'general'} registration?`
        )
        
        if (checkIn) {
          await performCheckIn(qrText, qrData)
        }
      }
    } catch (err: any) {
      setError(`QR processing failed: ${err.message}`)
    }
  }

  const performCheckIn = async (token: string, qrData: any) => {
    try {
      const res = await fetch(`/api/events/${qrData.eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          location: 'Mobile Scanner',
          deviceId: `mobile-${navigator.userAgent.slice(0, 20)}`,
          idempotencyKey: `mobile-${Date.now()}`
        })
      })

      if (res.ok) {
        const result = await res.json()
        alert(`✅ Check-in successful!\n${qrData.name || 'Attendee'} has been checked in.`)
      } else {
        const error = await res.text()
        alert(`❌ Check-in failed: ${error}`)
      }
    } catch (err: any) {
      alert(`❌ Check-in error: ${err.message}`)
    }
  }

  const toggleFlashlight = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream
      if (stream) {
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities() as any
        
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !flashlight } as any]
          })
          setFlashlight(!flashlight)
        }
      }
    } catch (err) {
      console.error('Flashlight toggle failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">QR Scanner</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleFlashlight}
            className="p-2 bg-gray-800 rounded-lg"
            disabled={!isScanning}
          >
            {flashlight ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-gray-800 rounded-lg"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Camera Selection */}
      {devices.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded-lg text-white"
            disabled={isScanning}
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video Preview */}
      <div className="relative mb-4">
        <video
          ref={videoRef}
          className="w-full aspect-square bg-gray-900 rounded-lg object-cover"
          playsInline
          muted
        />
        
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg animate-pulse">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            disabled={!selectedDevice}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-3 rounded-lg font-medium"
          >
            <Camera className="h-5 w-5" />
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 p-3 rounded-lg font-medium"
          >
            <CameraOff className="h-5 w-5" />
            Stop Scanning
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 p-3 rounded-lg mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg mb-4">
          <h3 className="font-medium mb-2">Last Scan Result:</h3>
          <pre className="text-xs text-green-400 whitespace-pre-wrap overflow-x-auto">
            {result}
          </pre>
          {lastScan && (
            <div className="text-xs text-gray-400 mt-2">
              Scanned at: {lastScan.timestamp.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg">
        <h3 className="font-medium mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Point camera at QR code</li>
          <li>• Keep steady for best results</li>
          <li>• Use flashlight in low light</li>
          <li>• Registration QR codes will prompt for check-in</li>
        </ul>
      </div>

      {/* PWA Install Prompt */}
      <div className="mt-4 text-center text-xs text-gray-500">
        Add to home screen for offline access
      </div>
    </div>
  )
}
