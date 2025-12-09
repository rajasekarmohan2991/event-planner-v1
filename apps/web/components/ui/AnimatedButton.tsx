'use client'

import { forwardRef } from 'react'
import { motion, MotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import LottieAnimation from '@/components/LottieAnimation'
import { useLottieAnimation } from '@/hooks/useLottieAnimation'
import { getAnimation } from '@/data/animations'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white hover:bg-slate-700 focus:ring-slate-400',
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400',
        outline: 'border border-slate-200 bg-white hover:bg-slate-50 focus:ring-slate-400',
        ghost: 'hover:bg-slate-100 focus:ring-slate-400',
        link: 'underline-offset-4 hover:underline text-slate-900 hover:bg-transparent',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
  iconSize?: number
  animationOnHover?: string
}

const AnimatedButton = forwardRef<HTMLButtonElement, ButtonProps & MotionProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      icon,
      iconPosition = 'left',
      iconSize = 16,
      animationOnHover,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const iconAnim = icon ? getAnimation(icon) : null
    const hoverAnim = animationOnHover ? getAnimation(animationOnHover) : null
    const loadingAnim = getAnimation('loading')
    
    const { animationData: iconData } = useLottieAnimation(iconAnim?.url)
    const { animationData: hoverData } = useLottieAnimation(hoverAnim?.url)
    const { animationData: loadingData } = useLottieAnimation(loadingAnim?.url)

    const showIcon = (loading || icon) && !hoverData
    const showHoverIcon = hoverData && !loading

    return (
      <motion.button
        className={cn(
          buttonVariants({ variant, size, className }),
          'relative overflow-hidden',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        ref={ref}
        disabled={disabled || loading}
        whileHover={!disabled ? { scale: 1.03 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        {...props}
      >
        {loading && loadingData && (
          <span className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="h-5 w-5">
              <LottieAnimation
                animationData={loadingData}
                loop={true}
                autoplay={true}
                className="h-full w-full"
              />
            </div>
          </span>
        )}

        <span
          className={cn(
            'flex items-center gap-2',
            loading && 'invisible',
            iconPosition === 'right' && 'flex-row-reverse'
          )}
        >
          {showIcon && iconData && (
            <div className="flex-shrink-0" style={{ width: iconSize, height: iconSize }}>
              <LottieAnimation
                animationData={iconData}
                loop={true}
                autoplay={true}
                className="h-full w-full"
              />
            </div>
          )}
          {children}
        </span>

        {showHoverIcon && hoverData && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-5/6 w-5/6">
              <LottieAnimation
                animationData={hoverData}
                loop={true}
                autoplay={false}
                className="h-full w-full"
              />
            </div>
          </div>
        )}
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

export { AnimatedButton, buttonVariants }

// Example usage:
/*
<AnimatedButton 
  variant="primary" 
  icon="ui.search"
  animationOnHover="ui.location"
>
  Find Events
</AnimatedButton>
*/
