'use client'

import { ReactNode } from 'react'

type PageTransitionProps = {
  children: ReactNode
  className?: string
}

// Disabled animations for better performance
// Was adding 300-500ms delay to every page load
export function PageTransition({ children, className }: PageTransitionProps) {
  return <div className={className}>{children}</div>
}
