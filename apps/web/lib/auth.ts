import { NextAuthOptions, getServerSession, DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import type { UserRole } from '@/lib/roles-config'
type Gender = 'MALE' | 'FEMALE' | 'OTHER'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import InstagramProvider from 'next-auth/providers/instagram'
import { compare, hash } from 'bcryptjs'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
// AuthController is at /auth (no /api prefix), but other controllers are at /api/...
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}`

// Extend the built-in session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
      tenantRole?: UserRole
      gender?: Gender
    } & DefaultSession['user']
  }

  interface User {
    role: UserRole
    gender?: Gender
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    tenantRole?: UserRole
    gender?: Gender
  }
}

async function ensureSuperAdminTenantForUser(userIdInput: any) {
  const uid = typeof userIdInput === 'bigint' ? userIdInput : BigInt(userIdInput)
  let tenant = await prisma.tenant.findUnique({ where: { slug: 'super-admin' } })
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Super Admin',
        slug: 'super-admin',
        subdomain: 'super-admin',
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        maxEvents: 1000000,
        maxUsers: 1000000,
        maxStorage: 1000000
      }
    })
  } else {
    // Ensure existing super-admin tenant has high limits
    if (tenant.maxEvents < 1000000 || tenant.plan !== 'ENTERPRISE') {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
          maxEvents: 1000000,
          maxUsers: 1000000,
          maxStorage: 1000000
        }
      })
    }
  }
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: uid } },
    update: { role: 'TENANT_ADMIN', status: 'ACTIVE' },
    create: { tenantId: tenant.id, userId: uid, role: 'TENANT_ADMIN', status: 'ACTIVE', joinedAt: new Date() }
  })
  await prisma.user.update({ where: { id: uid }, data: { currentTenantId: tenant.id } })
  return tenant.id
}

export const authOptions: NextAuthOptions = {
  // Note: Not using PrismaAdapter to allow custom account linking logic
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (1 week)
    updateAge: 24 * 60 * 60, // Update session once per day instead of every hour for better performance
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  providers: [
    // Google OAuth - only enable if credentials are provided
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    // Instagram OAuth - only enable if credentials are provided
    ...(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET ? [
      InstagramProvider({
        clientId: process.env.INSTAGRAM_CLIENT_ID,
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('❌ Missing credentials')
          throw new Error('Email and password are required')
        }

        try {
          const devEnabled = String(process.env.ENABLE_DEV_LOGIN || '').toLowerCase() === 'true'
            || String(process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN || '').toLowerCase() === 'true'
          const devEmail = process.env.DEV_LOGIN_EMAIL
          const devPassword = process.env.DEV_LOGIN_PASSWORD
          if (
            devEnabled && devEmail && devPassword &&
            credentials.email.toLowerCase() === devEmail.toLowerCase() &&
            credentials.password === devPassword
          ) {
            let user = await prisma.user.findUnique({ where: { email: devEmail.toLowerCase() } })
            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: devEmail.toLowerCase(),
                  name: 'Dev User',
                  role: 'SUPER_ADMIN',
                  password: await hash(devPassword, 10),
                  currentTenantId: process.env.DEFAULT_TENANT_ID || 'default-tenant',
                  emailVerified: new Date()
                }
              })
            } else if (!user.password) {
              try {
                await prisma.user.update({ where: { id: user.id }, data: { password: await hash(devPassword, 10) } })
              } catch { }
              // Ensure dev user is treated as verified
              try {
                if (!user.emailVerified) {
                  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } })
                }
              } catch { }
            }
            const accessToken = Buffer.from(JSON.stringify({
              sub: String(user.id),
              email: user.email,
              role: user.role,
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
            })).toString('base64')
            return {
              id: String(user.id),
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role as UserRole,
              currentTenantId: user.currentTenantId,
              accessToken
            } as any
          }

          console.log('🔍 Looking up user:', credentials.email.toLowerCase())

          // Try to authenticate directly with database
          let user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          })

          console.log('👤 User found:', user ? 'Yes' : 'No')
          console.log('🔑 Has password:', user?.password ? 'Yes' : 'No')

          if (!user || !user.password) {
            console.error('❌ User not found or no password')
            throw new Error('Invalid email or password')
          }

          console.log('🔐 Verifying password...')

          // Verify password
          const isPasswordValid = await compare(credentials.password, user.password)

          console.log('✅ Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            console.error('❌ Password does not match')
            throw new Error('Invalid email or password')
          }

          console.log('✅ Login successful for:', user.email)

          // Enforce email verification for credentials login
          if (!user.emailVerified) {
            console.error('❌ Email not verified')
            throw new Error('Please verify your email. Check your inbox for the verification link.')
          }

          if ((user as any).role === 'SUPER_ADMIN') {
            try {
              await ensureSuperAdminTenantForUser(user.id)
              user = (await prisma.user.findUnique({ where: { id: user.id } }))!
            } catch (e) {
              console.error('Failed to ensure super admin tenant:', e)
            }
          }

          // Generate a simple accessToken (JWT-like) for the backend
          // In production, you'd call your backend auth service to get a proper JWT
          const accessToken = Buffer.from(JSON.stringify({
            sub: String(user.id),
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
          })).toString('base64')

          console.log('🔑 Generated accessToken for:', user.email)

          // Return user object with accessToken
          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role as UserRole,
            currentTenantId: user.currentTenantId,
            accessToken: accessToken,
          } as any
        } catch (error: any) {
          console.error('❌ Credentials login error:', error.message)
          throw new Error(error.message || 'Authentication failed')
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow OAuth sign-ins (Google, Instagram)
      if (account?.provider === 'google' || account?.provider === 'instagram') {
        try {
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (existingUser) {
            // User exists - check if they have an account for this provider
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: account.provider
              }
            })

            if (!existingAccount) {
              // Link this OAuth provider to existing user
              try {
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    refresh_token: account.refresh_token,
                    access_token: account.access_token,
                    expires_at: account.expires_at ? BigInt(Math.floor(Number(account.expires_at))) : null,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state as string | null,
                  }
                })
                console.log(`✅ Linked ${account.provider} to existing user ${existingUser.email}`)
              } catch (linkError) {
                console.error(`❌ Failed to link ${account.provider}:`, linkError)
                // Continue anyway - user can still sign in
              }
            }

            try {
              if (existingUser.role === 'SUPER_ADMIN') {
                await ensureSuperAdminTenantForUser(existingUser.id)
              }
            } catch (e) { }
          } else {
            // Create new user from OAuth profile
            const email = user.email!.toLowerCase()
            const newUser = await prisma.$transaction(async (tx) => {
              const total = await tx.user.count()
              const bootstrapRole = total === 0 ? 'SUPER_ADMIN' : 'USER'
              return tx.user.create({
                data: {
                  email,
                  name: user.name || '',
                  image: user.image,
                  emailVerified: new Date(),
                  role: bootstrapRole,
                }
              })
            })

            // Create Account record for OAuth provider
            try {
              const expiresAt = account.expires_at
                ? BigInt(Math.floor(Number(account.expires_at)))
                : null

              await prisma.account.create({
                data: {
                  userId: newUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: expiresAt,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state as string | null,
                }
              })
            } catch (accountError) {
              console.error(`❌ Failed to create account record:`, accountError)
            }

            try {
              if (newUser.role === 'SUPER_ADMIN') {
                await ensureSuperAdminTenantForUser(newUser.id)
              }
            } catch (e) { }

            console.log(`✅ Created new user from ${account.provider}: ${user.email}`)
          }
          return true
        } catch (error) {
          console.error('OAuth sign-in error:', error)
          return true // Still allow sign-in even if DB operation fails
        }
      }
      return true
    },
    async jwt({ token, user, account, profile, trigger }) {
      // For OAuth providers, always fetch from DB first
      if (account?.provider === 'google' || account?.provider === 'instagram') {
        try {
          const email = user?.email || token.email
          if (email) {
            const dbUser = await prisma.user.findUnique({
              where: { email: email as string }
            })
            if (dbUser) {
              token.id = String(dbUser.id)
              token.role = dbUser.role as UserRole
              token.email = dbUser.email
              token.name = dbUser.name
              token.picture = dbUser.image
              // Generate a mock access token for OAuth users
              if (!token.accessToken) {
                token.accessToken = `oauth_${dbUser.id}`
              }
              console.log(`✅ JWT: Loaded user from DB - ${dbUser.email} (ID: ${dbUser.id})`)
            } else {
              console.error('❌ JWT: User not found in DB after signIn callback')
            }
          }
        } catch (error) {
          console.error('❌ JWT: Error fetching user from DB:', error)
        }
      }

      // Initial sign in for credentials provider
      if (user && !account?.provider) {
        // Convert BigInt to string for JSON serialization
        token.id = typeof user.id === 'bigint' ? String(user.id) : user.id
        token.role = (user as any).role || 'USER'
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        if ((user as any).gender) {
          token.gender = (user as any).gender as Gender
        }
        // Propagate currentTenantId
        if ((user as any).currentTenantId) {
          token.currentTenantId = (user as any).currentTenantId
        }
        // Persist backend JWT into NextAuth token (for credentials provider)
        if ((user as any).accessToken) {
          token.accessToken = (user as any).accessToken
        }
      }

      // For existing tokens without ID, try to fetch from DB
      if (!token.id && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string }
          })
          if (dbUser) {
            token.id = String(dbUser.id)
            token.role = dbUser.role as UserRole
            token.currentTenantId = dbUser.currentTenantId || undefined
            // Ensure accessToken exists
            if (!token.accessToken) {
              token.accessToken = `session_${dbUser.id}_${Date.now()}`
            }
          }
        } catch (error) {
          console.error('Error fetching user:', error)
        }
      }

      // Fetch tenant role if user has a current tenant
      if (token.id && token.currentTenantId) {
        try {
          const tenantMember = await prisma.tenantMember.findUnique({
            where: {
              tenantId_userId: {
                tenantId: token.currentTenantId as string,
                userId: BigInt(token.id as string)
              }
            },
            select: { role: true }
          })
          if (tenantMember) {
            token.tenantRole = tenantMember.role as UserRole
          }
        } catch (error) {
          console.error('Error fetching tenant role:', error)
        }
      }

      // If no current tenant is set, auto-assign the first ACTIVE membership (prefer OWNER/TENANT_ADMIN)
      if (token.id && !token.currentTenantId) {
        try {
          const memberships = await prisma.tenantMember.findMany({
            where: { userId: BigInt(token.id as string), status: 'ACTIVE' },
            select: { tenantId: true, role: true, joinedAt: true, updatedAt: true }
          })
          if (memberships && memberships.length > 0) {
            const owner = memberships.find(m => m.role === 'OWNER')
            const tenantAdmin = memberships.find(m => m.role === 'TENANT_ADMIN')
            const picked = owner || tenantAdmin || memberships[0]
            token.currentTenantId = picked.tenantId
            token.tenantRole = (picked.role as any) as UserRole
          }
        } catch (err) {
          console.error('Error auto-assigning tenant context:', err)
        }
      }

      // Ensure we have user ID from sub as fallback
      if (!token.id && token.sub) {
        token.id = token.sub
      }

      // Ensure we have a role
      if (!token.role) {
        token.role = 'USER'
      }

      // Ensure we always have an accessToken
      if (!token.accessToken && token.id) {
        token.accessToken = `token_${token.id}_${Date.now()}`
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string || token.sub as string
        session.user.role = (token.role as UserRole) || 'USER'
        session.user.email = token.email as string
        session.user.name = token.name as string
          ; (session.user as any).currentTenantId = token.currentTenantId as string | undefined
          ; (session.user as any).tenantRole = token.tenantRole as UserRole | undefined
        if (token.gender) {
          ; (session.user as any).gender = token.gender as Gender
        }
        console.log(`✅ Session: User ${session.user.email} (ID: ${session.user.id}, Role: ${session.user.role})`)
      }
      if (token.accessToken) {
        ; (session as any).accessToken = token.accessToken
        console.log(`🔑 Session has accessToken: ${String(token.accessToken).substring(0, 20)}...`)
      } else {
        console.log(`⚠️  Session missing accessToken!`)
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      try {
        // If URL already starts with baseUrl, use it
        if (url.startsWith(baseUrl)) return url
        // If URL is a relative path, append to baseUrl
        if (url.startsWith('/')) return `${baseUrl}${url}`
        // For OAuth callbacks, redirect to dashboard
        return `${baseUrl}/dashboard`
      } catch {
        return `${baseUrl}/dashboard`
      }
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  cookies: {
    sessionToken: {
      name: `${(process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.NODE_ENV === 'production') ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.NODE_ENV === 'production',
      },
    },
  },
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export const getAuthSession = () => getServerSession(authOptions)

// Helper function to check user role
export const checkUserRole = (session: any, allowedRoles: string[]) => {
  if (!session?.user?.role) return false
  return allowedRoles.includes(String(session.user.role))
}
