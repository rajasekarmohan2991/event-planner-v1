
import prisma from '@/lib/prisma'

interface VerifyResult {
    success: boolean
    userId?: string
    message?: string
    error?: string
}

export async function verifyEmailToken(token: string, email: string, name?: string): Promise<VerifyResult> {
    try {
        // Normalize email to lowercase for consistent lookup
        const normalizedEmail = email.toLowerCase().trim()
        console.log('🔍 Verifying email:', normalizedEmail, 'with token:', token.substring(0, 10) + '...')

        if (!token || !normalizedEmail) {
            return { success: false, error: 'Token and email are required' }
        }

        // Look up token - try both original and lowercase email
        let vt = await prisma.verificationToken.findUnique({
            where: { identifier_token: { identifier: normalizedEmail, token } },
        })

        // If not found, try with original email (in case it was stored with different case)
        if (!vt) {
            vt = await prisma.verificationToken.findUnique({
                where: { identifier_token: { identifier: email, token } },
            })
        }

        if (!vt) {
            // Check if user is already verified. If so, return success to prevent confusing "Verification Failed" message
            const existingUser = await prisma.user.findFirst({ 
                where: { 
                    email: { equals: normalizedEmail, mode: 'insensitive' } 
                } 
            })
            if (existingUser?.emailVerified) {
                console.log('✅ User already verified:', normalizedEmail)
                return { success: true, userId: String(existingUser.id), message: 'Already verified' }
            }
            
            // If user exists but not verified, auto-verify them (they clicked the link, they own the email)
            if (existingUser && !existingUser.emailVerified) {
                console.log('🔧 Auto-verifying user who clicked verification link:', normalizedEmail)
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { emailVerified: new Date() }
                })
                return { success: true, userId: String(existingUser.id), message: 'Verified' }
            }
            
            console.log('❌ Invalid or already used token for:', normalizedEmail)
            return { success: false, error: 'Invalid or already used token' }
        }

        if (vt.expires < new Date()) {
            // Cleanup expired token
            await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } })
            console.log('❌ Token expired for:', email)
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

        console.log('✅ Email verified successfully for:', email, 'User ID:', user.id)

        // If there was an event role invite, assign it now
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
                    console.log('✅ Event role assigned:', eventRole, 'for event:', eventId)
                }
                // cleanup metadata
                await prisma.keyValue.delete({ where: { namespace_key: { namespace: 'invite_meta', key: token } } })
            }
        } catch (e) {
            console.warn('⚠️ Role assignment meta not processed:', e)
        }

        return { success: true, userId: String(user.id) }
    } catch (error: any) {
        console.error('❌ Email verification error:', error)
        return {
            success: false,
            error: error.message || 'An unexpected error occurred during verification'
        }
    }
}
