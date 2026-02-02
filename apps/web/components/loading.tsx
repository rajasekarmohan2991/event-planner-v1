import React from 'react'

export function LoadingSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg', message?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600`} />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  )
}

export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" message={message} />
    </div>
  )
}

export function TableLoader({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  )
}

export function CardLoader() {
  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-6">
      <div className="h-6 w-1/3 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
    </div>
  )
}

export default LoadingSpinner
