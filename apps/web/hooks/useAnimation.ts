'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import AnimationManager, { AnimationConfig, UserRole, AnimationContext } from '@/lib/animations/AnimationManager'

interface UseAnimationOptions {
  context: AnimationContext
  animationId?: string
  preload?: boolean
  fallbackRole?: UserRole
}

interface UseAnimationReturn {
  animation: AnimationConfig | null
  loading: boolean
  error: string | null
  reload: () => void
  preloadAnimation: (id: string) => Promise<void>
  getAllAnimations: () => AnimationConfig[]
  searchAnimations: (query: string) => AnimationConfig[]
}

export function useAnimation({
  context,
  animationId,
  preload = true,
  fallbackRole = 'USER'
}: UseAnimationOptions): UseAnimationReturn {
  const { data: session } = useSession()
  const [animation, setAnimation] = useState<AnimationConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const animationManager = AnimationManager.getInstance()
  const userRole = (session?.user?.role as UserRole) || fallbackRole

  const loadAnimation = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let config: AnimationConfig | undefined

      if (animationId) {
        config = animationManager.getAnimation(animationId)
        if (!config) {
          throw new Error(`Animation with ID "${animationId}" not found`)
        }
      } else {
        config = animationManager.getBestAnimation(userRole, context)
        if (!config) {
          // Try fallback role if no animation found for current role
          config = animationManager.getBestAnimation(fallbackRole, context)
        }
      }

      if (!config) {
        throw new Error(`No animation available for context "${context}"`)
      }

      // Check if animation is allowed for current user role
      if (!config.roles.includes(userRole) && !config.roles.includes(fallbackRole)) {
        throw new Error(`Animation not available for role "${userRole}"`)
      }

      setAnimation(config)

      // Preload if requested
      if (preload && config.type === 'lottie') {
        await animationManager.preloadAnimation(config.id)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading animation'
      setError(errorMessage)
      console.warn('Animation loading error:', errorMessage)
    } finally {
      setLoading(false)
    }
  }, [animationId, context, userRole, fallbackRole, preload, animationManager])

  const reload = useCallback(() => {
    loadAnimation()
  }, [loadAnimation])

  const preloadAnimationById = useCallback(async (id: string) => {
    await animationManager.preloadAnimation(id)
  }, [animationManager])

  const getAllAnimations = useCallback(() => {
    return animationManager.getAllAnimations()
  }, [animationManager])

  const searchAnimations = useCallback((query: string) => {
    return animationManager.searchAnimations(query)
  }, [animationManager])

  useEffect(() => {
    loadAnimation()
  }, [loadAnimation])

  return {
    animation,
    loading,
    error,
    reload,
    preloadAnimation: preloadAnimationById,
    getAllAnimations,
    searchAnimations
  }
}

export default useAnimation
