"use client"

export default function TaxStub({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Tax</h1>
      <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>
      <div className="rounded-md border bg-white p-4 text-sm text-muted-foreground">UI stub only.</div>
    </div>
  )
}
