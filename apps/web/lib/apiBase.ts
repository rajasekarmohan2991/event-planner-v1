export function getApiBase() {
  const raw = (process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '')
  return `${raw}/api`
}
