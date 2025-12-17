export function getApiBase() {
  const fallback = 'http://localhost:8081'

  // Prioritize environment variables:
  // 1. INTERNAL_API_BASE_URL (Docker internal networking, if used)
  // 2. NEXT_PUBLIC_API_BASE_URL (Standard Vercel/Render env var)
  // 3. Fallback (Localhost)
  const raw = (process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || fallback).replace(/\/$/, '')

  // Log only on server side to aid debugging
  if (typeof window === 'undefined') {
    // Only log if not in production to avoid clutter, or log if specifically debugging
    if (process.env.NODE_ENV !== 'production' || !process.env.NEXT_PUBLIC_API_BASE_URL) {
      console.log('[API Config] Using Base URL:', raw)
    }
  }
  return `${raw}/api`
}
