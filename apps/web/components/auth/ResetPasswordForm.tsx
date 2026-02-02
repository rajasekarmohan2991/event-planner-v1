'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LottieAnimation } from '@/components/ui/LottieAnimation'
import { AuthAnimations } from '@/components/ui/LottieAnimation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

// Form validation schema
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Must contain at least one number' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

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

const MotionButton = motion(Button)
const MotionInput = motion(Input)
const MotionAlert = motion(Alert)

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (isLoading) return
    
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password')
      }

      setSuccess('Your password has been reset successfully. Redirecting to login...')
      reset()
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An error occurred. Please try again.'
      
      setError(errorMessage)
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setError('')
      }, 5000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div 
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Success Message */}
      <AnimatePresence mode="wait">
        {success && (
          <MotionAlert
            className="mb-6 bg-green-50 border-green-200 text-green-800"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </MotionAlert>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <MotionAlert
            className="mb-6 bg-red-50 border-red-200 text-red-800"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </MotionAlert>
        )}
      </AnimatePresence>

      {/* Success indicator */}
      <motion.div 
        className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
        variants={itemVariants}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <CheckCircle className="h-8 w-8 text-green-600" />
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
        {/* New Password */}
        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            New Password
          </Label>
          <div className="relative">
            <MotionInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
              whileFocus={{ scale: 1.01 }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <PasswordStrengthMeter password={formData.password} className="mt-2" />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
          )}
        </motion.div>

        {/* Confirm New Password */}
        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="confirmPassword" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Confirm New Password
          </Label>
          <div className="relative">
            <MotionInput
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              {...register('confirmPassword')}
              className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              whileFocus={{ scale: 1.01 }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <MotionButton
            type="submit"
            className="w-full"
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </MotionButton>
        </motion.div>
      </form>
    </motion.div>
  )
}
