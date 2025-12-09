'use client'

import { MotionConfig } from 'framer-motion'
import { ReactNode, useEffect, useState } from 'react'

export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState<boolean>(false)
  
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    // Set initial value
    setReduced(mediaQuery.matches)
    
    // Handle changes to the media query
    const handleChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches)
    }
    
    // Add event listener
    mediaQuery.addEventListener('change', handleChange)
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])
  
  return (
    <MotionConfig
      reducedMotion={reduced ? 'always' : 'user'}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 125,
        mass: 1,
      }}
    >
      {children}
    </MotionConfig>
  )
}
