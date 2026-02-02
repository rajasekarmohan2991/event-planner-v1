import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { UserRole } from '@/types/user'
import { UserSidebar } from '@/components/user/sidebar'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role

  // Redirect to unauthorized if not a regular user or higher
  if (!userRole) {
    redirect('/auth/signin')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <UserSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
