'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createAttendee } from '@/lib/api/attendees'

type RegistrationSettings = { isOpen: boolean; deadlineAt?: string | null }
type RegistrationField = { id?: string; fieldKey: string; label: string; fieldType?: string; required?: boolean; optionsJson?: string | null; orderIndex?: number }
type Ticket = { id: string; name?: string | null; capacity?: number | null; status?: string | null }

export default function AttendEventPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<RegistrationSettings | null>(null)
  const [fields, setFields] = useState<RegistrationField[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoMsg, setPromoMsg] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const [sRes, fRes, tRes] = await Promise.all([
          fetch(`/api/events/${id}/settings/registration`, { cache: 'no-store' }),
          fetch(`/api/events/${id}/public/custom-fields`, { cache: 'no-store' }),
          fetch(`/api/events/${id}/tickets`, { cache: 'no-store' }),
        ])
        const sJson = sRes.ok ? await sRes.json() : { isOpen: true }
        const fJson = fRes.ok ? await fRes.json() : []
        const tJson = tRes.ok ? await tRes.json() : []
        if (!cancelled) {
          setSettings({ isOpen: sJson?.isOpen ?? true, deadlineAt: sJson?.deadlineAt ?? null })
          setFields(Array.isArray(fJson) ? fJson : [])
          setTickets(Array.isArray(tJson?.items) ? tJson.items : Array.isArray(tJson) ? tJson : [])
        }
      } catch {
        if (!cancelled) {
          setSettings(null)
          setFields([])
          setTickets([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const isClosed = useMemo(() => {
    if (!settings) return false
    if (!settings.isOpen) return true
    if (settings.deadlineAt) {
      const d = new Date(settings.deadlineAt).getTime()
      if (Date.now() > d) return true
    }
    return false
  }, [settings])

  async function applyPromo() {
    setPromoMsg(null)
    if (!promoCode.trim() || !id) return
    try {
      const res = await fetch(`/api/events/${id}/promo-codes/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoCode.trim() })
      })
      const j = await res.json().catch(()=> ({}))
      if (!res.ok) throw new Error(j?.message || 'Invalid promo code')
      setPromoMsg(`Applied: ${promoCode.trim()}${j?.discount ? ` (discount ${j.discount})` : ''}`)
    } catch (e:any) {
      setPromoMsg(e?.message || 'Invalid promo code')
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    setMessage(null)
    setErrors({})
    try {
      await createAttendee(Number(id), {
        name: values['__name'] || '',
        email: values['__email'] || '',
        phone: values['__phone'] || undefined,
        promoCode: promoCode?.trim() || undefined,
        answersJson: JSON.stringify(Object.fromEntries(Object.entries(values).filter(([k]) => !k.startsWith('__'))))
      })
      setMessage('Registration submitted! Check your email for confirmation.')
      // Optionally navigate back to public page
      // router.push(`/events/${id}/public`)
    } catch (err: any) {
      // Try to parse and surface field errors if provided
      const text = err?.message || 'Failed to submit registration'
      try {
        const parsed = JSON.parse(text)
        if (parsed?.errors && Array.isArray(parsed.errors)) {
          const map: Record<string,string> = {}
          for (const e2 of parsed.errors) { if (e2?.key) map[e2.key] = e2?.message || 'Invalid' }
          setErrors(map)
          setMessage(parsed?.message || 'Validation failed')
        } else {
          setMessage(parsed?.message || text)
        }
      } catch {
        setMessage(text)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (f: RegistrationField) => {
    const key = f.fieldKey
    const common = {
      id: key,
      name: key,
      value: values[key] || '',
      onChange: (e: any) => setValues((v) => ({ ...v, [key]: e.target.value })),
      className: 'w-full rounded-md border bg-background px-3 py-2 text-sm',
      required: !!f.required,
    } as any

    if (f.fieldType?.toLowerCase() === 'select') {
      const opts = (() => {
        try {
          if (!f.optionsJson) return []
          const parsed = JSON.parse(f.optionsJson)
          if (Array.isArray(parsed?.options)) return parsed.options
        } catch {}
        return []
      })()
      return (
        <div key={f.id || key} className="space-y-1">
          <label htmlFor={key} className="text-sm font-medium">{f.label}{f.required ? ' *' : ''}</label>
          <select {...common}>
            <option value="">Select...</option>
            {opts.map((o: string) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {errors[key] && <div className="text-xs text-rose-700">{errors[key]}</div>}
        </div>
      )
    }

    if (f.fieldType?.toLowerCase() === 'number') {
      return (
        <div key={f.id || key} className="space-y-1">
          <label htmlFor={key} className="text-sm font-medium">{f.label}{f.required ? ' *' : ''}</label>
          <input type="number" {...common} />
          {errors[key] && <div className="text-xs text-rose-700">{errors[key]}</div>}
        </div>
      )
    }

    // default to text
    return (
      <div key={f.id || key} className="space-y-1">
        <label htmlFor={key} className="text-sm font-medium">{f.label}{f.required ? ' *' : ''}</label>
        <input type="text" placeholder={f.label} {...common} />
        {errors[key] && <div className="text-xs text-rose-700">{errors[key]}</div>}
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {loading ? (
        <div className="space-y-4">
          <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-48 bg-slate-50 rounded border animate-pulse" />
        </div>
      ) : !settings ? (
        <div className="rounded border p-6">Registration unavailable.</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <h1 className="text-xl font-semibold">Event Registration</h1>
            <p className="text-sm text-muted-foreground">Fill the form to register as an attendee.</p>
          </div>

          {isClosed && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">Registration is closed.</div>
          )}

          {/* Capacity / Tickets hint (informational) */}
          {tickets.length > 0 && (
            <div className="rounded-md border bg-white p-3">
              <div className="text-sm font-medium mb-2">Tickets and capacity</div>
              <ul className="text-sm list-disc pl-5 space-y-1">
                {tickets.map(t => (
                  <li key={t.id}>{t.name || t.id}: {t.capacity != null ? `${t.capacity} total` : 'capacity N/A'} {t.status ? `(${t.status})` : ''}</li>
                ))}
              </ul>
              <div className="text-xs text-slate-500 mt-2">If the event is full and waitlist is enabled, the server will indicate waitlist availability.</div>
            </div>
          )}

          {/* Promo code apply UI */}
          <div className="rounded-md border bg-white p-3 space-y-2">
            <div className="text-sm font-medium">Promo code</div>
            <div className="flex gap-2">
              <input value={promoCode} onChange={e=> setPromoCode(e.target.value)} placeholder="PROMO2025" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              <button type="button" onClick={applyPromo} className="rounded-md border px-3 py-2 text-sm">Apply</button>
            </div>
            {promoMsg && <div className="text-xs text-slate-700">{promoMsg}</div>}
          </div>

          <div className="grid gap-4">
            {/* Basic attendee fields */}
            <div className="space-y-1">
              <label htmlFor="__name" className="text-sm font-medium">Full name *</label>
              <input id="__name" className="w-full rounded-md border bg-background px-3 py-2 text-sm" required value={values['__name']||''} onChange={(e)=> setValues(v=>({ ...v, ['__name']: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label htmlFor="__email" className="text-sm font-medium">Email *</label>
              <input id="__email" type="email" className="w-full rounded-md border bg-background px-3 py-2 text-sm" required value={values['__email']||''} onChange={(e)=> setValues(v=>({ ...v, ['__email']: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label htmlFor="__phone" className="text-sm font-medium">Phone</label>
              <input id="__phone" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={values['__phone']||''} onChange={(e)=> setValues(v=>({ ...v, ['__phone']: e.target.value }))} />
            </div>
            {fields.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map(renderField)}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
              disabled={isClosed || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit registration'}
            </button>
            <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => router.back()}>Cancel</button>
          </div>

          {message && (
            <div className="text-sm text-slate-700">{message}</div>
          )}
        </form>
      )}
    </main>
  )
}
