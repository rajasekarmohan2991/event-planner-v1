'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Handle route changes
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true)
      setIsAnimating(true)
    }

    const handleComplete = () => {
      setIsLoading(false)
      // Add a small delay to allow the exit animation to complete
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 300)
      return () => clearTimeout(timer)
    }

    // Simulate loading state for demo purposes
    // In a real app, you'd connect this to your actual data loading state
    handleStart()
    const timer = setTimeout(handleComplete, 500) // Simulate 500ms loading time
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  // Optional: Handle browser back/forward buttons
  useEffect(() => {
    window.onpopstate = () => {
      setIsLoading(true)
    }
  }, [])

  return {
    isLoading,
    isAnimating,
    // Helper function for manual loading states
    withLoading: async <T,>(promise: Promise<T>): Promise<T> => {
      setIsLoading(true)
      try {
        return await promise
      } finally {
        setIsLoading(false)
      }
    },
  }
}
