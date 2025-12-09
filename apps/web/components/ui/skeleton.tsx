'use client'

import { cn } from "@/lib/utils"
import { motion, Variants } from 'framer-motion'
import { forwardRef } from 'react'

const skeletonVariants: Variants = {
  initial: {
    opacity: 0.6,
    scale: 1,
  },
  animate: {
    opacity: 0.8,
    scale: 1.01,
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut'
    }
  }
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circle' | 'text' | 'card'
  isAnimated?: boolean
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', isAnimated = true, ...props }, ref) => {
    const baseClassName = cn(
      "relative overflow-hidden rounded-md bg-muted/70 dark:bg-muted/30",
      {
        'animate-pulse': !isAnimated,
        'rounded-full': variant === 'circle',
        'h-4': variant === 'text',
        'rounded-lg p-6': variant === 'card',
      },
      className
    )
    
    if (!isAnimated) {
      return <div ref={ref} className={baseClassName} {...props} />
    }
    
    return (
      <motion.div
        ref={ref}
        className={baseClassName}
        variants={skeletonVariants}
        initial="initial"
        animate="animate"
      >
        {/* Shimmer sweep overlay */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/20 opacity-80 mix-blend-overlay"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
        />
        {props.children}
      </motion.div>
    )
  }
)

Skeleton.displayName = 'Skeleton'

// Skeleton group for loading states
function SkeletonGroup({
  count = 3,
  className,
  itemClassName,
  variant = 'default',
  isAnimated = true,
  ...props
}: { 
  count?: number; 
  itemClassName?: string;
} & Omit<SkeletonProps, 'children'>) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={itemClassName} 
          variant={variant}
          isAnimated={isAnimated}
          {...props}
        />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonGroup }
