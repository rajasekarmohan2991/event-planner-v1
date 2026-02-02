'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter address", 
  className = "" 
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Debounced search for address suggestions
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (value.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/geo/address-autocomplete?query=${encodeURIComponent(value)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.predictions || [])
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error fetching address suggestions:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value])

  const handleSelectSuggestion = async (suggestion: any) => {
    const address = suggestion.description
    onChange(address)
    setShowSuggestions(false)
    
    // Get coordinates for the selected place
    try {
      const response = await fetch(`/api/geo/place-details?placeId=${suggestion.place_id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.geometry?.location) {
          onChange(address, {
            lat: data.geometry.location.lat,
            lng: data.geometry.location.lng
          })
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id || index}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.structured_formatting?.secondary_text || ''}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
