'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const POPULAR_CITIES = [
  { name: 'Mumbai', icon: '🏛️' },
  { name: 'Bangalore', icon: '🕌' },
  { name: 'Delhi', icon: '🏛️' },
  { name: 'Pune', icon: '🏛️' },
  { name: 'Navi Mumbai', icon: '🏛️' },
  { name: 'Hyderabad', icon: '🕌' },
  { name: 'Ahmedabad', icon: '🕌' },
  { name: 'Chennai', icon: '🕌' },
  { name: 'Kolkata', icon: '🕌' },
  { name: 'Chandigarh', icon: '✈️' },
]

interface CitySelectionModalProps {
  open: boolean
  onClose: () => void
  onCitySelected: (city: string) => void
}

export default function CitySelectionModal({ open, onClose, onCitySelected }: CitySelectionModalProps) {
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const toggleCity = (cityName: string) => {
    setSelectedCities(prev => 
      prev.includes(cityName) 
        ? prev.filter(c => c !== cityName)
        : [...prev, cityName]
    )
  }

  const handleSave = async () => {
    if (selectedCities.length === 0) {
      toast({ title: 'Please select at least one city', variant: 'destructive' as any })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/user/city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cities: selectedCities })
      })

      if (res.ok) {
        toast({ title: 'City preferences saved!' })
        onCitySelected(selectedCities[0])
        onClose()
      } else {
        toast({ title: 'Failed to save city', variant: 'destructive' as any })
      }
    } catch (error) {
      toast({ title: 'Network error', variant: 'destructive' as any })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Select your City</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="relative">
            <div className="flex items-center gap-2 p-3 border-2 border-gray-200 rounded-lg bg-white flex-wrap">
              {selectedCities.map(city => (
                <span key={city} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                  {city}
                  <button onClick={() => toggleCity(city)} className="hover:text-indigo-900">×</button>
                </span>
              ))}
              {selectedCities.length === 0 && (
                <span className="text-gray-400 text-sm">Select cities from below</span>
              )}
            </div>
          </div>

          <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
            <MapPin className="h-5 w-5" />
            Detect my location
          </button>

          <div>
            <h3 className="text-lg font-semibold mb-4">Popular Cities</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {POPULAR_CITIES.map(city => (
                <button
                  key={city.name}
                  onClick={() => toggleCity(city.name)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedCities.includes(city.name)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-4xl">{city.icon}</div>
                  <div className="text-sm font-medium text-gray-700">{city.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || selectedCities.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
