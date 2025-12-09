'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

type PageTransitionProps = {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
