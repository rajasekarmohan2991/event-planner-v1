# Remaining Features Implementation Code

## ✅ Feature 1: Sponsor Amount Field - DONE!

This has been implemented and deployed. You can now enter sponsorship amounts in the sponsor form.

---

## Feature 2: Vendor Bank Details Form

**File to Edit**: `/apps/web/app/events/[id]/vendors/page.tsx`

**Location**: After line 555 (after the file uploads section, before "Vendor Status")

**Code to Add**:

```typescript
                        {/* Bank Details Section */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-700">Bank Details (For Payment)</h3>
                            
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank Name</Label>
                                <Input
                                    id="bankName"
                                    value={vendorForm.bankName}
                                    onChange={(e) => setVendorForm(prev => ({ ...prev, bankName: e.target.value }))}
                                    placeholder="e.g., HDFC Bank"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                                <Input
                                    id="accountHolderName"
                                    value={vendorForm.accountHolderName}
                                    onChange={(e) => setVendorForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                                    placeholder="Account holder's full name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="accountNumber">Account Number</Label>
                                    <Input
                                        id="accountNumber"
                                        value={vendorForm.accountNumber}
                                        onChange={(e) => setVendorForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                                        placeholder="1234567890"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ifscCode">IFSC Code</Label>
                                    <Input
                                        id="ifscCode"
                                        value={vendorForm.ifscCode}
                                        onChange={(e) => setVendorForm(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                                        placeholder="HDFC0001234"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="upiId">UPI ID (Optional)</Label>
                                <Input
                                    id="upiId"
                                    value={vendorForm.upiId}
                                    onChange={(e) => setVendorForm(prev => ({ ...prev, upiId: e.target.value }))}
                                    placeholder="vendor@upi"
                                />
                            </div>
                        </div>
```

**Where to Add**: Between the file uploads `</div>` and the `{/* Vendor Status */}` comment.

---

## Feature 3: Sponsor View Dialog

**File to Edit**: `/apps/web/app/events/[id]/sponsors/page.tsx`

**Location**: After line 140 (after the `<SponsorForm />` closing tag)

**Code to Add**:

```typescript
      ) : viewState === 'VIEW' && viewData ? (
        <div className="rounded-md border bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{viewData.name}</h2>
            <Button variant="outline" onClick={() => { setViewState('LIST'); setViewData(null) }}>
              Back to List
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-slate-500">Tier:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                    ${viewData.tier === 'PLATINUM' ? 'bg-purple-100 text-purple-800' :
                      viewData.tier === 'GOLD' ? 'bg-amber-100 text-amber-800' :
                        viewData.tier === 'SILVER' ? 'bg-slate-100 text-slate-800' :
                          'bg-orange-50 text-orange-800'}`}>
                    {viewData.tier}
                  </span>
                </div>
                {viewData.logoUrl && (
                  <div>
                    <span className="text-sm text-slate-500">Logo:</span>
                    <a href={viewData.logoUrl} target="_blank" className="ml-2 text-indigo-600 hover:underline text-sm">View Logo</a>
                  </div>
                )}
                {viewData.website && (
                  <div>
                    <span className="text-sm text-slate-500">Website:</span>
                    <a href={viewData.website} target="_blank" className="ml-2 text-indigo-600 hover:underline text-sm">{viewData.website}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            {viewData.contactData && Object.keys(viewData.contactData).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  {(viewData.contactData as any).contactName && (
                    <div><span className="text-slate-500">Name:</span> <span className="ml-2 font-medium">{(viewData.contactData as any).contactName}</span></div>
                  )}
                  {(viewData.contactData as any).email && (
                    <div><span className="text-slate-500">Email:</span> <a href={`mailto:${(viewData.contactData as any).email}`} className="ml-2 text-indigo-600 hover:underline">{(viewData.contactData as any).email}</a></div>
                  )}
                  {(viewData.contactData as any).phone && (
                    <div><span className="text-slate-500">Phone:</span> <a href={`tel:${(viewData.contactData as any).phone}`} className="ml-2 text-indigo-600 hover:underline">{(viewData.contactData as any).phone}</a></div>
                  )}
                  {(viewData.contactData as any).designation && (
                    <div><span className="text-slate-500">Designation:</span> <span className="ml-2">{(viewData.contactData as any).designation}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Information */}
            {viewData.paymentData && Object.keys(viewData.paymentData).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  {(viewData.paymentData as any).amount && (
                    <div><span className="text-slate-500">Amount:</span> <span className="ml-2 font-bold text-green-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number((viewData.paymentData as any).amount))}</span></div>
                  )}
                  {(viewData.paymentData as any).amountPaid && (
                    <div><span className="text-slate-500">Amount Paid:</span> <span className="ml-2">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number((viewData.paymentData as any).amountPaid))}</span></div>
                  )}
                  {(viewData.paymentData as any).paymentMode && (
                    <div><span className="text-slate-500">Payment Mode:</span> <span className="ml-2">{(viewData.paymentData as any).paymentMode}</span></div>
                  )}
                  {(viewData.paymentData as any).paymentStatus && (
                    <div><span className="text-slate-500">Payment Status:</span> <span className="ml-2 font-medium">{(viewData.paymentData as any).paymentStatus}</span></div>
                  )}
                  {(viewData.paymentData as any).paymentDueDate && (
                    <div><span className="text-slate-500">Due Date:</span> <span className="ml-2">{new Date((viewData.paymentData as any).paymentDueDate).toLocaleDateString()}</span></div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={() => { setEditData(viewData); setViewState('FORM') }}>
              <Edit2 className="w-4 h-4 mr-2" /> Edit Sponsor
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(viewData.id!)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Sponsor
            </Button>
          </div>
        </div>
```

**Where to Add**: After the `</SponsorForm>` closing tag, before the list view section.

---

## Feature 4: Vendor Payment Page

**Create New File**: `/apps/web/app/events/[id]/vendors/pay/[vendorId]/page.tsx`

**Full Code**:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

interface Vendor {
  id: string
  name: string
  category: string
  contractAmount: number
  paidAmount: number
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  accountHolderName?: string
  upiId?: string
}

export default function VendorPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendor()
  }, [])

  const fetchVendor = async () => {
    try {
      const res = await fetch(`/api/events/${params.id}/vendors`)
      const data = await res.json()
      const foundVendor = data.vendors?.find((v: Vendor) => v.id === params.vendorId)
      setVendor(foundVendor || null)
    } catch (error) {
      console.error('Failed to fetch vendor:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!vendor) {
    return <div className="p-8 text-center">Vendor not found</div>
  }

  const remainingAmount = (vendor.contractAmount || 0) - (vendor.paidAmount || 0)

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Button variant="ghost" onClick={() => router.push(`/events/${params.id}/vendors`)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Vendors
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Vendor Payment - {vendor.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Contract Amount:</span>
                <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(vendor.contractAmount)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid Amount:</span>
                <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(vendor.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-red-600 border-t pt-2">
                <span>Remaining Amount:</span>
                <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(remainingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {(vendor.bankName || vendor.accountNumber || vendor.upiId) && (
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="text-lg font-semibold mb-4 text-green-800">🏦 Vendor Bank Details</h3>
              <div className="space-y-2 text-sm">
                {vendor.bankName && (
                  <div><span className="text-gray-600">Bank Name:</span> <span className="ml-2 font-semibold">{vendor.bankName}</span></div>
                )}
                {vendor.accountHolderName && (
                  <div><span className="text-gray-600">Account Holder:</span> <span className="ml-2 font-semibold">{vendor.accountHolderName}</span></div>
                )}
                {vendor.accountNumber && (
                  <div><span className="text-gray-600">Account Number:</span> <span className="ml-2 font-mono font-semibold">{vendor.accountNumber}</span></div>
                )}
                {vendor.ifscCode && (
                  <div><span className="text-gray-600">IFSC Code:</span> <span className="ml-2 font-mono font-semibold">{vendor.ifscCode}</span></div>
                )}
                {vendor.upiId && (
                  <div><span className="text-gray-600">UPI ID:</span> <span className="ml-2 font-mono font-semibold">{vendor.upiId}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button className="flex-1" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Mark as Paid
            </Button>
            <Button variant="outline" className="flex-1" size="lg">
              Record Partial Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Feature 5: Event Team Invitation Flow

This is the most complex feature. Due to its size, I'll create a separate implementation guide file.

**See**: `EVENT_TEAM_INVITATION_IMPLEMENTATION.md` (will be created next)

---

## Quick Implementation Checklist

- [x] Feature 1: Sponsor Amount Field - **DEPLOYED** ✅
- [ ] Feature 2: Vendor Bank Details Form - **Code provided above**
- [ ] Feature 3: Sponsor View Dialog - **Code provided above**
- [ ] Feature 4: Vendor Payment Page - **Code provided above**
- [ ] Feature 5: Event Team Invitations - **See separate guide**

---

## How to Implement

1. **Feature 2**: Copy the bank details code and paste it in the vendor form after line 555
2. **Feature 3**: Copy the view dialog code and paste it in the sponsors page after line 140
3. **Feature 4**: Create the new file and paste the payment page code
4. **Feature 5**: Follow the separate implementation guide (complex, multi-step)

After adding each feature, commit and push to deploy!
