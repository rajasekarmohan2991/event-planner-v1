"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Image as ImageIcon, Palette, Layout, ImagePlus, Sparkles } from "lucide-react"

export default function EventDesignPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  if (status === 'loading') return <div className="p-6">Loading...</div>
  return <DesignEditor eventId={params?.id} />
}

interface FloorPlan {
  id: string
  name: string
  createdAt: string
  config: any
}

function DesignEditor({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  async function loadFloorPlans() {
    setLoading(true); setMsg(null)
    try {
      console.log('[FloorPlan List] Fetching from /api/events/' + eventId + '/floor-plans-direct')
      const r = await fetch(`/api/events/${eventId}/floor-plans-direct`, { cache: 'no-store' })
      console.log('[FloorPlan List] Response status:', r.status, r.ok)

      if (r.ok) {
        const data = await r.json()
        console.log('[FloorPlan List] Received data:', data)

        if (data.floorPlans && Array.isArray(data.floorPlans)) {
          setFloorPlans(data.floorPlans)
          console.log('[FloorPlan List] Loaded', data.floorPlans.length, 'floor plans')
        } else {
          console.log('[FloorPlan List] No floor plans in response')
          setFloorPlans([])
        }
      } else {
        const errorText = await r.text()
        console.error('[FloorPlan List] Failed to fetch:', r.status, errorText)
        setFloorPlans([])
      }
    } catch (e: any) {
      console.error('[FloorPlan List] Error:', e)
      setFloorPlans([])
    } finally { setLoading(false) }
  }

  useEffect(() => { if (eventId) loadFloorPlans() }, [eventId])

  async function deleteFloorPlan(planId: string) {
    if (!confirm('Delete this floor plan?')) return
    try {
      const r = await fetch(`/api/events/${eventId}/design/floor-plan/${planId}`, { method: 'DELETE' })
      if (r.ok) {
        setFloorPlans(prev => prev.filter(p => p.id !== planId))
        setMsg('Floor plan deleted')
      }
    } catch (e: any) {
      setMsg('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Design & Branding</h1>
      <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>

      {/* Design Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 2D Floor Plan Generator */}
        <Link href={`/events/${eventId}/design/floor-plan`}>
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                <Layout className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-indigo-900">2D Floor Plan</h3>
            </div>
            <p className="text-sm text-indigo-700 mb-3">
              Generate dynamic 2D floor plans for your venue with drag-and-drop features
            </p>
            <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Create Floor Plan →</span>
            </div>
          </div>
        </Link>

        {/* Banner Generator */}
        <Link href={`/events/${eventId}/design/banner`}>
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-pink-600 rounded-lg group-hover:scale-110 transition-transform">
                <ImagePlus className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-pink-900">Banner Generator</h3>
            </div>
            <p className="text-sm text-pink-700 mb-3">
              Create stunning event banners with customizable templates and designs
            </p>
            <div className="flex items-center gap-2 text-pink-600 font-medium text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Create Banner →</span>
            </div>
          </div>
        </Link>
      </div>

      {msg && <div className="text-sm text-slate-700 bg-green-50 border border-green-200 rounded p-3 mb-6">{msg}</div>}

      {/* Created Floor Plans List */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Created Floor Plans</h2>
          <Link href={`/events/${eventId}/design/floor-plan`}>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
              + Create New Floor Plan
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading floor plans...</div>
        ) : floorPlans.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
            <Layout className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-2">No floor plans created yet</p>
            <p className="text-sm text-slate-400 mb-4">Create your first floor plan to visualize your event layout</p>
            <Link href={`/events/${eventId}/design/floor-plan`}>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                Create Floor Plan
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {floorPlans.map(plan => (
              <div key={plan.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layout className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-sm">{plan.name}</h3>
                  </div>
                  <button
                    onClick={() => deleteFloorPlan(plan.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                  {plan.config?.guestCount && <p>Capacity: {plan.config.guestCount} guests</p>}
                  {plan.config?.hallName && <p>Hall: {plan.config.hallName}</p>}
                </div>
                <Link href={`/events/${eventId}/design/floor-plan?planId=${plan.id}`}>
                  <button className="mt-3 w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition-colors">
                    View/Edit
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
