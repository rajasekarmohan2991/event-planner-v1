'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserRole } from '@/types/user'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { PageTransition } from '@/components/page-transition'
import { LoadingSpinner } from '@/components/loading'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import FeedButton from '@/components/FeedButton'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      const userRole = session?.user?.role as string
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER']
      if (!allowedRoles.includes(userRole)) {
        router.push('/dashboard')
      }
    }
  }, [session, status, router])

  if (!mounted || status === 'loading') {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
      {/* Sidebar - fixed positioning */}
      <AdminSidebar />
      
      {/* Main Content - dynamically adjusts to sidebar width */}
      <main className={`flex-1 transition-all duration-300 min-h-[calc(100vh-4rem)] ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <div className="min-h-[calc(100vh-4rem)] bg-white/60 backdrop-blur-sm">
          <PageTransition>
            <div className="p-3 lg:p-4 xl:p-6 max-w-full">
              {children}
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  )
}
