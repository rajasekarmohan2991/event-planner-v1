'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ComponentPropsWithoutRef, forwardRef } from 'react'

type MotionComponentProps<T extends keyof JSX.IntrinsicElements> = {
  as?: T
} & Omit<HTMLMotionProps<T>, 'as'>

function createMotionComponent<T extends keyof JSX.IntrinsicElements>(
  defaultComponent: T,
  defaultVariants?: Record<string, unknown>
) {
  return forwardRef<HTMLElement, MotionComponentProps<T> & ComponentPropsWithoutRef<T>>(
    function MotionComponentWrapper({ as: Component = defaultComponent, ...props }, ref) {
      // Merge default variants with any provided variants
      const variants = defaultVariants
        ? { ...defaultVariants, ...(props.variants || {}) }
        : props.variants

      // Use motion.div and cast the component type
      const MotionElement = motion.div as any

      return (
        <MotionElement
          as={Component}
          {...(props as any)}
          ref={ref}
          variants={variants}
        />
      )
    }
  )
}

// Create motion components with proper typing
export const MotionDiv = createMotionComponent('div', {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
})

export const MotionSection = createMotionComponent('section', {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
})

export const MotionButton = createMotionComponent('button', {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
})

// Re-export motion for direct usage
export { motion }
