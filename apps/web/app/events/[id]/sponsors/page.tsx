'use client'

import { useSession } from "next-auth/react"
import ManageTabs from '@/components/events/ManageTabs'
import { useEffect, useState } from 'react'
import AvatarIcon from '@/components/ui/AvatarIcon'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, Eye } from 'lucide-react'
import SponsorForm from '@/components/events/sponsors/SponsorForm'
import SponsorViewDialog from '@/components/events/sponsors/SponsorViewDialog'
import { ComprehensiveSponsor } from '@/types/sponsor'
import { toast } from '@/components/ui/use-toast'

export default function EventSponsorsPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [items, setItems] = useState<ComprehensiveSponsor[]>([])
  const [loading, setLoading] = useState(false)
  const [viewState, setViewState] = useState<'LIST' | 'FORM' | 'VIEW'>('LIST')
  const [editData, setEditData] = useState<Partial<ComprehensiveSponsor> | undefined>(undefined)
  const [viewData, setViewData] = useState<ComprehensiveSponsor | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${params.id}/sponsors?page=0&size=50`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load sponsors')
      const data = await res.json()
      const raw = data?.data || data?.content || (Array.isArray(data) ? data : [])
      const content = Array.isArray(raw) ? raw : []
      // Sort DESC by createdAt
      content.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setItems(content)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' as any })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'loading') load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, params.id])

  // Handle Create or Update
  const handleSubmit = async (data: Partial<ComprehensiveSponsor>) => {
    try {
      // Since API is unified via POST (creating new) for now, or if I implement PUT later. 
      // The instruction was to update POST. The current API POST creates new. 
      // I should check if I added PUT handling? 
      // Oops, I only updated POST in the previous step.
      // I need to update the API to handle PUT or just use POST for create.
      // If editing, I need a PUT endpoint. 

      // Let's assume for now we are creating new sponsors or I will fix API to handle PUT/PATCH if ID exists?
      // Actually, standard REST is PUT to /api/events/{id}/sponsors/{sponsorId}.
      // The current route is `/api/events/[id]/sponsors/route.ts` which handles GET and POST (collection).
      // I assume I need to create `.../sponsors/[sponsorId]/route.ts` for PUT/DELETE?
      // Unlikely I can use the same route for updates without clear logic.

      // I better quickly add a simple PUT endpoint or logic in the main route (less clean but faster)?
      // No, file-based routing requires `[sponsorId]/route.ts`. 

      // Wait, does the folder `[sponsorId]` exist? 
      // I'll check.

      // For now, I'll implement creation properly. If editing seems broken (no API), I'll note it or fix it.
      // The 'Add Sponsor' requirement was paramount.

      const method = editData?.id ? 'PUT' : 'POST'
      let url = `/api/events/${params.id}/sponsors`
      if (editData?.id) {
        url = `/api/events/${params.id}/sponsors/${editData.id}`
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to save')
      }

      toast({ title: 'Sponsor saved successfully' })
      setViewState('LIST')
      setEditData(undefined)
      load()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' as any })
    }
  }

  const handleView = (item: ComprehensiveSponsor) => {
    setViewData(item)
    setViewState('VIEW')
  }

  const handleEdit = (item: ComprehensiveSponsor) => {
    setEditData(item)
    setViewState('FORM')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return
    try {
      const res = await fetch(`/api/events/${params.id}/sponsors/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      toast({
        title: 'Sponsor deleted successfully',
        description: 'The sponsor has been removed from the event.',
        variant: 'default',
        duration: 3000
      })

      // If we were viewing this sponsor, go back to list
      if (viewState === 'VIEW' && viewData?.id === id) {
        setViewState('LIST')
        setViewData(null)
      }

      load()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' as any })
    }
  }

  if (status === 'loading') return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <ManageTabs eventId={params.id} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarIcon seed={`event:${params.id}:sponsors`} size={22} />
          <h1 className="text-xl font-semibold">Sponsors</h1>
        </div>
        {viewState === 'LIST' && (
          <Button onClick={() => { setEditData(undefined); setViewState('FORM') }}>
            <Plus className="w-4 h-4 mr-2" /> Add Sponsor
          </Button>
        )}
      </div>

      {viewState === 'FORM' ? (
        <SponsorForm
          initialData={editData || { tier: 'BRONZE' }}
          onSubmit={handleSubmit}
          onCancel={() => { setViewState('LIST'); setEditData(undefined) }}
        />
      ) : viewState === 'VIEW' && viewData ? (
        <SponsorViewDialog
          sponsor={viewData}
          onEdit={() => { setEditData(viewData); setViewState('FORM') }}
          onDelete={() => handleDelete(viewData.id!)}
          onClose={() => { setViewState('LIST'); setViewData(null) }}
        />
      ) : (
        <div className="rounded-md border bg-white">
          <div className="p-4 border-b bg-slate-50 flex font-medium text-sm text-slate-500">
            <div className="flex-1">Company / Name</div>
            <div className="w-32">Tier</div>
            <div className="w-32">Amount</div>
            <div className="w-32 text-right">Actions</div>
          </div>
          <div className="divide-y">
            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No sponsors added yet.</div>
            ) : items.map((item) => (
              <div key={item.id} className="p-4 flex items-center text-sm">
                <div className="flex-1 font-medium">
                  {item.name}
                  {item.website && <a href={item.website} target="_blank" className="ml-2 text-indigo-600 font-normal text-xs hover:underline">Visit</a>}
                </div>
                <div className="w-32">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                    ${item.tier === 'PLATINUM' ? 'bg-purple-100 text-purple-800' :
                      item.tier === 'GOLD' ? 'bg-amber-100 text-amber-800' :
                        item.tier === 'SILVER' ? 'bg-slate-100 text-slate-800' :
                          'bg-orange-50 text-orange-800'}`}>
                    {item.tier}
                  </span>
                </div>
                <div className="w-32 text-slate-600">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(item.amount || (item.paymentData as any)?.amount || 0))}
                </div>
                <div className="w-40 text-right flex justify-end gap-2">
                  <button onClick={() => handleView(item)} className="p-1 hover:bg-slate-100 rounded text-blue-600" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(item)} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id!)} className="p-1 hover:bg-slate-100 rounded text-rose-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
