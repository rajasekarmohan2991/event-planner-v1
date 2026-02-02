import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export async function adminApiRequest<T = any>(
  url: string, 
  method: HttpMethod = 'GET',
  body?: any
): Promise<{ data?: T; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Add authorization header if accessToken exists in the session
    if ('accessToken' in session) {
      headers['Authorization'] = `Bearer ${(session as any).accessToken}`
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return { 
        error: error.message || `Request failed with status ${response.status}` 
      }
    }

    const data = await response.json().catch(() => null)
    return { data }
  } catch (error) {
    console.error(`Admin API request failed: ${error}`)
    return { 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }
  }
}

// Type-safe API response helpers
export async function getAdminData<T>(url: string): Promise<{ data?: T; error?: string }> {
  return adminApiRequest<T>(url, 'GET')
}

export async function postAdminData<T>(
  url: string, 
  data: any
): Promise<{ data?: T; error?: string }> {
  return adminApiRequest<T>(url, 'POST', data)
}

export async function putAdminData<T>(
  url: string, 
  data: any
): Promise<{ data?: T; error?: string }> {
  return adminApiRequest<T>(url, 'PUT', data)
}

export async function deleteAdminData(
  url: string
): Promise<{ success: boolean; error?: string }> {
  const result = await adminApiRequest(url, 'DELETE')
  return {
    success: !result.error,
    error: result.error
  }
}
