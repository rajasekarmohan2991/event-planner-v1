type Listener = (data: any) => void

const channels = new Map<string, Set<Listener>>()

export function subscribe(eventId: number | string, cb: Listener) {
  const key = String(eventId)
  let set = channels.get(key)
  if (!set) { set = new Set(); channels.set(key, set) }
  set.add(cb)
  return () => {
    set!.delete(cb)
    if (set && set.size === 0) channels.delete(key)
  }
}

export function publish(eventId: number | string, data: any) {
  const key = String(eventId)
  const set = channels.get(key)
  if (!set || set.size === 0) return
  for (const cb of set) {
    try { cb(data) } catch {}
  }
}

export function channelSize(eventId: number | string) {
  const key = String(eventId)
  return channels.get(key)?.size ?? 0
}
