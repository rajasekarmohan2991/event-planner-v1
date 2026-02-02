"use client"

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Save } from 'lucide-react'

interface BannerConfig {
  eventName: string
  tagline: string
  width: number
  height: number
  backgroundColor: string
  textColor: string
  fontSize: number
  fontFamily: string
  template: string
}

export default function BannerCreator() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const eventId = String(params?.id || '')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<BannerConfig>({
    eventName: 'Your Event Name',
    tagline: 'Join us for an amazing experience',
    width: 1200,
    height: 400,
    backgroundColor: '#4f46e5',
    textColor: '#ffffff',
    fontSize: 48,
    fontFamily: 'Arial',
    template: 'modern'
  })

  useEffect(() => {
    generateBanner()
  }, [config])

  const generateBanner = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = config.width
    canvas.height = config.height

    // Background
    if (config.template === 'gradient') {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, config.backgroundColor)
      gradient.addColorStop(1, adjustColor(config.backgroundColor, -30))
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = config.backgroundColor
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add decorative elements based on template
    if (config.template === 'modern') {
      ctx.fillStyle = adjustColor(config.backgroundColor, 20)
      ctx.beginPath()
      ctx.arc(canvas.width - 100, 100, 150, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = adjustColor(config.backgroundColor, -20)
      ctx.beginPath()
      ctx.arc(100, canvas.height - 100, 120, 0, Math.PI * 2)
      ctx.fill()
    }

    // Event Name
    ctx.fillStyle = config.textColor
    ctx.font = `bold ${config.fontSize}px ${config.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(config.eventName, canvas.width / 2, canvas.height / 2 - 30)

    // Tagline
    ctx.font = `${config.fontSize / 2}px ${config.fontFamily}`
    ctx.fillText(config.tagline, canvas.width / 2, canvas.height / 2 + 40)

    // Decorative line
    ctx.strokeStyle = config.textColor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2 - 100, canvas.height / 2 + 10)
    ctx.lineTo(canvas.width / 2 + 100, canvas.height / 2 + 10)
    ctx.stroke()
  }

  const adjustColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + amount))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  const downloadBanner = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${config.eventName.replace(/\s+/g, '-')}-banner.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const saveBanner = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setSaving(true)
    try {
      const imageData = canvas.toDataURL('image/png')
      const res = await fetch(`/api/events/${eventId}/design/banner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, imageData })
      })
      if (res.ok) {
        alert('Banner saved successfully!')
      } else {
        alert('Failed to save banner')
      }
    } catch (e) {
      alert('Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-800 to-pink-700 text-white p-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />Back to Design
            </button>
            <div className="flex items-center gap-3">
              <div className="text-4xl">🎨</div>
              <div>
                <h1 className="text-2xl font-bold">Event Banner Creator</h1>
                <p className="text-white/80 text-sm">Design professional event banners with custom text and colors</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[350px_1fr] gap-0">
            <div className="bg-gray-50 border-r p-6 space-y-6">
              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold mb-4">📝 Content</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Event Name *</label>
                    <input
                      type="text"
                      value={config.eventName}
                      onChange={(e) => setConfig({...config, eventName: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tagline</label>
                    <input
                      type="text"
                      value={config.tagline}
                      onChange={(e) => setConfig({...config, tagline: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold mb-4">📐 Dimensions</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={config.width}
                        onChange={(e) => setConfig({...config, width: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-md"
                        min="400"
                        max="2000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={config.height}
                        onChange={(e) => setConfig({...config, height: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-md"
                        min="200"
                        max="1000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setConfig({...config, width: 1200, height: 400})} className="px-3 py-2 text-xs border rounded hover:bg-gray-50">
                      1200×400
                    </button>
                    <button onClick={() => setConfig({...config, width: 1920, height: 600})} className="px-3 py-2 text-xs border rounded hover:bg-gray-50">
                      1920×600
                    </button>
                    <button onClick={() => setConfig({...config, width: 800, height: 600})} className="px-3 py-2 text-xs border rounded hover:bg-gray-50">
                      800×600
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold mb-4">🎨 Colors</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({...config, backgroundColor: e.target.value})}
                        className="w-12 h-10 border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({...config, backgroundColor: e.target.value})}
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.textColor}
                        onChange={(e) => setConfig({...config, textColor: e.target.value})}
                        className="w-12 h-10 border rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.textColor}
                        onChange={(e) => setConfig({...config, textColor: e.target.value})}
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold mb-4">✨ Style</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Template</label>
                    <select
                      value={config.template}
                      onChange={(e) => setConfig({...config, template: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="modern">Modern</option>
                      <option value="gradient">Gradient</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Font Size</label>
                    <input
                      type="range"
                      value={config.fontSize}
                      onChange={(e) => setConfig({...config, fontSize: parseInt(e.target.value)})}
                      className="w-full"
                      min="24"
                      max="96"
                    />
                    <div className="text-sm text-gray-600 text-center">{config.fontSize}px</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Font Family</label>
                    <select
                      value={config.fontFamily}
                      onChange={(e) => setConfig({...config, fontFamily: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col">
              <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-6 flex-1 overflow-auto flex items-center justify-center">
                <canvas ref={canvasRef} className="shadow-lg max-w-full h-auto" />
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={downloadBanner} className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2 font-semibold">
                  <Download className="w-4 h-4" />Download Banner
                </button>
                <button onClick={saveBanner} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold disabled:opacity-50">
                  <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
