'use client'

import { ReactNode, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import { cn } from '@/lib/utils'

const variants = {
  hidden: { opacity: 0, x: -20 },
  enter: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20
    }
  }
}

export function DashboardLayout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()

  if (!session) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween' }}
            className="fixed inset-y-0 z-50 w-64 lg:hidden"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <motion.div
            initial="hidden"
            animate="enter"
            exit="exit"
            variants={variants}
            className={cn("p-6 lg:p-8 max-w-7xl mx-auto", className)}
          >
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
