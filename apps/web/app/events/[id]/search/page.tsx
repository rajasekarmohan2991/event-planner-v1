"use client"

import { useSession } from "next-auth/react"

export default function EventSearchPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  if (status === 'loading') return <div className="p-6">Loading...</div>
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Search</h1>
      <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>
      <div className="rounded border p-4">Coming soon: search across attendees, orders, sessions, tasks.</div>
    </div>
  )
}
