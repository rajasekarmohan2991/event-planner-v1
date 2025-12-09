import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
      currentTenantId?: string
    } & DefaultSession['user']
  }

  /**
   * Extend the built-in user types
   */
  interface User extends DefaultUser {
    role: string
    currentTenantId?: string
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT types
   */
  interface JWT {
    id: string
    role: string
    currentTenantId?: string
  }
}
