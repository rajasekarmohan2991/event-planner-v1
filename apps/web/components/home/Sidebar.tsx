"use client"

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Home, Settings, UserCircle, LogOut } from 'lucide-react'

export default function Sidebar() {
  const { data: session, status } = useSession()
  const user = session?.user

  const initials = String(user?.name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="w-64 border-r bg-white/80 backdrop-blur-sm shadow-sm flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col">
        <nav className="px-2 space-y-1 text-sm">
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-50 text-rose-700 font-bold transition-all shadow-sm">
            <Home className="h-5 w-5"/>
            Events
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors font-medium">
            <UserCircle className="h-5 w-5"/>
            Attendee Profiles
          </Link>
        </nav>
        <div className="mt-3 p-3 border-t">
          <div className="border rounded-lg p-3 bg-white/70">
            <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"/> Profile
            </div>
            {status === 'authenticated' && user ? (
              <div className="space-y-2">
                <Link href="/profile" className="flex items-center gap-3 group">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={(user as any).image || ''} alt={user.name || user.email || ''} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate group-hover:underline">
                      {user.name || user.email}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-600">
                <span className="opacity-80">You are not signed in.</span>{' '}
                <Link href="/auth/login" className="font-medium text-indigo-700 hover:underline">Sign in</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
