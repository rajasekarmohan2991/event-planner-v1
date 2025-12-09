'use client'

import { motion } from 'framer-motion'
import LottieAnimation from '@/components/LottieAnimation'
import { useLottieAnimation } from '@/hooks/useLottieAnimation'
import { getAnimation } from '@/data/animations'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  animationKey?: string
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  animationKey = 'emptyEvents',
  className = '',
}: EmptyStateProps) {
  const emptyAnim = getAnimation(animationKey)
  const { animationData } = useLottieAnimation(emptyAnim?.url)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="relative h-48 w-full max-w-md">
        {animationData ? (
          <LottieAnimation
            animationData={animationData}
            loop={true}
            autoplay={true}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-50">
            <svg
              className="h-16 w-16 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
      </div>
      
      <div className="mt-6 max-w-md">
        <h3 className="text-lg font-medium text-slate-900">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </motion.div>
  )
}

// Example usage:
/*
<EmptyState
  title="No events found"
  description="There are no events matching your criteria. Try adjusting your filters or check back later."
  action={
    <button
      onClick={() => resetFilters()}
      className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Reset Filters
    </button>
  }
/>
*/
