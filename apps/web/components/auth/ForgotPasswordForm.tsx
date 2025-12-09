'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/components/ui/use-toast'

const MotionButton = motion(Button)
const MotionInput = motion(Input)
// Avoid wrapping custom Alert component with motion to prevent invalid element errors

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring',
      stiffness: 100,
      damping: 12
    } 
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2
    }
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialPulse, setInitialPulse] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  // Brief initial shimmer on mount for delightful feedback
  useEffect(() => {
    const t = setTimeout(() => setInitialPulse(false), 350)
    return () => clearTimeout(t)
  }, [])

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Call our local Next.js route which handles token creation and email sending
      const response = await fetch(`/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      })

      if (!response.ok) {
        throw new Error('Failed to send reset email')
      }

      setIsSubmitted(true)
      toast({
        title: 'Reset link sent',
        description: 'Check your inbox for the password reset email.',
      })
    } catch (error) {
      setError('Failed to send reset email. Please try again.')
      toast({
        title: 'Failed to send reset link',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        className="w-full max-w-md mx-auto space-y-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-4">
          <motion.div 
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Mail className="h-8 w-8 text-green-600" />
          </motion.div>
          <motion.h2 
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Check your email
          </motion.h2>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            We've sent a password reset link to your email address.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <MotionButton
            asChild
            className="w-full"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </MotionButton>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Micro skeleton on initial mount */}
      <AnimatePresence>
        {initialPulse && !isLoading && !isSubmitted && (
          <motion.div
            className="space-y-3 mb-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-4 w-44 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-72 bg-gray-100 rounded animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Heading removed per request */}

      {/* Form Skeleton Loader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forgot Password Form */}
      {!isLoading && (
        <motion.form 
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="wait">
            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </AnimatePresence>

          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <MotionInput
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              disabled={isLoading}
              whileFocus={{ scale: 1.01 }}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <MotionButton 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </MotionButton>
          </motion.div>

          <motion.div 
            className="text-center pt-2" 
            variants={itemVariants}
          >
            <Button variant="link" asChild>
              <Link href="/auth/login">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </motion.div>
        </motion.form>
      )}
    </div>
  )
}
