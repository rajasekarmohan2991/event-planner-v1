'use client'

import Image from 'next/image'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({ message = 'Loading...', fullScreen = true }: LoadingScreenProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Image
              src="/ayphen-logo.png"
              alt="Ayphen"
              width={96}
              height={96}
              className="animate-pulse"
              priority
            />
          </div>
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <Image
            src="/ayphen-logo.png"
            alt="Ayphen"
            width={64}
            height={64}
            className="animate-pulse"
          />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-red-500 mx-auto mb-3"></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  )
}
