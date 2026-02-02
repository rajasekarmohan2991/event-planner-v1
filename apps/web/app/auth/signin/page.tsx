import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function SignInRedirect() {
  // Keep this route for compatibility; redirect to canonical login URL
  redirect('/auth/login')
}
