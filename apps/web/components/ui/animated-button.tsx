'use client'

import { motion, MotionProps } from 'framer-motion'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AnimatedButtonProps extends ButtonProps {
  motionProps?: MotionProps
  whileHover?: MotionProps['whileHover']
  whileTap?: MotionProps['whileTap']
}

export function AnimatedButton({
  children,
  className,
  motionProps = {},
  whileHover = { scale: 1.05 },
  whileTap = { scale: 0.95 },
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      className="inline-block"
      {...motionProps}
    >
      <Button className={cn('relative overflow-hidden', className)} {...props}>
        {children}
      </Button>
    </motion.div>
  )
}
