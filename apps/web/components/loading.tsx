'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <motion.div
        className="relative h-12 w-auto"
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Image
          src="/logo.png"
          alt="Loading..."
          width={150}
          height={50}
          className="h-full w-auto object-contain"
          priority
        />
      </motion.div>
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="relative h-16 w-auto mb-4"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/logo.png"
            alt="Loading..."
            width={200}
            height={66}
            className="h-full w-auto object-contain"
            priority
          />
        </motion.div>
        <p className="text-gray-500 font-medium">Loading...</p>
      </motion.div>
    </div>
  )
}
