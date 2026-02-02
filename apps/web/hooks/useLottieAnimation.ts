'use client'

import { useState, useEffect } from 'react'

// Simple in-memory cache for animations
const animationCache = new Map()

export function useLottieAnimation(url: string) {
  const [animationData, setAnimationData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!url) return

    // Return cached animation if available
    if (animationCache.has(url)) {
      setAnimationData(animationCache.get(url))
      return
    }

    // Skip if already loading
    if (isLoading) return

    const fetchAnimation = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch animation: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Cache the animation data
        animationCache.set(url, data)
        setAnimationData(data)
      } catch (err) {
        console.error('Error loading Lottie animation:', err)
        setError(err instanceof Error ? err : new Error('Failed to load animation'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnimation()
  }, [url, isLoading])

  return { animationData, isLoading, error }
}
