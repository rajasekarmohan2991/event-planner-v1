export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  // If provided, ensure no trailing slash; otherwise use local proxy
  return raw ? raw.replace(/\/$/, '') : ''
}
