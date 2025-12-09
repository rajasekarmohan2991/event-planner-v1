'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LottieAnimation } from '@/components/ui/LottieAnimation'
import { AuthAnimations } from '@/components/ui/LottieAnimation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

// Form validation schema
const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Must contain at least one number' }),
  confirmPassword: z.string(),
  gender: z.enum(['MALE','FEMALE','OTHER']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

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

export function RegistrationForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    if (isLoading) return
    
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          gender: data.gender || 'OTHER',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed')
      }

      setSuccess('Registration successful! Please check your email to verify your account.')
      
      // Auto-login after successful registration
      await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      })
      
      // Redirect to verification page
      router.push('/auth/verify-email?email=' + encodeURIComponent(data.email))
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An error occurred during registration. Please try again.'
      
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
      className="w-full max-w-md mx-auto"
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

      {/* Title block (replaces inline animation to avoid duplicate artwork) */}
      <motion.div 
        className="mx-auto mb-6 text-center"
        variants={itemVariants}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Create your account</h3>
        </div>
      </motion.div>

      {/* Registration Form */}
      <motion.form 
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        variants={containerVariants}
        autoComplete="off"
      >
        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="gender" className="flex items-center gap-2">
            Gender
          </Label>
          <select
            id="gender"
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            disabled={isLoading}
            {...register('gender')}
          >
            <option value="">Prefer not to say</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </motion.div>
        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name
          </Label>
          <div className="relative">
            <MotionInput
              id="name"
              placeholder="John Doe"
              disabled={isLoading}
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
              whileFocus={{ scale: 1.01 }}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </motion.div>

        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <MotionInput
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={isLoading}
            {...register('email')}
            className={errors.email ? 'border-red-500' : ''}
            whileFocus={{ scale: 1.01 }}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </motion.div>

        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password
          </Label>
          <div className="relative">
            <MotionInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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

        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="confirmPassword" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Confirm Password
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </MotionButton>
        </motion.div>
      </motion.form>

      <motion.p 
        className="mt-6 text-center text-sm text-gray-500" 
        variants={itemVariants}
      >
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:underline"
          onClick={(e) => isLoading && e.preventDefault()}
        >
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  )
}
