'use client'

import { useState, useEffect } from 'react'

interface LocationData {
    city: string
    state: string
    country: string
    latitude: number
    longitude: number
}

export function useLocationDetection() {
    const [location, setLocation] = useState<LocationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        detectLocation()
    }, [])

    const detectLocation = async () => {
        console.log('📍 [LOCATION] Starting location detection...')
        setLoading(true)
        setError(null)

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            console.error('❌ [LOCATION] Geolocation not supported')
            setError('Geolocation is not supported by your browser')
            setLoading(false)
            return
        }

        try {
            // Get user's position
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords
                    console.log('📍 [LOCATION] Got coordinates:', { latitude, longitude })

                    try {
                        // Reverse geocode to get city name
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        )

                        if (response.ok) {
                            const data = await response.json()
                            console.log('📍 [LOCATION] Geocoding response:', data)

                            const locationData: LocationData = {
                                city: data.address.city || data.address.town || data.address.village || 'Unknown',
                                state: data.address.state || '',
                                country: data.address.country || '',
                                latitude,
                                longitude
                            }

                            console.log('✅ [LOCATION] Location detected:', locationData)
                            setLocation(locationData)

                            // Save to localStorage
                            localStorage.setItem('userLocation', JSON.stringify(locationData))
                        } else {
                            throw new Error('Failed to get location name')
                        }
                    } catch (geocodeError) {
                        console.error('❌ [LOCATION] Geocoding failed:', geocodeError)
                        setError('Failed to get location name')
                    }

                    setLoading(false)
                },
                (error) => {
                    console.error('❌ [LOCATION] Position error:', error)

                    // Try to get location from localStorage
                    const saved = localStorage.getItem('userLocation')
                    if (saved) {
                        console.log('📍 [LOCATION] Using saved location')
                        setLocation(JSON.parse(saved))
                    } else {
                        setError(error.message)
                    }

                    setLoading(false)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            )
        } catch (err) {
            console.error('❌ [LOCATION] Error:', err)
            setError('Failed to detect location')
            setLoading(false)
        }
    }

    const updateLocation = (newLocation: LocationData) => {
        setLocation(newLocation)
        localStorage.setItem('userLocation', JSON.stringify(newLocation))
    }

    return {
        location,
        loading,
        error,
        detectLocation,
        updateLocation
    }
}
