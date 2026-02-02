'use client'

import { useRef, useEffect } from 'react'
import lottie, { AnimationItem } from 'lottie-web'
import { cn } from '@/lib/utils'

interface LottieAnimationProps {
  animationData: any
  className?: string
  loop?: boolean
  autoplay?: boolean
  speed?: number
  style?: React.CSSProperties
}

const LottieAnimation = ({
  animationData,
  className,
  loop = true,
  autoplay = true,
  speed = 1,
  style,
  ...props
}: LottieAnimationProps) => {
  const animationContainer = useRef<HTMLDivElement>(null)
  const animationInstance = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (animationContainer.current) {
      // Clear previous animation if it exists
      if (animationInstance.current) {
        animationInstance.current.destroy()
      }

      // Initialize animation
      animationInstance.current = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: 'svg',
        loop,
        autoplay,
        animationData,
      })

      // Set animation speed
      animationInstance.current.setSpeed(speed)

      // Clean up on unmount
      return () => {
        if (animationInstance.current) {
          animationInstance.current.destroy()
        }
      }
    }
  }, [animationData, loop, autoplay, speed])

  return (
    <div
      ref={animationContainer}
      className={cn('w-full h-full', className)}
      style={style}
      {...props}
    />
  )
}

export default LottieAnimation
