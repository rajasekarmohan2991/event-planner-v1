/**
 * Dual API Client - Works with both External and Internal APIs
 * Tries external API first, automatically falls back to internal Next.js API
 */

import { ApiError } from './api-error'

const EXTERNAL_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://event-planner-v1.onrender.com'
const INTERNAL_API_BASE = '/api'

// Configuration
const USE_EXTERNAL_FIRST = process.env.NEXT_PUBLIC_USE_EXTERNAL_API !== 'false'
const EXTERNAL_TIMEOUT = 8000 // 8 seconds for external API
const INTERNAL_TIMEOUT = 30000 // 30 seconds for internal API

export async function dualApiFetch<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryInternal = true
): Promise<T> {
    // Normalize endpoint
    const normalizedEndpoint = endpoint.startsWith('/api')
        ? endpoint
        : endpoint.startsWith('/')
            ? `/api${endpoint}`
            : `/api/${endpoint}`

    const headers = new Headers(options.headers || {})

    // Set default headers if not provided
    if (!headers.has('Content-Type') && options.method !== 'GET') {
        headers.set('Content-Type', 'application/json')
    }

    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
    }

    // Try external API first (if enabled)
    if (USE_EXTERNAL_FIRST && EXTERNAL_API_BASE && retryInternal) {
        try {
            console.log(`🌐 Trying external API: ${EXTERNAL_API_BASE}${normalizedEndpoint}`)

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT)

            const externalUrl = `${EXTERNAL_API_BASE}${normalizedEndpoint}`
            const response = await fetch(externalUrl, {
                ...config,
                signal: controller.signal,
            })

            clearTimeout(timeoutId)

            if (response.ok || response.status < 500) {
                // Handle empty responses
                if (response.status === 204) {
                    console.log(`✅ External API success (204 No Content)`)
                    return null as unknown as T
                }

                const data = await response.json().catch(() => ({}))

                if (!response.ok) {
                    // If it's a client error (4xx), don't retry with internal
                    if (response.status >= 400 && response.status < 500) {
                        console.warn(`⚠️ External API client error: ${response.status}`)
                        throw new ApiError(
                            data.message || 'Client error',
                            response.status,
                            data.details
                        )
                    }
                    throw new Error(`External API error: ${response.status}`)
                }

                console.log(`✅ External API success: ${response.status}`)
                return data
            }

            console.warn(`⚠️ External API failed: ${response.status}, falling back to internal`)
        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error // Don't retry client errors
            }
            console.warn(`⚠️ External API error: ${error.message}, falling back to internal`)
        }
    }

    // Fallback to internal API or use it directly
    console.log(`🏠 Using internal API: ${normalizedEndpoint}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), INTERNAL_TIMEOUT)

    try {
        const response = await fetch(normalizedEndpoint, {
            ...config,
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Handle empty responses
        if (response.status === 204) {
            console.log(`✅ Internal API success (204 No Content)`)
            return null as unknown as T
        }

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
            console.error(`❌ Internal API error: ${response.status}`)
            throw new ApiError(
                data.message || 'An error occurred',
                response.status,
                data.details
            )
        }

        console.log(`✅ Internal API success: ${response.status}`)
        return data
    } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
            throw new ApiError('Request timed out', 408)
        }
        throw error
    }
}

export const dualApi = {
    get: <T = any>(endpoint: string, options: RequestInit = {}) =>
        dualApiFetch<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
        dualApiFetch<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),

    put: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
        dualApiFetch<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        }),

    patch: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
        dualApiFetch<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        }),

    delete: <T = any>(endpoint: string, options: RequestInit = {}) =>
        dualApiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
}

// Export configuration info
export const apiConfig = {
    external: EXTERNAL_API_BASE,
    internal: INTERNAL_API_BASE,
    useExternalFirst: USE_EXTERNAL_FIRST,
    externalTimeout: EXTERNAL_TIMEOUT,
    internalTimeout: INTERNAL_TIMEOUT,
}
