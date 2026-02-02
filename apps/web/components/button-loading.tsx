'use client'

import { Loader2 } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ButtonLoadingProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export function ButtonLoading({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  className,
  disabled,
  ...props
}: ButtonLoadingProps) {
  return (
    <Button
      className={cn(
        'relative',
        'transition-all duration-200',
        'disabled:opacity-80',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className={cn('flex items-center justify-center', {
        'opacity-0': isLoading,
        'opacity-100': !isLoading,
      })}>
        {children}
      </span>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText && <span className="ml-2">{loadingText}</span>}
        </div>
      )}
    </Button>
  )
}
