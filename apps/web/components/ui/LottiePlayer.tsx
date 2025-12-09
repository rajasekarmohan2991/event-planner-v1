'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { usePathname } from 'next/navigation'

interface LottiePlayerProps {
  animationPath: string
  className?: string
  loop?: boolean
  autoplay?: boolean
  style?: React.CSSProperties
}

export function LottiePlayer({
  animationPath,
  className = '',
  loop = true,
  autoplay = true,
  style = { width: '100%', height: '100%' },
}: LottiePlayerProps) {
  const [animationData, setAnimationData] = useState(null)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        // Extract the animation filename from the path
        const animationFile = animationPath.split('/').pop()
        if (!animationFile) {
          throw new Error('Invalid animation path')
        }
        
        // Use the optimized static file path
        const response = await fetch(`/animations/${animationFile}`)
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.statusText}`)
        }
        
        const data = await response.json()
        setAnimationData(data)
        setError(null)
      } catch (err) {
        console.error('Error loading animation:', err)
        // Fallback to direct file access if the optimized path fails
        try {
          const animationFile = animationPath.split('/').pop()
          const fallbackResponse = await fetch(`/animations/${animationFile}`)
          if (!fallbackResponse.ok) throw new Error('Fallback failed')
          const data = await fallbackResponse.json()
          setAnimationData(data)
          setError(null)
        } catch (fallbackErr) {
          console.error('Fallback animation load failed:', fallbackErr)
          setError('Failed to load animation')
        }
      }
    }

    loadAnimation()
  }, [animationPath, pathname]) // Add pathname to refetch on route change

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center`} style={style}>
        <span className="text-sm text-gray-500">{error}</span>
      </div>
    )
  }

  if (!animationData) {
    return <div className={className} style={style} />
  }

  return (
    <Lottie 
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  )
}

export default LottiePlayer
