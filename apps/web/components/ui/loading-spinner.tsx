import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
  xl: 'h-32 w-32'
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
        <Image
          src="/loading-logo.png"
          alt="Loading"
          fill
          className="object-contain mix-blend-multiply"
          priority
        />
      </div>
      {text && (
        <p className="text-base font-medium text-indigo-600">
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
    <div className="flex items-center justify-center min-h-[60vh]">
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
      <span className="text-sm">{text}</span>
    </div>
  )
}

export function LoadingDots() {
  return <LoadingSpinner size="sm" />
}
