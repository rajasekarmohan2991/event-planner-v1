'use client'

import { ForgotPasswordForm } from './ForgotPasswordForm'
import { AuthLayout } from './AuthLayout'
import { motion } from 'framer-motion'

export default function ForgotPasswordClient() {
  return (
    <AuthLayout
      animationType="loading"
      backgroundImageUrl="https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=1600&auto=format&fit=crop"
      backgroundOnly
      title="Reset your password"
      subtitle="Enter your email to receive a password reset link"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <ForgotPasswordForm />
      </motion.div>
    </AuthLayout>
  )
}
