'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const variants = {
  hidden: { opacity: 0, x: -200, y: 0 },
  enter: { 
    opacity: 1, 
    x: 0, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      mass: 0.5,
    }
  },
  exit: { 
    opacity: 0, 
    x: 0, 
    y: -100,
    transition: {
      duration: 0.2
    }
  },
}

type PageTransitionProps = {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => window.scrollTo(0, 0)}
    >
      <motion.div
        key={pathname}
        initial="hidden"
        animate="enter"
        exit="exit"
        variants={variants}
        className="min-h-[calc(100vh-4rem)]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
