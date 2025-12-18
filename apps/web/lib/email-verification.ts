
import prisma from '@/lib/prisma'

interface VerifyResult {
    success: boolean
    userId?: string
    message?: string
    error?: string
}

export async function verifyEmailToken(token: string, email: string, name?: string): Promise<VerifyResult> {
    if (!token || !email) {
        return { success: false, error: 'Token and email are required' }
    }

    // Look up token
    const vt = await prisma.verificationToken.findUnique({
        where: { identifier_token: { identifier: email, token } },
    })

    if (!vt) {
        // Check if user is already verified. If so, return success to prevent confusing "Verification Failed" message
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser?.emailVerified) {
            return { success: true, userId: String(existingUser.id), message: 'Already verified' }
        }
        return { success: false, error: 'Invalid or already used token' }
    }

    if (vt.expires < new Date()) {
        // Cleanup expired token
        await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } })
        return { success: false, error: 'Token expired' }
    }

    // Upsert user and mark verified
    const verifiedAt = new Date()

    // Use a transaction to ensure atomicity
    const user = await prisma.$transaction(async (tx) => {
        // 1. Update/Create User
        const u = await tx.user.upsert({
            where: { email },
            create: {
                email,
                name: name || email.split('@')[0],
                role: 'USER',
                emailVerified: verifiedAt,
            },
            update: { emailVerified: verifiedAt },
        })

        // 2. Delete Token
        await tx.verificationToken.delete({
            where: { identifier_token: { identifier: email, token } }
        })

        return u
    })

    // If there was an event role invite, assign it now
    // This part doesn't strictly need to be in the transaction if performance is key, 
    // but it's referencing the token which is now deleted. 
    // Ideally we should have read the metadata before deleting.
    try {
        const meta = await prisma.keyValue.findUnique({
            where: { namespace_key: { namespace: 'invite_meta', key: token } },
        })

        if (meta) {
            const { eventId, role: eventRole } = (meta.value as any) || {}
            if (
                typeof eventId === 'string' &&
                (eventRole === 'ORGANIZER' || eventRole === 'STAFF')
            ) {
                await prisma.eventRoleAssignment.upsert({
                    where: { eventId_userId: { eventId, userId: user.id } },
                    create: { eventId, userId: user.id, role: eventRole },
                    update: { role: eventRole },
                })
            }
            // cleanup metadata
            await prisma.keyValue.delete({ where: { namespace_key: { namespace: 'invite_meta', key: token } } })
        }
    } catch (e) {
        console.warn('Role assignment meta not processed:', e)
    }

    return { success: true, userId: String(user.id) }
}
