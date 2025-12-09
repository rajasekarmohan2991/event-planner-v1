import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function OrganizerSidebar() {
  const pathname = usePathname()
  
  const navItems = [
    {
      name: 'Dashboard',
      href: '/organizer/dashboard',
      icon: '📊',
    },
    {
      name: 'Events',
      href: '/organizer/events',
      icon: '🎉',
    },
    {
      name: 'Attendees',
      href: '/organizer/attendees',
      icon: '👥',
    },
    {
      name: 'Analytics',
      href: '/organizer/analytics',
      icon: '📈',
    },
    {
      name: 'Settings',
      href: '/organizer/settings',
      icon: '⚙️',
    },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Event Organizer</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center px-4 py-2 text-sm font-medium rounded-md',
              pathname === item.href
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        {/* Add user profile or sign out button here */}
      </div>
    </div>
  )
}
