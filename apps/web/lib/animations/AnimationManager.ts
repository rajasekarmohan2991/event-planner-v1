/**
 * Comprehensive Animation Management System for Event Planner
 * Supports multiple animation types, role-based configurations, and dynamic loading
 */

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'USER'
export type AnimationType = 'lottie' | 'gif' | 'video' | 'svg' | 'css'
export type AnimationContext = 'auth' | 'dashboard' | 'events' | 'loading' | 'success' | 'error' | 'onboarding'

export interface AnimationConfig {
  id: string
  name: string
  type: AnimationType
  context: AnimationContext
  roles: UserRole[]
  src: string
  fallbackSrc?: string
  settings: {
    loop: boolean
    autoplay: boolean
    speed?: number
    width?: string
    height?: string
    className?: string
  }
  metadata: {
    description: string
    tags: string[]
    createdAt: string
    updatedAt: string
    author?: string
    license?: string
  }
}

export interface RoleBasedAnimations {
  [key: string]: {
    [context in AnimationContext]?: AnimationConfig[]
  }
}

class AnimationManager {
  private static instance: AnimationManager
  private animations: Map<string, AnimationConfig> = new Map()
  private roleConfigs: RoleBasedAnimations = {}
  private cache: Map<string, any> = new Map()

  private constructor() {
    this.initializeDefaultAnimations()
  }

  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager()
    }
    return AnimationManager.instance
  }

  /**
   * Initialize default animations for the Event Planner app
   */
  private initializeDefaultAnimations(): void {
    // Auth animations
    this.registerAnimation({
      id: 'auth-login-lottie',
      name: 'Login Animation',
      type: 'lottie',
      context: 'auth',
      roles: ['ADMIN', 'ORGANIZER', 'USER'],
      src: 'https://assets-v2.lottiefiles.com/a/0cc2284a-1186-11ee-b397-d72e49fbcccf/yzZt6DjCIC.lottie',
      fallbackSrc: '/animations/login-fallback.json',
      settings: {
        loop: true,
        autoplay: true,
        width: '100%',
        height: '100%',
        className: 'w-72 mx-auto'
      },
      metadata: {
        description: 'Professional login animation with team collaboration theme',
        tags: ['login', 'auth', 'team', 'collaboration'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        license: 'free'
      }
    })

    // Loading animations
    this.registerAnimation({
      id: 'loading-spinner',
      name: 'Loading Spinner',
      type: 'lottie',
      context: 'loading',
      roles: ['ADMIN', 'ORGANIZER', 'USER'],
      src: '/animations/loading.json',
      settings: {
        loop: true,
        autoplay: true,
        width: '48px',
        height: '48px'
      },
      metadata: {
        description: 'Smooth loading spinner animation',
        tags: ['loading', 'spinner'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    // Success animations
    this.registerAnimation({
      id: 'success-checkmark',
      name: 'Success Checkmark',
      type: 'lottie',
      context: 'success',
      roles: ['ADMIN', 'ORGANIZER', 'USER'],
      src: '/animations/success.json',
      settings: {
        loop: false,
        autoplay: true,
        width: '64px',
        height: '64px'
      },
      metadata: {
        description: 'Animated success checkmark',
        tags: ['success', 'checkmark', 'complete'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    // Role-specific dashboard animations
    this.registerAnimation({
      id: 'admin-dashboard',
      name: 'Admin Dashboard Animation',
      type: 'lottie',
      context: 'dashboard',
      roles: ['ADMIN'],
      src: '/animations/admin-dashboard.json',
      settings: {
        loop: true,
        autoplay: true,
        width: '300px',
        height: '200px'
      },
      metadata: {
        description: 'Admin dashboard welcome animation',
        tags: ['admin', 'dashboard', 'management'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    this.registerAnimation({
      id: 'organizer-dashboard',
      name: 'Organizer Dashboard Animation',
      type: 'lottie',
      context: 'dashboard',
      roles: ['ORGANIZER'],
      src: '/animations/organizer-dashboard.json',
      settings: {
        loop: true,
        autoplay: true,
        width: '300px',
        height: '200px'
      },
      metadata: {
        description: 'Event organizer dashboard animation',
        tags: ['organizer', 'dashboard', 'events'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    this.registerAnimation({
      id: 'user-dashboard',
      name: 'User Dashboard Animation',
      type: 'lottie',
      context: 'dashboard',
      roles: ['USER'],
      src: '/animations/user-dashboard.json',
      settings: {
        loop: true,
        autoplay: true,
        width: '300px',
        height: '200px'
      },
      metadata: {
        description: 'User dashboard welcome animation',
        tags: ['user', 'dashboard', 'events'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Register a new animation configuration
   */
  public registerAnimation(config: AnimationConfig): void {
    this.animations.set(config.id, config)
    
    // Update role-based configurations
    config.roles.forEach(role => {
      if (!this.roleConfigs[role]) {
        this.roleConfigs[role] = {}
      }
      if (!this.roleConfigs[role][config.context]) {
        this.roleConfigs[role][config.context] = []
      }
      this.roleConfigs[role][config.context]!.push(config)
    })
  }

  /**
   * Get animation by ID
   */
  public getAnimation(id: string): AnimationConfig | undefined {
    return this.animations.get(id)
  }

  /**
   * Get animations by context and role
   */
  public getAnimationsForRole(role: UserRole, context: AnimationContext): AnimationConfig[] {
    return this.roleConfigs[role]?.[context] || []
  }

  /**
   * Get the best animation for a specific role and context
   */
  public getBestAnimation(role: UserRole, context: AnimationContext): AnimationConfig | undefined {
    const animations = this.getAnimationsForRole(role, context)
    return animations.length > 0 ? animations[0] : undefined
  }

  /**
   * Upload and register a new animation
   */
  public async uploadAnimation(
    file: File,
    config: Omit<AnimationConfig, 'id' | 'src'>
  ): Promise<string> {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // In a real implementation, you would upload the file to your storage service
    // For now, we'll simulate this with a local URL
    const src = `/animations/custom/${id}.${file.name.split('.').pop()}`
    
    const fullConfig: AnimationConfig = {
      ...config,
      id,
      src,
      metadata: {
        ...config.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    this.registerAnimation(fullConfig)
    return id
  }

  /**
   * Update animation configuration
   */
  public updateAnimation(id: string, updates: Partial<AnimationConfig>): boolean {
    const existing = this.animations.get(id)
    if (!existing) return false

    const updated: AnimationConfig = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    this.animations.set(id, updated)
    return true
  }

  /**
   * Remove animation
   */
  public removeAnimation(id: string): boolean {
    return this.animations.delete(id)
  }

  /**
   * Get all animations
   */
  public getAllAnimations(): AnimationConfig[] {
    return Array.from(this.animations.values())
  }

  /**
   * Search animations by tags or name
   */
  public searchAnimations(query: string): AnimationConfig[] {
    const lowercaseQuery = query.toLowerCase()
    return this.getAllAnimations().filter(animation => 
      animation.name.toLowerCase().includes(lowercaseQuery) ||
      animation.metadata.description.toLowerCase().includes(lowercaseQuery) ||
      animation.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  /**
   * Preload animation for better performance
   */
  public async preloadAnimation(id: string): Promise<void> {
    const config = this.getAnimation(id)
    if (!config || this.cache.has(id)) return

    try {
      if (config.type === 'lottie') {
        // Preload Lottie animation
        const response = await fetch(config.src)
        const animationData = await response.json()
        this.cache.set(id, animationData)
      }
    } catch (error) {
      console.warn(`Failed to preload animation ${id}:`, error)
    }
  }

  /**
   * Get cached animation data
   */
  public getCachedAnimation(id: string): any {
    return this.cache.get(id)
  }

  /**
   * Clear animation cache
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * Export configuration for backup/sync
   */
  public exportConfig(): { animations: AnimationConfig[], roleConfigs: RoleBasedAnimations } {
    return {
      animations: this.getAllAnimations(),
      roleConfigs: this.roleConfigs
    }
  }

  /**
   * Import configuration from backup/sync
   */
  public importConfig(data: { animations: AnimationConfig[], roleConfigs: RoleBasedAnimations }): void {
    this.animations.clear()
    this.roleConfigs = {}

    data.animations.forEach(animation => {
      this.registerAnimation(animation)
    })
  }
}

export default AnimationManager
