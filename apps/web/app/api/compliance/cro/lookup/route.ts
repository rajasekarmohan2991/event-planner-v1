import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { croNumber } = await req.json()
    if (!croNumber || typeof croNumber !== 'string') {
      return NextResponse.json({ message: 'croNumber is required' }, { status: 400 })
    }

    // Stubbed CRO response. Replace with real integration later.
    const today = new Date()
    const incorporationDate = new Date(today)
    incorporationDate.setMonth(incorporationDate.getMonth() - 2) // pretend 2 months old

    const riskFlags: string[] = []
    // Demo heuristics: mark newly incorporated if length < 6 or starts with N
    if (croNumber.length < 6 || /^N/i.test(croNumber)) riskFlags.push('NEWLY_INCORPORATED')
    // Demo heuristics: random flag for frequent director changes for preview
    if (/^9/.test(croNumber)) riskFlags.push('FREQUENT_DIRECTOR_CHANGES')

    return NextResponse.json({
      companyName: `Company ${croNumber}`,
      status: 'ACTIVE',
      incorporationDate: incorporationDate.toISOString().slice(0, 10),
      riskFlags,
    })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Lookup failed' }, { status: 500 })
  }
}
