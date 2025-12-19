# 📋 Vendor Booking Feature - Complete Implementation Guide

## 🎯 Feature Overview

When adding a vendor in the "Add Vendor" form, the vendor name should immediately appear in the corresponding budget category card with status "BOOKED". Users can cancel before saving, and the category resets after save.

---

## 🏗️ Architecture

### **Flow:**
```
1. User types vendor name in form → 
2. Vendor appears in budget card with "BOOKED" status → 
3. User can cancel (removes from card) OR save (persists to DB) →
4. After save, form resets and vendor shows with "ACTIVE" status
```

---

## 📦 Backend API (Already Enhanced)

### **Endpoints Available:**

#### **1. GET /api/events/[id]/vendors**
```typescript
// Returns vendors grouped by category
Response: {
  vendors: [
    {
      id: "vendor_123",
      name: "ABC Catering",
      category: "CATERING",
      status: "ACTIVE" | "BOOKED" | "CANCELLED",
      contractAmount: 10000,
      paidAmount: 0,
      paymentStatus: "PENDING",
      ...
    }
  ],
  totals: {
    contracted: 50000,
    paid: 10000,
    pending: 40000
  }
}
```

#### **2. POST /api/events/[id]/vendors**
```typescript
// Create new vendor
Request: {
  name: "ABC Catering",
  category: "CATERING",
  contactName: "John Doe",
  contactEmail: "john@abc.com",
  contactPhone: "+1234567890",
  contractAmount: 10000,
  paymentDueDate: "2025-12-31",
  notes: "Premium package",
  status: "BOOKED" // or "ACTIVE"
}

Response: {
  message: "Vendor added",
  vendor: { id, name, category, status, ... }
}
```

#### **3. PATCH /api/events/[id]/vendors**
```typescript
// Update vendor status or payment
Request: {
  vendorId: "vendor_123",
  status: "ACTIVE" | "CANCELLED",
  paidAmount: 5000,
  notes: "Updated notes"
}
```

#### **4. DELETE /api/events/[id]/vendors**
```typescript
// Delete vendor (for cancelling before save)
Request: ?vendorId=vendor_123
```

---

## 🎨 Frontend Implementation

### **Step 1: Component Structure**

```typescript
// File: app/(admin)/events/[id]/budgets/page.tsx

'use client'

import { useState, useEffect } from 'react'

interface Vendor {
  id?: string
  name: string
  category: string
  status: 'BOOKED' | 'ACTIVE' | 'CANCELLED'
  contractAmount: number
  paidAmount?: number
  isTemporary?: boolean // For unsaved vendors
}

interface Budget {
  category: string
  budgeted: number
  spent: number
  remaining: number
  vendors: Vendor[]
}

export default function BudgetsPage({ params }: { params: { id: string } }) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [tempVendors, setTempVendors] = useState<Vendor[]>([])
  const [isAddingVendor, setIsAddingVendor] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contractAmount: 0
  })

  // ... rest of implementation below
}
```

---

### **Step 2: Fetch Budgets and Vendors**

```typescript
useEffect(() => {
  fetchBudgetsAndVendors()
}, [params.id])

const fetchBudgetsAndVendors = async () => {
  try {
    // Fetch budgets
    const budgetRes = await fetch(`/api/events/${params.id}/budgets`)
    const budgetData = await budgetRes.json()
    
    // Fetch vendors
    const vendorRes = await fetch(`/api/events/${params.id}/vendors`)
    const vendorData = await vendorRes.json()
    
    // Merge budgets with their vendors
    const mergedBudgets = budgetData.budgets.map((budget: any) => ({
      ...budget,
      vendors: vendorData.vendors.filter((v: Vendor) => 
        v.category === budget.category && v.status !== 'CANCELLED'
      )
    }))
    
    setBudgets(mergedBudgets)
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}
```

---

### **Step 3: Handle Vendor Name Input (Show BOOKED)**

```typescript
const handleVendorNameChange = (name: string) => {
  setVendorForm(prev => ({ ...prev, name }))
  
  // If name is not empty and category is selected, show as BOOKED
  if (name.trim() && selectedCategory) {
    // Check if already in temp vendors
    const existingIndex = tempVendors.findIndex(
      v => v.category === selectedCategory && v.isTemporary
    )
    
    if (existingIndex >= 0) {
      // Update existing temp vendor
      setTempVendors(prev => prev.map((v, i) => 
        i === existingIndex ? { ...v, name } : v
      ))
    } else {
      // Add new temp vendor
      setTempVendors(prev => [...prev, {
        name,
        category: selectedCategory,
        status: 'BOOKED',
        contractAmount: 0,
        isTemporary: true
      }])
    }
  }
}
```

---

### **Step 4: Display Vendors in Budget Cards**

```typescript
const BudgetCard = ({ budget }: { budget: Budget }) => {
  // Combine saved vendors and temp vendors for this category
  const allVendors = [
    ...budget.vendors,
    ...tempVendors.filter(v => v.category === budget.category)
  ]

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold text-lg">{budget.category}</h3>
      <div className="mt-2 space-y-1">
        <p className="text-sm">Budget: ₹{budget.budgeted.toLocaleString()}</p>
        <p className="text-sm">Spent: ₹{budget.spent.toLocaleString()}</p>
        <p className="text-sm font-semibold text-green-600">
          Remaining: ₹{budget.remaining.toLocaleString()}
        </p>
      </div>

      {/* Vendors List */}
      {allVendors.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-600">Vendors:</p>
          {allVendors.map((vendor, index) => (
            <div 
              key={vendor.id || `temp-${index}`}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{vendor.name}</p>
                {vendor.contractAmount > 0 && (
                  <p className="text-xs text-gray-500">
                    ₹{vendor.contractAmount.toLocaleString()}
                  </p>
                )}
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`
                  px-2 py-1 text-xs font-semibold rounded
                  ${vendor.status === 'BOOKED' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${vendor.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                  ${vendor.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                `}>
                  {vendor.status}
                </span>
                
                {/* Cancel button for temporary vendors */}
                {vendor.isTemporary && (
                  <button
                    onClick={() => handleCancelTempVendor(vendor)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### **Step 5: Handle Cancel (Before Save)**

```typescript
const handleCancelTempVendor = (vendor: Vendor) => {
  // Remove from temp vendors
  setTempVendors(prev => prev.filter(v => v !== vendor))
  
  // Clear form if this was the current vendor being added
  if (vendorForm.name === vendor.name && selectedCategory === vendor.category) {
    setVendorForm({
      name: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contractAmount: 0
    })
  }
}
```

---

### **Step 6: Handle Save Vendor**

```typescript
const handleSaveVendor = async () => {
  try {
    const response = await fetch(`/api/events/${params.id}/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: vendorForm.name,
        category: selectedCategory,
        contactName: vendorForm.contactName,
        contactEmail: vendorForm.contactEmail,
        contactPhone: vendorForm.contactPhone,
        contractAmount: vendorForm.contractAmount,
        status: 'ACTIVE' // Change from BOOKED to ACTIVE on save
      })
    })

    if (response.ok) {
      // Clear temp vendors for this category
      setTempVendors(prev => prev.filter(v => v.category !== selectedCategory))
      
      // Reset form
      setVendorForm({
        name: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        contractAmount: 0
      })
      setSelectedCategory('')
      setIsAddingVendor(false)
      
      // Refresh data
      await fetchBudgetsAndVendors()
      
      // Show success message
      alert('Vendor added successfully!')
    }
  } catch (error) {
    console.error('Failed to save vendor:', error)
    alert('Failed to save vendor')
  }
}
```

---

### **Step 7: Add Vendor Form**

```typescript
const AddVendorForm = () => (
  <div className="bg-white rounded-lg border p-6">
    <h3 className="text-lg font-semibold mb-4">Add Vendor</h3>
    
    {/* Category Selection */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Category</label>
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Select Category</option>
        <option value="CATERING">Catering</option>
        <option value="VENUE">Venue</option>
        <option value="PHOTOGRAPHY">Photography</option>
        <option value="ENTERTAINMENT">Entertainment</option>
        <option value="DECORATION">Decoration</option>
        <option value="OTHER">Other</option>
      </select>
    </div>

    {/* Vendor Name - This triggers BOOKED status */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Vendor Name *</label>
      <input
        type="text"
        value={vendorForm.name}
        onChange={(e) => handleVendorNameChange(e.target.value)}
        placeholder="Enter vendor name"
        className="w-full border rounded px-3 py-2"
        disabled={!selectedCategory}
      />
      {!selectedCategory && (
        <p className="text-xs text-gray-500 mt-1">Select a category first</p>
      )}
    </div>

    {/* Contact Details */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Contact Name</label>
      <input
        type="text"
        value={vendorForm.contactName}
        onChange={(e) => setVendorForm(prev => ({ ...prev, contactName: e.target.value }))}
        className="w-full border rounded px-3 py-2"
      />
    </div>

    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Contact Email</label>
      <input
        type="email"
        value={vendorForm.contactEmail}
        onChange={(e) => setVendorForm(prev => ({ ...prev, contactEmail: e.target.value }))}
        className="w-full border rounded px-3 py-2"
      />
    </div>

    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Contact Phone</label>
      <input
        type="tel"
        value={vendorForm.contactPhone}
        onChange={(e) => setVendorForm(prev => ({ ...prev, contactPhone: e.target.value }))}
        className="w-full border rounded px-3 py-2"
      />
    </div>

    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Contract Amount *</label>
      <input
        type="number"
        value={vendorForm.contractAmount}
        onChange={(e) => setVendorForm(prev => ({ ...prev, contractAmount: Number(e.target.value) }))}
        className="w-full border rounded px-3 py-2"
      />
    </div>

    {/* Action Buttons */}
    <div className="flex gap-2">
      <button
        onClick={handleSaveVendor}
        disabled={!vendorForm.name || !selectedCategory || vendorForm.contractAmount <= 0}
        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
      >
        Save Vendor
      </button>
      <button
        onClick={() => {
          setIsAddingVendor(false)
          handleCancelTempVendor(tempVendors.find(v => v.category === selectedCategory)!)
        }}
        className="px-4 py-2 border rounded hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </div>
)
```

---

## 🎨 Complete Component Example

```typescript
// File: app/(admin)/events/[id]/budgets/page.tsx

'use client'

import { useState, useEffect } from 'react'

export default function BudgetsPage({ params }: { params: { id: string } }) {
  const [budgets, setBudgets] = useState([])
  const [tempVendors, setTempVendors] = useState([])
  const [isAddingVendor, setIsAddingVendor] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contractAmount: 0
  })

  // All the functions from above...

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button
          onClick={() => setIsAddingVendor(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Vendor
        </button>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {budgets.map((budget) => (
          <BudgetCard key={budget.category} budget={budget} />
        ))}
      </div>

      {/* Add Vendor Form Modal/Sidebar */}
      {isAddingVendor && <AddVendorForm />}
    </div>
  )
}
```

---

## 🔄 State Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. User selects category                                │
│    selectedCategory = "CATERING"                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. User types vendor name                               │
│    vendorForm.name = "ABC Catering"                     │
│    → handleVendorNameChange() triggered                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Temp vendor added to state                           │
│    tempVendors = [{                                     │
│      name: "ABC Catering",                              │
│      category: "CATERING",                              │
│      status: "BOOKED",                                  │
│      isTemporary: true                                  │
│    }]                                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Budget card displays vendor with BOOKED status       │
│    [ABC Catering] [BOOKED] [Cancel]                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├──────────────┬──────────────────────┐
                     │              │                      │
                     ▼              ▼                      ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
          │ User clicks  │  │ User clicks  │  │ User continues   │
          │ Cancel       │  │ Save         │  │ filling form     │
          └──────┬───────┘  └──────┬───────┘  └──────────────────┘
                 │                 │
                 ▼                 ▼
      ┌──────────────────┐  ┌──────────────────────┐
      │ Remove from      │  │ POST to API          │
      │ tempVendors      │  │ status: "ACTIVE"     │
      │ Clear form       │  │ Clear tempVendors    │
      └──────────────────┘  │ Refresh data         │
                            │ Show as ACTIVE       │
                            └──────────────────────┘
```

---

## ✅ Testing Checklist

- [ ] Select category dropdown works
- [ ] Typing vendor name shows BOOKED in budget card
- [ ] BOOKED status appears immediately
- [ ] Cancel button removes vendor from card
- [ ] Cancel clears form
- [ ] Save button creates vendor in database
- [ ] After save, vendor shows with ACTIVE status
- [ ] Form resets after save
- [ ] Category resets after save
- [ ] Multiple vendors can be added to same category
- [ ] Different categories work independently
- [ ] Refresh page shows saved vendors correctly

---

## 🚀 Deployment

1. Implement the component code above
2. Test locally
3. Commit changes
4. Push to GitHub
5. Vercel auto-deploys

---

## 📝 Notes

- **Temporary vendors** are stored in component state only
- **Saved vendors** are persisted to database
- **BOOKED** = Temporary, not yet saved
- **ACTIVE** = Saved and confirmed
- **CANCELLED** = Removed/cancelled

---

## 🎯 Summary

This implementation provides:
✅ Real-time vendor display as you type
✅ BOOKED status for unsaved vendors
✅ Cancel functionality before save
✅ Form reset after save
✅ Category-based organization
✅ Clean state management
✅ Proper API integration

The backend API is already ready to support all these features!
