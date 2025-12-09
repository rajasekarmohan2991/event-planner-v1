import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Simple in-memory storage for demo purposes
// In production, this would be stored in a database
const settingsStore = new Map<string, any>()

export type AdvancedRegSettings = {
  timeLimitMinutes: number
  noTimeLimit: boolean
  ticketIssueMode: 'on_payment' | 'on_registration'
  allowTransfer: {
    enabled: boolean
    scope: 'all' | 'selected'
    until: 'event_end' | 'custom'
    customUntilIso?: string | null
    ticketClassIds?: string[]
  }
  appleWallet: boolean
  showAvailability: boolean
  restrictDuplicates: 'event' | 'ticket' | 'none'
  registrationApproval: {
    enabled: boolean
    scope: 'all' | 'selected'
    ticketClassIds?: string[]
  }
  cancellationApproval: boolean
  allowCheckinUnpaidOffline: boolean
}

const DEFAULTS: AdvancedRegSettings = {
  timeLimitMinutes: 15,
  noTimeLimit: false,
  ticketIssueMode: 'on_payment',
  allowTransfer: { enabled: false, scope: 'all', until: 'event_end', customUntilIso: null, ticketClassIds: [] },
  appleWallet: true,
  showAvailability: false,
  restrictDuplicates: 'event',
  registrationApproval: { enabled: false, scope: 'all', ticketClassIds: [] },
  cancellationApproval: false,
  allowCheckinUnpaidOffline: false,
}

function sanitize(input: any): AdvancedRegSettings {
  try {
    const v = input || {}
    return {
      timeLimitMinutes: Math.max(0, Number(v.timeLimitMinutes ?? DEFAULTS.timeLimitMinutes)),
      noTimeLimit: Boolean(v.noTimeLimit ?? DEFAULTS.noTimeLimit),
      ticketIssueMode: v.ticketIssueMode === 'on_registration' ? 'on_registration' : 'on_payment',
      allowTransfer: {
        enabled: Boolean(v.allowTransfer?.enabled ?? false),
        scope: v.allowTransfer?.scope === 'selected' ? 'selected' : 'all',
        until: v.allowTransfer?.until === 'custom' ? 'custom' : 'event_end',
        customUntilIso: v.allowTransfer?.customUntilIso ?? null,
        ticketClassIds: Array.isArray(v.allowTransfer?.ticketClassIds) ? v.allowTransfer.ticketClassIds.map(String) : [],
      },
      appleWallet: Boolean(v.appleWallet ?? DEFAULTS.appleWallet),
      showAvailability: Boolean(v.showAvailability ?? DEFAULTS.showAvailability),
      restrictDuplicates: ['event','ticket','none'].includes(v.restrictDuplicates) ? v.restrictDuplicates : 'event',
      registrationApproval: {
        enabled: Boolean(v.registrationApproval?.enabled ?? false),
        scope: v.registrationApproval?.scope === 'selected' ? 'selected' : 'all',
        ticketClassIds: Array.isArray(v.registrationApproval?.ticketClassIds) ? v.registrationApproval.ticketClassIds.map(String) : [],
      },
      cancellationApproval: Boolean(v.cancellationApproval ?? false),
      allowCheckinUnpaidOffline: Boolean(v.allowCheckinUnpaidOffline ?? false),
    }
  } catch {
    return DEFAULTS
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Get settings from in-memory store or return defaults
    const storedSettings = settingsStore.get(params.id)
    const settings = sanitize(storedSettings)
    return NextResponse.json(settings)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to load' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const settings = sanitize(body)

    // Store settings in memory
    settingsStore.set(params.id, settings)

    return NextResponse.json(settings)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to save' }, { status: 500 })
  }
}
