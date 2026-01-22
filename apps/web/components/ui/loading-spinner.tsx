import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  fullScreen?: boolean
  variant?: 'default' | 'dots' | 'pulse' | 'gradient'
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
}

const dotSizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5'
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className,
  fullScreen = false,
  variant = 'gradient'
}: LoadingSpinnerProps) {
  
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  dotSizeClasses[size],
                  'rounded-full animate-bounce',
                  i === 0 ? 'bg-violet-500' : i === 1 ? 'bg-blue-500' : 'bg-emerald-500'
                )}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )
      
      case 'pulse':
        return (
          <div className={cn('relative', sizeClasses[size])}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 animate-ping opacity-75" />
            <div className="relative rounded-full bg-gradient-to-r from-violet-500 to-blue-500 h-full w-full" />
          </div>
        )
      
      case 'gradient':
      default:
        return (
          <div className={cn('relative', sizeClasses[size])}>
            {/* Outer rotating ring */}
            <svg className="animate-spin" viewBox="0 0 50 50">
              <defs>
                <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="url(#spinner-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="80 30"
              />
            </svg>
            {/* Inner pulsing dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 animate-pulse" />
            </div>
          </div>
        )
    }
  }

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      {renderSpinner()}
      {text && (
        <p className="text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function LoadingPage({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-gradient-to-br from-slate-50 to-white">
      <LoadingSpinner size="lg" text={text} variant="gradient" />
    </div>
  )
}

export function LoadingCard({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="md" text={text} variant="gradient" />
    </div>
  )
}

export function LoadingButton({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" variant="gradient" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

export function LoadingDots() {
  return <LoadingSpinner size="sm" variant="dots" />
}
