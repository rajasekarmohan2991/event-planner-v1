"use client"
import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function EventExhibitorsPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exhibitors</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4 inline mr-2" />Add Exhibitor
        </button>
      </div>
    </div>
  )
}
