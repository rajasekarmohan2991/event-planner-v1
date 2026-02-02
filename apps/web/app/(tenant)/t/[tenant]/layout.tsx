import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { resolveTenantSlug } from '@/lib/tenant'

export default function TenantLayout({ children, params }: { children: ReactNode; params: { tenant: string } }) {
  // Ensure tenant slug is available to all nested pages
  const h = headers()
  const headerSlug = h.get('x-tenant-slug')
  const slug = headerSlug || params.tenant || resolveTenantSlug()

  return (
    <div data-tenant-slug={slug} className="min-h-screen">
      {children}
    </div>
  )
}
