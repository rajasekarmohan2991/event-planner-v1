import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rateLimit'
import { sendVerificationEmail } from '@/lib/email'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { validateUserEmail } from '@/lib/email-validation'

// Build API base just like in other routes (ensure trailing /api)
const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`
// UserRole enum removed from schema, using string values directly

// Define default permissions for roles
const ROLE_PERMISSIONS: Record<string, any> = {
  'TENANT_ADMIN': {
    events: ['create', 'read', 'update', 'delete'],
    registrations: ['read', 'update', 'approve', 'checkin'],
    attendees: ['read', 'update', 'delete'],
    finance: ['read', 'manage'],
    settings: ['read', 'update'],
    team: ['read', 'invite', 'manage']
  },
  'EVENT_MANAGER': {
    events: ['create', 'read', 'update'],
    registrations: ['read', 'update', 'approve', 'checkin'],
    attendees: ['read', 'update'],
    finance: ['read'],
    settings: ['read'],
    team: ['read']
  },
  'STAFF': {
    events: ['read'],
    registrations: ['read', 'checkin'],
    attendees: ['read', 'checkin'],
    finance: [],
    settings: [],
    team: []
  },
  'VIEWER': {
    events: ['read'],
    registrations: ['read'],
    attendees: ['read'],
    finance: ['read'],
    settings: [],
    team: []
  }
}

export async function POST(req: NextRequest) {
  // Apply rate limiting (5 requests per minute)
  const rateLimitedResponse = await withRateLimit(req, async () => {
    try {
      const { name, email, password, role: requestedRole, inviteCode, companyName, companySlug } = await req.json()

      // Validate input
      if (!name || !email || !password) {
        return NextResponse.json(
          { message: 'Name, email, and password are required' },
          { status: 400 }
        )
      }

      // Check for team invite
      let teamInvite = null
      if (inviteCode && !companyName) {
        teamInvite = await prisma.teamInvite.findUnique({ where: { id: inviteCode } })
        if (teamInvite) {
          if (teamInvite.status !== 'PENDING') {
            return NextResponse.json({ message: 'Invitation has already been used or expired' }, { status: 400 })
          }
          if (teamInvite.email.toLowerCase() !== email.toLowerCase()) {
            return NextResponse.json({ message: 'Email address must match the invitation' }, { status: 400 })
          }
        }
      }

      // Determine role with safeguards
      // If registering as a company, user becomes ADMIN automatically
      let role: string = companyName && companySlug ? 'ADMIN' : 'USER'

      // Allow override via requestedRole (for manual admin creation)
      if (requestedRole && typeof requestedRole === 'string') {
        const upper = requestedRole.toUpperCase()
        if (['ADMIN', 'ORGANIZER', 'USER'].includes(upper)) {
          role = upper
        }
      }

      // Validate admin invite code when role is ADMIN and NOT company registration and NOT a team invite
      if (role === 'ADMIN' && !(companyName && companySlug) && !teamInvite) {
        const adminInvite = process.env.ADMIN_INVITE_CODE || ''
        if (!adminInvite || inviteCode !== adminInvite) {
          return NextResponse.json(
            { message: 'Invalid or missing invite code for admin registration' },
            { status: 403 }
          )
        }
      }

      // Direct registration in Next.js (bypass Java API due to 403 issue)

      // Check email validity and availability
      const emailValidation = await validateUserEmail(email)

      if (!emailValidation.valid) {
        return NextResponse.json(
          { message: emailValidation.error },
          { status: 409 }
        )
      }

      // Check if company slug already exists (if company registration)
      if (companyName && companySlug) {
        const existingTenant = await prisma.tenant.findFirst({
          where: { slug: companySlug }
        })
        if (existingTenant) {
          return NextResponse.json(
            { message: 'Company slug already exists' },
            { status: 409 }
          )
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user and optional tenant in transaction
      const user = await prisma.$transaction(async (tx) => {
        const totalUsers = await tx.user.count()
        const effectiveRole = totalUsers === 0 ? 'SUPER_ADMIN' : role
        // Create user
        const newUser = await tx.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: effectiveRole,
            emailVerified: null, // Will be verified via email
          }
        })

        // Create tenant if requested
        if (companyName && companySlug) {
          const newTenant = await tx.tenant.create({
            data: {
              name: companyName,
              slug: companySlug,
              subdomain: companySlug,
              members: {
                create: {
                  userId: newUser.id,
                  role: 'TENANT_ADMIN',
                  permissions: ROLE_PERMISSIONS['TENANT_ADMIN']
                }
              }
            }
          })

          // Update user with current tenant
          await tx.user.update({
            where: { id: newUser.id },
            data: { currentTenantId: newTenant.id }
          })
        }

        // Handle Team Invite
        if (teamInvite) {
          await tx.tenantMember.create({
            data: {
              tenantId: teamInvite.tenantId,
              userId: newUser.id,
              role: teamInvite.role,
              permissions: ROLE_PERMISSIONS[teamInvite.role] || {},
              status: 'ACTIVE',
              invitedBy: teamInvite.invitedBy,
              invitedAt: teamInvite.invitedAt,
              joinedAt: new Date()
            }
          })

          await tx.teamInvite.update({
            where: { id: teamInvite.id },
            data: {
              status: 'APPROVED',
              respondedAt: new Date()
            }
          })

          // Set current tenant context
          await tx.user.update({
            where: { id: newUser.id },
            data: { currentTenantId: teamInvite.tenantId }
          })
        }

        return newUser
      })

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user

      // Create verification token
      const token = randomBytes(32).toString('hex')
      const expires = new Date()
      expires.setHours(expires.getHours() + 24) // 24 hour expiration

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      })

      // Optional: Send verification email
      try {
        const encEmail = encodeURIComponent(email)
        const encName = encodeURIComponent(name)
        const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '')
        const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}&email=${encEmail}&name=${encName}`
        await sendVerificationEmail({ to: email, name, verificationUrl })
      } catch (e) {
        console.warn('Email send skipped:', e)
      }

      return NextResponse.json(
        { message: 'Registration successful! Please check your email to verify your account.' },
        { status: 201 }
      )
    } catch (err: any) {
      const msg = err?.message || 'Registration failed'
      return NextResponse.json({ message: msg }, { status: 500 })
    }
  }, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Limit each IP to 5 requests per windowMs
    burstTokens: 5, // Allow burst of 5 requests
  })

  // If rate limited, return the rate limited response
  if (rateLimitedResponse) {
    return rateLimitedResponse
  }

  // This should never be reached due to the wrapper, but TypeScript needs it
  return new NextResponse(
    JSON.stringify({ message: 'An unexpected error occurred' }),
    { status: 500 }
  )
}
