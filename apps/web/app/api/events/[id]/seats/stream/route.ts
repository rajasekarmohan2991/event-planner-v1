import { NextRequest } from 'next/server'
import { subscribe } from '@/lib/seatEvents'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const encoder = new TextEncoder()
  const eventId = params.id

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Helper to send an SSE message
      const send = (event: string, data: any) => {
        const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      // Send initial hello
      send('hello', { ok: true, eventId })

      // Subscribe to in-memory channel
      const unsubscribe = subscribe(eventId, (data: any) => {
        send('update', data)
      })

      // Keepalive pings
      const ping = setInterval(() => send('ping', { t: Date.now() }), 25000)

      // Close handler
      const close = () => {
        clearInterval(ping)
        try { unsubscribe() } catch {}
        controller.close()
      }

      // @ts-ignore - not available in types, but present at runtime
      _req.signal?.addEventListener?.('abort', close)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}
