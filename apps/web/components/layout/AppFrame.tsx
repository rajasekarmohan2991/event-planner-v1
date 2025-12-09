"use client"

import { usePathname } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/toaster'
import { SidebarProvider } from '@/contexts/SidebarContext'

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  
  // Wrap entire application with SidebarProvider to manage sidebar state globally
  return (
    <SidebarProvider>
      <AppShell>{children}</AppShell>
      <Toaster />
    </SidebarProvider>
  )
}
