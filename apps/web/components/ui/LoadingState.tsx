'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import LottieAnimation from '@/components/LottieAnimation'
import { useLottieAnimation } from '@/hooks/useLottieAnimation'
import { getAnimation } from '@/data/animations'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <motion.div
        className="relative h-16 w-auto mb-4"
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
      <motion.p
        className="mt-4 text-sm font-medium text-slate-600"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
    </motion.div>
  )
}

export function ErrorState({ message = 'Something went wrong', onRetry, className = '' }: { message?: string, onRetry?: () => void, className?: string }) {
  const errorAnim = getAnimation('error')
  const { animationData } = useLottieAnimation(errorAnim?.url)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <div className="relative h-24 w-24">
        {animationData ? (
          <LottieAnimation
            animationData={animationData}
            loop={false}
            autoplay={true}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-red-100 text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )}
      </div>
      <motion.p
        className="mt-4 text-center text-sm font-medium text-slate-600"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
      {onRetry && (
        <motion.button
          onClick={onRetry}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Try Again
        </motion.button>
      )}
    </motion.div>
  )
}
