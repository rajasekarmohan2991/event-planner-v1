import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Calendar, Home, Settings, User, LogOut, Plus } from 'lucide-react'

export function UserSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user

  return (
    <div className="w-72 h-screen bg-gradient-to-b from-slate-50 to-white border-r border-slate-200/60 flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Event Planner
            </h1>
            {user?.role && (
              <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                {user.role.replace('_', ' ')}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Spacer - takes up all available space */}
      <div className="flex-1"></div>

      {/* Bottom Section - Settings, Profile, Sign Out */}
      <div className="p-6 pt-4 space-y-4">
        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
            pathname === '/settings'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>

        {/* User Profile Section */}
        {user && (
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {user.name || 'User'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {user.email}
                </div>
              </div>
            </div>
            
            {/* Sign Out Button */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all duration-200 border border-rose-200 hover:border-rose-300"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
