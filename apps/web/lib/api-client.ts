import { ApiError } from './api-error'

const RAW_PUBLIC_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ''
const API_URL = RAW_PUBLIC_BASE
  ? `${RAW_PUBLIC_BASE.replace(/\/$/, '')}/api`
  : '/api'

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`
  
  const headers = new Headers(options.headers || {})
  
  // Set default headers if not provided
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  
  // Add auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include cookies for auth
    signal: options.signal || controller.signal,
  }

  try {
    const response = await fetch(url, config)
    clearTimeout(timeoutId)
    
    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return null as unknown as T
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new ApiError(
        data.message || 'An error occurred',
        response.status,
        data.details
      )
    }

    return data
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out', 408)
    }
    throw error
  }
}

export const api = {
  get: <T = any>(endpoint: string, options: RequestInit = {}) => 
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  put: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  patch: <T = any>(endpoint: string, body?: any, options: RequestInit = {}) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  delete: <T = any>(endpoint: string, options: RequestInit = {}) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
}

// Helper function to handle API errors in components
export function handleApiError(error: unknown): { message: string; status?: number } {
  if (error instanceof ApiError) {
    return { 
      message: error.message || 'An error occurred',
      status: error.statusCode,
    }
  }
  
  if (error instanceof Error) {
    return { message: error.message || 'An unexpected error occurred' }
  }
  
  return { message: 'An unknown error occurred' }
}
