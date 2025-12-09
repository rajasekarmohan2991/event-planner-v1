import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { UserRole } from '@/types/user'
import { OrganizerSidebar } from '@/components/organizer/sidebar'

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role

  // Redirect to dashboard if not an organizer or admin
  const allowedRoles = ['ORGANIZER', 'ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER']
  if (!session?.user || !allowedRoles.includes(userRole as string)) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <OrganizerSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
