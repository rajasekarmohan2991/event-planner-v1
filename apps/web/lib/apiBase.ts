export function getApiBase() {
  const raw = (process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '')
  // Log the API URL being used (server-side only) to verify Vercel env vars are picked up
  if (typeof window === 'undefined') {
    console.log('[API Config] Using Base URL:', raw)
  }
  return `${raw}/api`
}
