import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt(session.user.id)
    const body = await req.json()
    const registrationType = String(body?.registrationType || '').toUpperCase()

    if (registrationType !== 'ORGANIZATION' && registrationType !== 'INDIVIDUAL') {
      return NextResponse.json({ message: 'registrationType must be ORGANIZATION or INDIVIDUAL' }, { status: 400 })
    }

    if (registrationType === 'ORGANIZATION') {
      const companyName = String(body?.companyName || '').trim()
      const croNumber = String(body?.croNumber || '').trim()
      const croData = body?.croData ?? null
      const riskFlags = (Array.isArray(body?.riskFlags) ? body.riskFlags : []) as string[]

      if (!companyName || !croNumber) {
        return NextResponse.json({ message: 'companyName and croNumber are required' }, { status: 400 })
      }

      const profile = await prisma.organizerProfile.upsert({
        where: { userId },
        update: { companyName, croNumber, croData, riskFlags: riskFlags.join(',') },
        create: { userId, companyName, croNumber, croData, riskFlags: riskFlags.join(',') },
      })

      return NextResponse.json({ message: 'Organizer profile submitted', status: profile.status })
    }

    // INDIVIDUAL
    const idType = String(body?.idType || '').trim()
    const docUrl = String(body?.docUrl || '').trim()
    if (!idType || !docUrl) {
      return NextResponse.json({ message: 'idType and docUrl are required' }, { status: 400 })
    }

    const kyc = await prisma.individualVerification.upsert({
      where: { userId },
      update: { idType, docUrl },
      create: { userId, idType, docUrl },
    })

    return NextResponse.json({ message: 'Verification submitted', status: kyc.status })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Submission failed' }, { status: 500 })
  }
}
