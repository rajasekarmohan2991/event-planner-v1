'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
    if (session?.user) {
      fetch('/api/user/preferences')
        .then(res => res.json())
        .then(data => {
          if (data.sidebarCollapsed !== undefined) {
            setIsCollapsed(data.sidebarCollapsed)
          }
        })
        .catch(err => console.error('Failed to load sidebar state:', err))
    }
  }, [session])

  useEffect(() => {
    if (mounted && session?.user) {
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sidebarCollapsed: isCollapsed })
      }).catch(err => console.error('Failed to save sidebar state:', err))
    }
  }, [isCollapsed, mounted, session])

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isMobileOpen])

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
