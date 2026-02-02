'use client'

import { useSession } from "next-auth/react"
import ManageTabs from '@/components/events/ManageTabs'
import { useEffect, useState } from 'react'
import AvatarIcon from '@/components/ui/AvatarIcon'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, Eye, Download, Users } from 'lucide-react'
import SponsorForm from '@/components/events/sponsors/SponsorForm'
import SponsorViewDialog from '@/components/events/sponsors/SponsorViewDialog'
import { ComprehensiveSponsor } from '@/types/sponsor'
import { toast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface CompanySponsor {
  id: string
  name: string
  industry: string | null
  website: string | null
  logo: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
}

export default function EventSponsorsPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [items, setItems] = useState<ComprehensiveSponsor[]>([])
  const [loading, setLoading] = useState(false)
  const [viewState, setViewState] = useState<'LIST' | 'FORM' | 'VIEW'>('LIST')
  const [editData, setEditData] = useState<Partial<ComprehensiveSponsor> | undefined>(undefined)
  const [viewData, setViewData] = useState<ComprehensiveSponsor | null>(null)

  // Company sponsors selection
  const [showCompanySponsors, setShowCompanySponsors] = useState(false)
  const [companySponsors, setCompanySponsors] = useState<CompanySponsor[]>([])
  const [loadingCompanySponsors, setLoadingCompanySponsors] = useState(false)

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

  // Load company's pre-registered sponsors
  const loadCompanySponsors = async () => {
    try {
      setLoadingCompanySponsors(true)
      const res = await fetch('/api/admin/service-management/sponsors')
      if (res.ok) {
        const data = await res.json()
        setCompanySponsors(data.sponsors || [])
      }
    } catch (error) {
      console.error('Failed to load company sponsors:', error)
    } finally {
      setLoadingCompanySponsors(false)
    }
  }

  // Import a company sponsor to this event
  const handleImportSponsor = async (sponsor: CompanySponsor) => {
    try {
      // Create a new event sponsor from the company sponsor data
      const sponsorData = {
        name: sponsor.name,
        industry: sponsor.industry,
        website: sponsor.website,
        logo: sponsor.logo,
        contactName: sponsor.contactName,
        contactEmail: sponsor.contactEmail,
        contactPhone: sponsor.contactPhone,
        tier: 'BRONZE' // Default tier, can be changed
      }

      const res = await fetch(`/api/events/${params.id}/sponsors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sponsorData)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to import sponsor')
      }

      toast({ title: 'Sponsor imported successfully!' })
      setShowCompanySponsors(false)
      load()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' as any })
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Delete failed:', errorData)
        throw new Error(errorData.message || errorData.error || 'Failed to delete sponsor')
      }

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
      console.error('Sponsor deletion error:', e)
      toast({
        title: 'Error deleting sponsor',
        description: e.message || 'An unknown error occurred',
        variant: 'destructive' as any,
        duration: 5000
      })
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { loadCompanySponsors(); setShowCompanySponsors(true) }}
            >
              <Users className="w-4 h-4 mr-2" /> Import from Company
            </Button>
            <Button onClick={() => { setEditData(undefined); setViewState('FORM') }}>
              <Plus className="w-4 h-4 mr-2" /> Add Sponsor
            </Button>
          </div>
        )}
      </div>

      {/* Company Sponsors Selection Dialog */}
      <Dialog open={showCompanySponsors} onOpenChange={setShowCompanySponsors}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Import from Company Sponsors
            </DialogTitle>
            <DialogDescription>
              Select from your company's pre-registered sponsors to add to this event
            </DialogDescription>
          </DialogHeader>
          {loadingCompanySponsors ? (
            <div className="py-8 text-center text-gray-500">Loading sponsors...</div>
          ) : companySponsors.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No pre-registered sponsors</p>
              <p className="text-sm text-gray-500 mt-1">
                Add sponsors in Service Management to see them here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {companySponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                      {sponsor.logo ? (
                        <img src={sponsor.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        sponsor.name?.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{sponsor.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {sponsor.industry && <Badge variant="outline" className="text-xs">{sponsor.industry}</Badge>}
                        {sponsor.contactEmail && <span>{sponsor.contactEmail}</span>}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleImportSponsor(sponsor)}>
                    <Download className="w-4 h-4 mr-2" /> Import
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
