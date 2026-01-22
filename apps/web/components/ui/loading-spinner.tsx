import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        {/* Logo with pulse animation */}
        <div className="absolute inset-0 animate-pulse">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Pink circle background */}
            <circle cx="100" cy="100" r="95" fill="#E91E63" />
            
            {/* White 'a' letter */}
            <path
              d="M 70 60 Q 100 40, 130 60 L 130 140 L 110 140 L 110 100 Q 110 80, 100 80 Q 90 80, 90 100 L 90 140 L 70 140 Z M 110 120 L 130 120 L 130 140 L 110 140 Z"
              fill="white"
            />
            
            {/* Pink circle in center */}
            <circle cx="100" cy="100" r="20" fill="#E91E63" />
          </svg>
        </div>
        
        {/* Rotating border */}
        <div className="absolute inset-0 animate-spin">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <circle
              cx="100"
              cy="100"
              r="95"
              stroke="#E91E63"
              strokeWidth="4"
              strokeDasharray="30 10"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
        </div>
      </div>
      
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function LoadingPage({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

export function LoadingCard({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="md" text={text} />
    </div>
  )
}

export function LoadingButton({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span>{text}</span>
    </div>
  )
}
