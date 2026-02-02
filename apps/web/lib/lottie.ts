import type { AnimationItem } from 'lottie-web'
import { getAnimation } from '@/data/animations'

// In-memory cache for animation data
const animationCache = new Map<string, any>()

/**
 * Fetches and caches Lottie animation data
 */
export async function fetchLottieAnimation(url: string): Promise<any> {
  if (!url) {
    throw new Error('Animation URL is required')
  }

  // Return cached data if available
  if (animationCache.has(url)) {
    return animationCache.get(url)
  }

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch animation: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Cache the animation data
    animationCache.set(url, data)
    
    return data
  } catch (error) {
    console.error('Error loading Lottie animation:', error)
    throw error
  }
}

/**
 * Preloads Lottie animations to ensure smooth playback
 */
export async function preloadLottieAnimations(animationKeys: string[]): Promise<void> {
  const animations = animationKeys.map(key => {
    const animation = getAnimation(key)
    return animation?.url ? fetchLottieAnimation(animation.url) : null
  })
  
  await Promise.all(animations)
}

/**
 * Helper to control Lottie animations
 */
export class LottieController {
  private animation: AnimationItem | null = null
  private isPlaying = false
  private isDestroyed = false

  constructor(private container: HTMLElement, private config: any) {}

  async load() {
    if (this.animation || this.isDestroyed) return
    
    try {
      const lottie = (await import('lottie-web')).default
      
      this.animation = lottie.loadAnimation({
        container: this.container,
        renderer: 'svg',
        loop: this.config.loop ?? true,
        autoplay: this.config.autoplay ?? false,
        animationData: this.config.animationData,
        path: this.config.path,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          ...this.config.rendererSettings,
        },
      })

      // Set up event listeners
      if (this.config.onComplete) {
        this.animation.addEventListener('complete', this.config.onComplete)
      }
      if (this.config.onLoopComplete) {
        this.animation.addEventListener('loopComplete', this.config.onLoopComplete)
      }
      if (this.config.onEnterFrame) {
        this.animation.addEventListener('enterFrame', this.config.onEnterFrame)
      }

      return this.animation
    } catch (error) {
      console.error('Error initializing Lottie animation:', error)
      throw error
    }
  }

  play() {
    if (!this.animation || this.isDestroyed) return
    this.animation.play()
    this.isPlaying = true
  }

  pause() {
    if (!this.animation || this.isDestroyed) return
    this.animation.pause()
    this.isPlaying = false
  }

  stop() {
    if (!this.animation || this.isDestroyed) return
    this.animation.stop()
    this.isPlaying = false
  }

  setSpeed(speed: number) {
    if (!this.animation || this.isDestroyed) return
    this.animation.setSpeed(speed)
  }

  goToAndPlay(value: number, isFrame = false) {
    if (!this.animation || this.isDestroyed) return
    this.animation.goToAndPlay(value, isFrame)
    this.isPlaying = true
  }

  goToAndStop(value: number, isFrame = false) {
    if (!this.animation || this.isDestroyed) return
    this.animation.goToAndStop(value, isFrame)
    this.isPlaying = false
  }

  destroy() {
    if (this.isDestroyed) return
    
    if (this.animation) {
      // Clean up event listeners
      if (this.config.onComplete) {
        this.animation.removeEventListener('complete', this.config.onComplete)
      }
      if (this.config.onLoopComplete) {
        this.animation.removeEventListener('loopComplete', this.config.onLoopComplete)
      }
      if (this.config.onEnterFrame) {
        this.animation.removeEventListener('enterFrame', this.config.onEnterFrame)
      }
      
      this.animation.destroy()
      this.animation = null
    }
    
    this.isDestroyed = true
    this.isPlaying = false
  }
}

// Helper to create a Lottie animation with the controller
export async function createLottieAnimation(
  container: HTMLElement,
  config: any
): Promise<LottieController> {
  const controller = new LottieController(container, config)
  await controller.load()
  return controller
}
