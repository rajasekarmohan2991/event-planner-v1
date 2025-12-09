'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Building2, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  companyName: z.string().optional(),
  companySlug: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [initialPulse, setInitialPulse] = useState(true)
  const [registrationType, setRegistrationType] = useState<'individual' | 'company'>('individual')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {},
  })

  // role is always USER (hidden from UI)

  // Brief initial shimmer on mount for delightful feedback
  useEffect(() => {
    const t = setTimeout(() => setInitialPulse(false), 350)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setValue('name', session.user.name)
      if (session.user.email) setValue('email', session.user.email)
      router.replace('/')
    }
  }, [session, setValue, router])

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    setCheckingSlug(true)
    try {
      const res = await fetch(`/api/tenants/check-slug?slug=${slug}`)
      const data = await res.json()
      setSlugAvailable(data.available)
    } catch (error) {
      console.error('Failed to check slug:', error)
    } finally {
      setCheckingSlug(false)
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    
    try {
      setServerError(null)
      
      if (registrationType === 'company') {
        if (!data.companyName || !data.companySlug) {
          throw new Error('Company name and slug are required')
        }
        if (slugAvailable === false) {
          throw new Error('Company slug is not available')
        }
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          inviteCode: searchParams?.get('invite'),
          ...(registrationType === 'company' ? {
            companyName: data.companyName,
            companySlug: data.companySlug
          } : {})
        }),
      })

      const raw = await response.text().catch(() => '')
      const isJson = (response.headers.get('content-type') || '').includes('application/json')
      const responseData = isJson && raw ? JSON.parse(raw) : (raw ? { message: raw } : {})
      if (!response.ok) {
        throw new Error(responseData?.message || 'Registration failed')
      }

      // Redirect to login with success message
      router.push(
        `/auth/login?registered=true`
      )
    } catch (error: any) {
      setServerError(error?.message || 'Registration failed')
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
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
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
            <div className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social signup moved to bottom */}

      {/* Register Form */}
      {!isLoading && (
        <motion.form 
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="wait">
            {(Object.keys(errors).length > 0 || serverError) && (
              <Alert className="bg-red-50 border-red-200 text-red-800 mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {serverError && <div>{serverError}</div>}
                  {Object.values(errors).map((error, index) => (
                    <div key={index}>{error.message as string}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </AnimatePresence>

          {/* Registration Type Toggle */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRegistrationType('individual')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                registrationType === 'individual'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <User className={`w-6 h-6 mb-2 ${registrationType === 'individual' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">Individual</span>
            </button>
            <button
              type="button"
              onClick={() => setRegistrationType('company')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                registrationType === 'company'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <Building2 className={`w-6 h-6 mb-2 ${registrationType === 'company' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="font-medium text-sm">Company</span>
            </button>
          </div>

          {/* Company Fields */}
          <AnimatePresence mode="wait">
            {registrationType === 'company' && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="space-y-4 mb-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <MotionInput
                    id="companyName"
                    placeholder="Acme Inc."
                    {...register('companyName', {
                      onChange: (e) => {
                        const name = e.target.value
                        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                        setValue('companySlug', slug)
                        
                        // Debounce slug check
                        const timer = setTimeout(() => {
                          checkSlugAvailability(slug)
                        }, 500)
                      }
                    })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySlug">Company Slug</Label>
                  <div className="relative">
                    <MotionInput
                      id="companySlug"
                      placeholder="acme-inc"
                      {...register('companySlug', {
                         onChange: (e) => {
                            const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                            setValue('companySlug', slug)
                            const timer = setTimeout(() => {
                              checkSlugAvailability(slug)
                            }, 500)
                         }
                      })}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingSlug && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                      {!checkingSlug && slugAvailable === true && <Check className="w-4 h-4 text-green-600" />}
                      {!checkingSlug && slugAvailable === false && <X className="w-4 h-4 text-red-600" />}
                    </div>
                  </div>
                  {slugAvailable === false && (
                    <p className="text-xs text-red-600">Slug already taken</p>
                  )}
                </div>
                <div className="h-px bg-gray-200 my-4" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <MotionInput
              id="name"
              placeholder="John Doe"
              {...register('name')}
              disabled={isLoading}
              whileFocus={{ scale: 1.01 }}
            />
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
              {...register('email')}
              disabled={isLoading}
              whileFocus={{ scale: 1.01 }}
            />
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
                placeholder="At least 8 characters"
                {...register('password')}
                disabled={isLoading}
                whileFocus={{ scale: 1.01 }}
                className="pr-10"
              />
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
                placeholder="Re-enter password"
                {...register('confirmPassword')}
                disabled={isLoading}
                whileFocus={{ scale: 1.01 }}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
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
          </motion.div>

          {/* Account Type removed: defaulting to USER without exposing UI */}

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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </MotionButton>
          </motion.div>

          <motion.div 
            className="text-center pt-2" 
            variants={itemVariants}
          >
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.form>
      )}
    </div>
  )
}
