'use client'

import { useEffect, useRef } from 'react'
import lottie, { AnimationItem } from 'lottie-web'

interface LottieAnimationProps {
  animationData?: any
  animationUrl?: string
  loop?: boolean
  autoplay?: boolean
  className?: string
  style?: React.CSSProperties
}

export function LottieAnimation({
  animationData,
  animationUrl,
  loop = true,
  autoplay = true,
  className = '',
  style = {}
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // If we have animation data directly
    if (animationData) {
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        animationData
      })
    }
    // If we have a URL to fetch animation from
    else if (animationUrl) {
      fetch(animationUrl)
        .then(res => res.json())
        .then(data => {
          if (containerRef.current && !animationRef.current) {
            animationRef.current = lottie.loadAnimation({
              container: containerRef.current,
              renderer: 'svg',
              loop,
              autoplay,
              animationData: data
            })
          }
        })
        .catch(err => console.error('Failed to load animation:', err))
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy()
        animationRef.current = null
      }
    }
  }, [animationData, animationUrl, loop, autoplay])

  return <div ref={containerRef} className={className} style={style} />
}

// Pre-built animation components for common use cases
export function LoadingAnimation({ className = 'w-32 h-32' }: { className?: string }) {
  return (
    <LottieAnimation
      animationUrl="/animations/loading.json"
      className={className}
    />
  )
}

export function SuccessAnimation({ className = 'w-32 h-32' }: { className?: string }) {
  return (
    <LottieAnimation
      animationUrl="/animations/success.json"
      loop={false}
      className={className}
    />
  )
}

export function ErrorAnimation({ className = 'w-32 h-32' }: { className?: string }) {
  return (
    <LottieAnimation
      animationUrl="/animations/loading.json"
      loop={false}
      className={className}
    />
  )
}

export function EmptyStateAnimation({ className = 'w-64 h-64' }: { className?: string }) {
  return (
    <LottieAnimation
      animationUrl="/animations/loading.json"
      className={className}
    />
  )
}

export function PeopleAnimation({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <LottieAnimation
      animationUrl="/animations/login.json"
      className={className}
    />
  )
}
