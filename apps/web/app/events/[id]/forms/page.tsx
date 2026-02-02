"use client"

import { useSession } from "next-auth/react"
import ManageTabs from '@/components/events/ManageTabs'

export default function EventFormsPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  if (status === 'loading') return <div className="p-6">Loading...</div>
  return (
    <div className="space-y-4">
      <ManageTabs eventId={params?.id || ''} />
      <h1 className="text-xl font-semibold">Custom Forms</h1>
      <p className="text-sm text-muted-foreground">Event ID: {params?.id}</p>
      <div className="rounded-md border p-4 text-sm text-muted-foreground">Placeholder for form builder.</div>
    </div>
  )
}
