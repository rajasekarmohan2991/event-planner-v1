import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string, registrationId: string } }) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        // Parse body for fields to update
        const body = await req.json()
        const { firstName, lastName, email, phone, company, jobTitle, type } = body

        // Get existing registration to safely merge JSON data
        const existing = await prisma.registration.findUnique({
            where: { id: params.registrationId }
        })

        if (!existing) {
            return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
        }

        // Prepare updated dataJson
        // We update the top-level fields in dataJson to match the column updates
        const dataJson = (existing.dataJson as any) || {}
        const newDataJson = {
            ...dataJson,
            firstName: firstName || dataJson.firstName,
            lastName: lastName || dataJson.lastName,
            email: email || dataJson.email,
            phone: phone || dataJson.phone,
            company: company || dataJson.company,
            jobTitle: jobTitle || dataJson.jobTitle
        }

        // Update in database
        const updated = await prisma.registration.update({
            where: { id: params.registrationId },
            data: {
                // firstName and lastName might not be columns in some schema versions, store in JSON
                // email is usually a column
                email: email ?? existing.email,
                dataJson: newDataJson,
                // Optional fields
                ...(type && { type }), // Only update type if provided
            }
        })

        return NextResponse.json(updated)
    } catch (e: any) {
        console.error('Error updating registration:', e)
        return NextResponse.json({ message: e.message || 'Failed to update registration' }, { status: 500 })
    }
}
