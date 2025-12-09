'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...',
  className
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-8 h-8 text-primary" />
            </motion.div>
            {message && (
              <p className="text-sm font-medium text-muted-foreground">
                {message}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
