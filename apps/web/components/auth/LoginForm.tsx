'use client'

import { useState, useCallback, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'

import { motion, AnimatePresence } from 'framer-motion'

const MotionButton = motion(Button)
const MotionAlert = motion(Alert)

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

type SocialProvider = 'google' | 'instagram' | null;

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [socialLoading, setSocialLoading] = useState<SocialProvider>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [initialPulse, setInitialPulse] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') || '/'
  const verified = searchParams?.get('verified')
  const registered = searchParams?.get('registered')
  const urlError = searchParams?.get('error')

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const mapAuthError = useCallback((codeOrMsg?: string) => {
    const code = String(codeOrMsg || '').trim()

    // Check for common error patterns
    if (code.toLowerCase().includes('unauthorized') || code.toLowerCase().includes('invalid credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.'
    }
    if (code.toLowerCase().includes('email') && code.toLowerCase().includes('password')) {
      return 'Invalid email or password.'
    }

    switch (code) {
      case 'CredentialsSignin':
        return 'Invalid email or password.'
      case 'OAuthAccountNotLinked':
        return 'Please sign in with the original provider linked to this email.'
      case 'AccessDenied':
        return 'Access denied. Please contact the administrator.'
      case 'Configuration':
        return 'Authentication service is temporarily unavailable. Please try again later.'
      case 'Verification':
        return 'The verification link is invalid or has expired.'
      case 'OAuthSignin':
        return 'Error connecting to authentication provider. Please try again.'
      case 'OAuthCallback':
        return 'Error during authentication. Please try again.'
      case 'OAuthCreateAccount':
        return 'Could not create account. Please try again or contact support.'
      case 'EmailCreateAccount':
        return 'Could not create account with this email.'
      case 'Callback':
        return 'Authentication callback error. Please try again.'
      case 'OAuthAccountNotLinked':
        return 'This email is already registered with a different sign-in method.'
      case 'EmailSignin':
        return 'Error sending verification email. Please try again.'
      case 'SessionRequired':
        return 'Please sign in to continue.'
      default:
        // If it's a long technical message, simplify it
        if (code.length > 100) {
          return 'Sign in failed. Please check your credentials and try again.'
        }
        // If backend returned a message and it was surfaced, prefer it
        return code || 'Sign in failed. Please try again.'
    }
  }, [])

  // Brief initial shimmer on mount for delightful feedback
  useEffect(() => {
    const t = setTimeout(() => setInitialPulse(false), 350)
    return () => clearTimeout(t)
  }, [])

  // Surface errors passed via query (?error=...)
  useEffect(() => {
    if (urlError) {
      setError(mapAuthError(urlError))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlError])

  const handleSocialLogin = async (provider: 'google' | 'instagram') => {
    setSocialLoading(provider)
    setError('')
    try {
      console.log(`[LoginForm] Starting ${provider} OAuth...`)
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: '/dashboard',
      })

      console.log(`[LoginForm] ${provider} OAuth result:`, result)

      if (result?.error) {
        console.error(`[LoginForm] ${provider} OAuth error:`, result.error)
        setError(`Failed to sign in with ${provider}. Please try again.`)
        setSocialLoading(null)
      } else if (result?.ok) {
        console.log(`[LoginForm] ${provider} OAuth successful, session should be created`)
        // Don't redirect here - let LoginClient handle it
        // The session will be updated and LoginClient will redirect
      }
    } catch (error) {
      console.error(`[LoginForm] ${provider} OAuth exception:`, error)
      setError('Failed to sign in. Please try again.')
      setSocialLoading(null)
    }
  }

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl: '/dashboard',
      })

      if (result?.error) {
        // Parse JSON error if it's a stringified object
        let errorMessage = result.error
        try {
          const parsed = JSON.parse(result.error)
          if (parsed.error) {
            errorMessage = parsed.error
          } else if (parsed.message) {
            errorMessage = parsed.message
          }
        } catch {
          // Not JSON, use as is
        }
        setError(mapAuthError(errorMessage))
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Unable to sign in. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Micro skeleton on initial mount */}
      <AnimatePresence>
        {initialPulse && !isLoading && (
          <motion.div
            className="space-y-3 mb-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
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

      {/* Verified/Registered Message */}
      <AnimatePresence mode="wait">
        {verified && !success && (
          <MotionAlert
            className="mb-6 bg-blue-50 border-blue-200 text-blue-800"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Your email has been verified! You can now log in.</AlertDescription>
          </MotionAlert>
        )}
        {registered && !success && (
          <MotionAlert
            className="mb-6 bg-green-50 border-green-200 text-green-800"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Registration successful! Please check your email to verify your account.</AlertDescription>
          </MotionAlert>
        )}
      </AnimatePresence>

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
            <div className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
            </div>
            <div className="flex justify-end">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Form */}
      {!isLoading && (
        <Form {...form}>
          <motion.form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            autoComplete="off"
          >
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </FormLabel>
                    <FormControl>
                      <motion.div whileFocus={{ scale: 1.01 }}>
                        <Input
                          placeholder="name@example.com"
                          type="email"
                          disabled={isLoading}
                          {...field}
                        />
                      </motion.div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Password
                      </FormLabel>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <motion.div whileFocus={{ scale: 1.01 }}>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            disabled={isLoading}
                            className="pr-10"
                            autoComplete="current-password"
                            {...field}
                          />
                        </motion.div>
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div className="space-y-4" variants={itemVariants}>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </motion.div>

            {/* Social Login Buttons - Moved inside form container for better stagger effect */}
            <motion.div className="relative py-4" variants={itemVariants}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 gap-3" variants={itemVariants}>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading || !!socialLoading}
                onClick={() => handleSocialLogin('google')}
                className="w-full flex items-center justify-center gap-2"
              >
                {socialLoading === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <FcGoogle className="h-4 w-4" />
                    <span>Google</span>
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>
        </Form>
      )}
    </div>
  )
}
