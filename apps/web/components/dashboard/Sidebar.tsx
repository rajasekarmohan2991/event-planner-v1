'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from 'next-auth/react'
import { 
  LayoutDashboard, 
  CalendarDays,
  Ticket,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X as CloseIcon,
  Package,
  FileText,
  DollarSign
} from 'lucide-react'

const sidebarVariants = {
  open: { 
    x: 0,
    transition: { 
      type: 'spring', 
      stiffness: 300,
      damping: 40
    }
  },
  closed: { 
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 40
    }
  }
};

interface SidebarProps {
  onClose?: () => void
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

export default function Sidebar({ onClose }: SidebarProps = {}) {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [moduleSettings, setModuleSettings] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  
  // Fetch module settings
  useEffect(() => {
    const fetchModuleSettings = async () => {
      try {
        const res = await fetch('/api/company/info')
        if (res.ok) {
          const data = await res.json()
          setModuleSettings(data)
        }
      } catch (error) {
        console.error('Failed to fetch module settings:', error)
      }
    }
    
    if (session) {
      fetchModuleSettings()
    }
  }, [session])
  
  // Check if provider modules are enabled
  const hasProviderModules = moduleSettings?.module_vendor_management || 
                             moduleSettings?.module_sponsor_management || 
                             moduleSettings?.module_exhibitor_management
  
  // Navigation items - conditionally include provider modules
  const baseNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/dashboard/events', icon: CalendarDays },
    { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
  ]
  
  const providerNavItems: NavItem[] = hasProviderModules ? [
    { name: 'Providers', href: '/providers', icon: Package },
    { name: 'Bookings', href: '/bookings', icon: FileText },
    { name: 'Commissions', href: '/commissions', icon: DollarSign },
  ] : []
  
  const settingsNavItems: NavItem[] = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]
  
  const navItems = [...baseNavItems, ...providerNavItems, ...settingsNavItems]
  
  // Toggle sidebar on mobile
  const toggleSidebar = () => setIsOpen(!isOpen)
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const sidebar = document.querySelector('.sidebar-container')
      if (isMobile && isOpen && sidebar && !sidebar.contains(target)) {
        setIsOpen(false)
      }
    }
    
    // Check if mobile on mount and resize
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }
    
    // Set initial state
    checkIfMobile()
    
    // Add event listeners
    window.addEventListener('resize', checkIfMobile)
    document.addEventListener('mousedown', handleClickOutside)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobile, isOpen])

  if (!session) return null

  return (
    <motion.aside 
      className="flex flex-col h-full bg-white border-r border-gray-200 w-64"
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      exit="closed"
      variants={sidebarVariants}
    >
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <motion.div 
          className="text-xl font-bold text-indigo-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          EventPlanner
        </motion.div>
        {isOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: {
                  delay: 0.1 * (index + 1)
                }
              }}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={item.href}
                onClick={() => onClose?.()}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'mr-3 h-5 w-5',
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                )} />
                {item.name}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          Sign out
        </Button>
      </div>
    </motion.aside>
  )
}

// Add the missing X icon component
function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  )
}
