'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Check, DollarSign, RefreshCw, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import ManageTabs from '@/components/events/ManageTabs'

interface Exhibitor {
  id: string
  name: string
  company?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  boothNumber?: string
  status: string
  paymentStatus?: string
  paymentAmount?: number
  paidAmount?: number
  createdAt: string
}

export default function EventExhibitorsPage() {
  const params = useParams()
  const eventId = params?.id as string

  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null)

  const [exhibitorForm, setExhibitorForm] = useState({
    name: '',
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    boothType: '',
    electricalAccess: false,
    displayTables: false,
    notes: ''
  })

  const [pricingForm, setPricingForm] = useState({
    basePrice: '',
    electricalPrice: '500',
    tablesPrice: '300',
    otherCharges: '0',
    notes: ''
  })

  const [refundForm, setRefundForm] = useState({
    reason: '',
    refundAmount: ''
  })

  useEffect(() => {
    if (eventId) {
      fetchExhibitors()
    }
  }, [eventId])

  const fetchExhibitors = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/exhibitors`)
      if (res.ok) {
        const data = await res.json()
        // API returns array directly or wrapped in exhibitors property
        const items = Array.isArray(data) ? data : (data.exhibitors || data.data || [])
        setExhibitors(items)
      }
    } catch (error) {
      console.error('Failed to fetch exhibitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExhibitor = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/exhibitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exhibitorForm)
      })

      if (res.ok) {
        alert('Exhibitor added successfully!')
        setShowAddForm(false)
        setExhibitorForm({
          name: '',
          company: '',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          boothType: '',
          electricalAccess: false,
          displayTables: false,
          notes: ''
        })
        fetchExhibitors()
      } else {
        const error = await res.json()
        alert(`Failed to add exhibitor: ${error.message}`)
      }
    } catch (error) {
      console.error('Error adding exhibitor:', error)
      alert('Failed to add exhibitor')
    }
  }

  const handleApprove = async (exhibitorId: string) => {
    if (!confirm('Approve this exhibitor and auto-assign booth number?')) return

    try {
      const res = await fetch(`/api/events/${eventId}/exhibitors/${exhibitorId}/approve`, {
        method: 'POST'
      })

      if (res.ok) {
        alert('Exhibitor approved! Booth number assigned.')
        fetchExhibitors()
      } else {
        const error = await res.json()
        alert(`Failed to approve: ${error.message}`)
      }
    } catch (error) {
      console.error('Error approving exhibitor:', error)
      alert('Failed to approve exhibitor')
    }
  }

  const handleOpenPricing = (exhibitor: Exhibitor) => {
    setSelectedExhibitor(exhibitor)
    setPricingForm({
      basePrice: '',
      electricalPrice: '500',
      tablesPrice: '300',
      otherCharges: '0',
      notes: ''
    })
    setShowPricingModal(true)
  }

  const handleFinalizePricing = async () => {
    if (!selectedExhibitor) return

    try {
      const res = await fetch(`/api/events/${eventId}/exhibitors/${selectedExhibitor.id}/finalize-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingForm)
      })

      if (res.ok) {
        alert('Pricing finalized! Payment link sent to exhibitor.')
        setShowPricingModal(false)
        setSelectedExhibitor(null)
        fetchExhibitors()
      } else {
        const error = await res.json()
        alert(`Failed to finalize pricing: ${error.message}`)
      }
    } catch (error) {
      console.error('Error finalizing pricing:', error)
      alert('Failed to finalize pricing')
    }
  }

  const handleOpenRefund = (exhibitor: Exhibitor) => {
    setSelectedExhibitor(exhibitor)
    setRefundForm({
      reason: '',
      refundAmount: String(exhibitor.paymentAmount || 0)
    })
    setShowRefundModal(true)
  }

  const handleProcessRefund = async () => {
    if (!selectedExhibitor) return
    if (!confirm(`Process refund of ₹${refundForm.refundAmount} for ${selectedExhibitor.company || selectedExhibitor.name}?`)) return

    try {
      const res = await fetch(`/api/events/${eventId}/exhibitors/${selectedExhibitor.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refundForm)
      })

      if (res.ok) {
        alert('Refund processed successfully!')
        setShowRefundModal(false)
        setSelectedExhibitor(null)
        fetchExhibitors()
      } else {
        const error = await res.json()
        alert(`Failed to process refund: ${error.message}`)
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      alert('Failed to process refund')
    }
  }

  const handleDelete = async (exhibitorId: string, exhibitorName: string) => {
    if (!confirm(`Delete exhibitor "${exhibitorName}"? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/events/${eventId}/exhibitors/${exhibitorId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        alert('Exhibitor deleted successfully')
        fetchExhibitors()
      } else {
        const error = await res.json()
        alert(`Failed to delete: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting exhibitor:', error)
      alert('Failed to delete exhibitor')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'PENDING_APPROVAL': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'PAYMENT_PENDING': 'bg-orange-100 text-orange-800',
      'ALLOCATED': 'bg-green-100 text-green-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'REFUNDED': 'bg-red-100 text-red-800'
    }
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getActionButtons = (exhibitor: Exhibitor) => {
    const buttons = []

    // Approve button (for PENDING_APPROVAL)
    if (exhibitor.status === 'PENDING_APPROVAL') {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          onClick={() => handleApprove(exhibitor.id)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Check className="w-4 h-4 mr-1" />
          Approve
        </Button>
      )
    }

    // Set Pricing button (for APPROVED)
    if (exhibitor.status === 'APPROVED') {
      buttons.push(
        <Button
          key="pricing"
          size="sm"
          onClick={() => handleOpenPricing(exhibitor)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <DollarSign className="w-4 h-4 mr-1" />
          Set Pricing
        </Button>
      )
    }

    // Payment Link (for PAYMENT_PENDING)
    if (exhibitor.status === 'PAYMENT_PENDING') {
      const paymentLink = `${window.location.origin}/events/${eventId}/exhibitors/${exhibitor.id}/payment`
      buttons.push(
        <Button
          key="payment"
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(paymentLink)
            alert('Payment link copied to clipboard!')
          }}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Copy Payment Link
        </Button>
      )
    }

    // Refund button (for ALLOCATED/CONFIRMED with payment)
    if ((exhibitor.status === 'ALLOCATED' || exhibitor.status === 'CONFIRMED') && exhibitor.paymentStatus === 'COMPLETED') {
      buttons.push(
        <Button
          key="refund"
          size="sm"
          variant="outline"
          onClick={() => handleOpenRefund(exhibitor)}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refund
        </Button>
      )
    }

    // Delete button (always available except for REFUNDED)
    if (exhibitor.status !== 'REFUNDED') {
      buttons.push(
        <Button
          key="delete"
          size="sm"
          variant="outline"
          onClick={() => handleDelete(exhibitor.id, exhibitor.company || exhibitor.name)}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      )
    }

    return buttons
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ManageTabs eventId={eventId} />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Exhibitor Management</h1>
            <p className="text-gray-600">Manage exhibitor registrations and booth allocations</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Exhibitor
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exhibitors...</p>
          </div>
        ) : exhibitors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No exhibitors yet. Click "Add Exhibitor" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exhibitors.map((exhibitor) => (
              <Card key={exhibitor.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{exhibitor.company || exhibitor.name}</h3>
                        {exhibitor.boothNumber && (
                          <Badge variant="outline" className="text-indigo-600 border-indigo-300">
                            Booth #{exhibitor.boothNumber}
                          </Badge>
                        )}
                        {getStatusBadge(exhibitor.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <p className="text-gray-500">Contact</p>
                          <p className="font-medium">{exhibitor.contactName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p className="font-medium">{exhibitor.contactEmail || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p className="font-medium">{exhibitor.contactPhone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Payment Amount</p>
                          <p className="font-medium">
                            {exhibitor.paymentAmount ? `₹${exhibitor.paymentAmount.toLocaleString()}` : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {getActionButtons(exhibitor)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Exhibitor Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Exhibitor</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={exhibitorForm.company}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, company: e.target.value })}
                    placeholder="ABC Corporation"
                  />
                </div>
                <div>
                  <Label>Brand/Display Name</Label>
                  <Input
                    value={exhibitorForm.name}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, name: e.target.value })}
                    placeholder="ABC Tech"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name *</Label>
                  <Input
                    value={exhibitorForm.contactName}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, contactName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Contact Email *</Label>
                  <Input
                    type="email"
                    value={exhibitorForm.contactEmail}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, contactEmail: e.target.value })}
                    placeholder="john@abc.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={exhibitorForm.contactPhone}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, contactPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label>Booth Type</Label>
                  <Input
                    value={exhibitorForm.boothType}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, boothType: e.target.value })}
                    placeholder="Standard, Premium, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exhibitorForm.electricalAccess}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, electricalAccess: e.target.checked })}
                    className="rounded"
                  />
                  Electrical Access Required
                </Label>
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exhibitorForm.displayTables}
                    onChange={(e) => setExhibitorForm({ ...exhibitorForm, displayTables: e.target.checked })}
                    className="rounded"
                  />
                  Display Tables Required
                </Label>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={exhibitorForm.notes}
                  onChange={(e) => setExhibitorForm({ ...exhibitorForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAddExhibitor} className="bg-indigo-600 hover:bg-indigo-700">
                Add Exhibitor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pricing Modal */}
        <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Pricing for {selectedExhibitor?.company || selectedExhibitor?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Base Booth Price (₹) *</Label>
                <Input
                  type="number"
                  value={pricingForm.basePrice}
                  onChange={(e) => setPricingForm({ ...pricingForm, basePrice: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label>Electrical Access Fee (₹)</Label>
                <Input
                  type="number"
                  value={pricingForm.electricalPrice}
                  onChange={(e) => setPricingForm({ ...pricingForm, electricalPrice: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div>
                <Label>Display Tables Fee (₹)</Label>
                <Input
                  type="number"
                  value={pricingForm.tablesPrice}
                  onChange={(e) => setPricingForm({ ...pricingForm, tablesPrice: e.target.value })}
                  placeholder="300"
                />
              </div>
              <div>
                <Label>Other Charges (₹)</Label>
                <Input
                  type="number"
                  value={pricingForm.otherCharges}
                  onChange={(e) => setPricingForm({ ...pricingForm, otherCharges: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={pricingForm.notes}
                  onChange={(e) => setPricingForm({ ...pricingForm, notes: e.target.value })}
                  placeholder="Payment terms, special instructions..."
                  rows={2}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Total will be calculated with 18% GST and payment link will be sent to exhibitor.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPricingModal(false)}>Cancel</Button>
              <Button onClick={handleFinalizePricing} className="bg-blue-600 hover:bg-blue-700">
                Finalize & Send Payment Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refund Modal */}
        <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Refund for {selectedExhibitor?.company || selectedExhibitor?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Refund Amount (₹) *</Label>
                <Input
                  type="number"
                  value={refundForm.refundAmount}
                  onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                  placeholder="12390"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Original payment: ₹{selectedExhibitor?.paymentAmount?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <Label>Refund Reason *</Label>
                <Textarea
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  placeholder="Exhibitor cancelled participation..."
                  rows={3}
                />
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  ⚠️ This action cannot be undone. The refund will be processed and exhibitor will be notified.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRefundModal(false)}>Cancel</Button>
              <Button onClick={handleProcessRefund} className="bg-red-600 hover:bg-red-700">
                Process Refund
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
