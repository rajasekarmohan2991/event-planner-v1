/**
 * Image Optimization Utilities
 * Provides optimized image loading with lazy loading, blur placeholders, and responsive sizes
 */

'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
    src: string
    alt: string
    width?: number
    height?: number
    className?: string
    priority?: boolean
    fill?: boolean
    sizes?: string
    quality?: number
}

/**
 * Optimized Image Component with blur placeholder and lazy loading
 */
export function OptimizedImage({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    fill = false,
    sizes,
    quality = 85,
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true)

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                fill={fill}
                sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
                quality={quality}
                priority={priority}
                loading={priority ? 'eager' : 'lazy'}
                placeholder="blur"
                blurDataURL={generateBlurDataURL()}
                className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0'}
        `}
                onLoadingComplete={() => setIsLoading(false)}
            />
        </div>
    )
}

/**
 * Generate a blur placeholder data URL
 */
function generateBlurDataURL(): string {
    // Simple gray blur placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=='
}

/**
 * Optimized Avatar Component
 */
export function OptimizedAvatar({
    src,
    alt,
    size = 40,
    className = '',
}: {
    src?: string
    alt: string
    size?: number
    className?: string
}) {
    const [error, setError] = useState(false)

    if (!src || error) {
        return (
            <div
                className={`flex items-center justify-center bg-gradient-to-br from-rose-500 to-pink-600 text-white font-semibold ${className}`}
                style={{ width: size, height: size }}
            >
                {alt.charAt(0).toUpperCase()}
            </div>
        )
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={size}
            height={size}
            className={`rounded-full ${className}`}
            quality={90}
            onError={() => setError(true)}
        />
    )
}

/**
 * Responsive image sizes for common use cases
 */
export const ImageSizes = {
    thumbnail: '(max-width: 640px) 100px, 150px',
    card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    hero: '100vw',
    banner: '(max-width: 1024px) 100vw, 1200px',
    avatar: '(max-width: 640px) 40px, 64px',
}

/**
 * Preload critical images
 */
export function preloadImage(src: string) {
    if (typeof window === 'undefined') return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
}

/**
 * Lazy load images with Intersection Observer
 */
export function useLazyImage(threshold = 0.1) {
    const [isVisible, setIsVisible] = useState(false)
    const [ref, setRef] = useState<HTMLElement | null>(null)

    if (typeof window !== 'undefined' && ref) {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold }
        )

        observer.observe(ref)
    }

    return { ref: setRef, isVisible }
}
