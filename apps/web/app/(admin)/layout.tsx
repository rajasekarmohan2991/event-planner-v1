'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { PageTransition } from '@/components/page-transition'
import { LoadingSpinner } from '@/components/loading'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

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

  if (status === 'loading') {
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
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - fixed positioning */}
      <AdminSidebar />

      {/* Main Content - dynamically adjusts to sidebar width */}
      <main className={`flex-1 transition-all duration-300 min-h-screen pt-16 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
        <div className="min-h-screen">
          <PageTransition>
            <div className="p-4 lg:p-6 xl:p-8 max-w-full">
              {children}
            </div>
          </PageTransition>
        </div>
      </main>
    </div>
  )
}
