'use client'

import { RegisterForm } from './RegisterForm'
import { AuthLayout } from './AuthLayout'
import { motion } from 'framer-motion'

export default function RegisterClient() {
  return (
    <AuthLayout
      animationType="register"
      backgroundImageUrl="https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=1600&auto=format&fit=crop"
      backgroundOnly
      title="Create an Account"
      subtitle="Join us to start planning your events"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <RegisterForm />
      </motion.div>
    </AuthLayout>
  )
}
