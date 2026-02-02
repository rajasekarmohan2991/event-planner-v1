'use client'

import { useState } from 'react'
import { Player, PlayerEvent } from '@lottiefiles/react-lottie-player'

interface LottieAnimationProps {
  src?: string | object
  animationData?: any
  className?: string
  style?: React.CSSProperties
  loop?: boolean
  autoplay?: boolean
  speed?: number
  onComplete?: () => void
  fallback?: React.ReactNode
}

function LottieAnimation({
  src,
  animationData,
  className = '',
  style,
  loop = true,
  autoplay = true,
  speed = 1,
  onComplete,
  fallback = null,
}: LottieAnimationProps) {
  const [error, setError] = useState(false)

  const handleEvent = (event: PlayerEvent) => {
    if (event === 'complete' && onComplete) {
      onComplete()
    }
    if (event === 'error') {
      setError(true)
    }
  }

  if (error && fallback) {
    return <>{fallback}</>
  }

  return (
    <Player
      src={animationData || src}
      loop={loop}
      autoplay={autoplay}
      speed={speed}
      onEvent={handleEvent}
      style={{ width: '100%', height: '100%', ...style }}
      className={className}
    />
  )
}

// Export both named and default
export { LottieAnimation }
export default LottieAnimation

// Predefined animations from local files
export const AuthAnimations = {
  login: '/animations/login.json',
  register: '/animations/register.json',
  success: '/animations/success.json',
  loading: '/animations/loading.json'
}
