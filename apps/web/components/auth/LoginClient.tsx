'use client'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginClient() {
  return (
    <AuthLayout
      lottieSrc="/animations/signin.json"
      animationPlacement="left"
      disableBackgroundAnimations
      title="Welcome"
      subtitle="Sign in to your account to continue"
    >
      <div className="w-full">
        <LoginForm />
      </div>
    </AuthLayout>
  )
}
