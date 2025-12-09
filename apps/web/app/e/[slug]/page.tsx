'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

function parseIdFromSlug(slug: string): string | null {
  // Expect formats like: my-great-event-123 or my-great-event-uuid
  // Strategy: take the segment after the last hyphen IF it looks like an id (digits) or UUID-ish
  const lastHyphen = slug.lastIndexOf('-')
  if (lastHyphen === -1) return null
  const tail = slug.slice(lastHyphen + 1)
  // Allow numeric IDs or uuid-like (contains letters and digits, length >= 6)
  const isNumeric = /^\d+$/.test(tail)
  const isUuidish = /^[a-z0-9-]{6,}$/.test(tail)
  if (isNumeric || isUuidish) return tail
  return null
}

export default function PublicEventBySlugPage() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.slug as string) || ''
  const [resolving, setResolving] = useState(true)

  useEffect(() => {
    const id = parseIdFromSlug(slug)
    if (!id) {
      // Fallback to search page or 404
      router.replace('/404')
      return
    }
    // Redirect to canonical public page for the event id
    router.replace(`/events/${id}/public`)
  }, [slug, router])

  if (!resolving) return null
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Opening event…</p>
      </div>
    </div>
  )
}
