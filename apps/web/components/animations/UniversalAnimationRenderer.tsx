'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LottieAnimation from '@/components/ui/LottieAnimation'
import AnimationManager, { AnimationConfig, AnimationType, UserRole, AnimationContext } from '@/lib/animations/AnimationManager'
import { Loader2, AlertCircle } from 'lucide-react'

interface UniversalAnimationRendererProps {
  role: UserRole
  context: AnimationContext
  animationId?: string
  className?: string
  fallback?: React.ReactNode
  onLoad?: () => void
  onError?: (error: Error) => void
  style?: React.CSSProperties
}

export function UniversalAnimationRenderer({
  role,
  context,
  animationId,
  className = '',
  fallback,
  onLoad,
  onError,
  style
}: UniversalAnimationRendererProps) {
  const [config, setConfig] = useState<AnimationConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animationData, setAnimationData] = useState<any>(null)

  const animationManager = AnimationManager.getInstance()

  const loadAnimation = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let animationConfig: AnimationConfig | undefined

      if (animationId) {
        animationConfig = animationManager.getAnimation(animationId)
      } else {
        animationConfig = animationManager.getBestAnimation(role, context)
      }

      if (!animationConfig) {
        throw new Error(`No animation found for role: ${role}, context: ${context}`)
      }

      setConfig(animationConfig)

      // Preload animation data if it's a Lottie
      if (animationConfig.type === 'lottie') {
        const cached = animationManager.getCachedAnimation(animationConfig.id)
        if (cached) {
          setAnimationData(cached)
        } else {
          await animationManager.preloadAnimation(animationConfig.id)
          const preloaded = animationManager.getCachedAnimation(animationConfig.id)
          setAnimationData(preloaded)
        }
      }

      onLoad?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown animation error')
      setError(error.message)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [role, context, animationId, animationManager, onLoad, onError])

  useEffect(() => {
    loadAnimation()
  }, [loadAnimation])

  const renderAnimation = () => {
    if (!config) return null

    const combinedClassName = `${config.settings.className || ''} ${className}`.trim()
    const combinedStyle = {
      width: config.settings.width,
      height: config.settings.height,
      ...style
    }

    switch (config.type) {
      case 'lottie':
        return (
          <LottieAnimation
            src={config.src}
            animationData={animationData}
            className={combinedClassName}
            style={combinedStyle}
            loop={config.settings.loop}
            autoplay={config.settings.autoplay}
            speed={config.settings.speed}
            fallback={renderFallback()}
          />
        )

      case 'gif':
        return (
          <motion.img
            src={config.src}
            alt={config.name}
            className={combinedClassName}
            style={combinedStyle}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onError={() => setError('Failed to load GIF animation')}
          />
        )

      case 'video':
        return (
          <motion.video
            src={config.src}
            className={combinedClassName}
            style={combinedStyle}
            loop={config.settings.loop}
            autoPlay={config.settings.autoplay}
            muted
            playsInline
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onError={() => setError('Failed to load video animation')}
          />
        )

      case 'svg':
        return (
          <motion.div
            className={combinedClassName}
            style={combinedStyle}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            dangerouslySetInnerHTML={{ __html: config.src }}
          />
        )

      default:
        return renderFallback()
    }
  }

  const renderFallback = () => {
    if (fallback) return fallback

    // Default fallback based on context
    const getFallbackIcon = () => {
      switch (context) {
        case 'loading':
          return <Loader2 className="h-8 w-8 animate-spin text-primary" />
        case 'error':
          return <AlertCircle className="h-8 w-8 text-red-500" />
        case 'success':
          return <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">✓</div>
        default:
          return <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
      }
    }

    return (
      <motion.div
        className="flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {getFallbackIcon()}
      </motion.div>
    )
  }

  const renderError = () => (
    <motion.div
      className="flex flex-col items-center justify-center p-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
      <p className="text-sm text-red-600">{error}</p>
      <button
        onClick={loadAnimation}
        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Retry
      </button>
    </motion.div>
  )

  const renderLoading = () => (
    <motion.div
      className="flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </motion.div>
  )

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" exit={{ opacity: 0 }}>
          {renderLoading()}
        </motion.div>
      ) : error ? (
        <motion.div key="error" exit={{ opacity: 0 }}>
          {renderError()}
        </motion.div>
      ) : (
        <motion.div key="animation" exit={{ opacity: 0 }}>
          {renderAnimation()}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default UniversalAnimationRenderer
