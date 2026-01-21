'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
import { Loader2, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Building2, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SocialSignUp, TermsCheckbox } from './SocialSignUp'

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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  companyName: z.string().optional(),
  companySlug: z.string().optional(),
  country: z.string().optional(),
  registrationNumber: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
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

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      companySlug: '',
      country: '',
      registrationNumber: '',
      acceptTerms: false,
    },
  })

  // Brief initial shimmer on mount for delightful feedback
  useEffect(() => {
    const t = setTimeout(() => setInitialPulse(false), 350)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (session?.user) {
      if (session.user.name) form.setValue('name', session.user.name)
      if (session.user.email) form.setValue('email', session.user.email)
      router.replace('/')
    }
  }, [session, form, router])

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
            companySlug: data.companySlug,
            country: data.country,
            registrationNumber: data.registrationNumber
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
            {/* ... other loading skeletons ... */}
            <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register Form */}
      {!isLoading && (
        <Form {...form}>
          <motion.form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence mode="wait">
              {(Object.keys(form.formState.errors).length > 0 || serverError) && (
                <MotionAlert
                  className="bg-red-50 border-red-200 text-red-800 mb-6"
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {serverError && <div>{serverError}</div>}
                    {Object.values(form.formState.errors).map((error, index) => (
                      <div key={index}>{error.message as string}</div>
                    ))}
                  </AlertDescription>
                </MotionAlert>
              )}
            </AnimatePresence>

            {/* Registration Type Toggle */}
            <motion.div className="grid grid-cols-2 gap-4 mb-6" variants={itemVariants}>
              <button
                type="button"
                onClick={() => setRegistrationType('individual')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${registrationType === 'individual'
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
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${registrationType === 'company'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
              >
                <Building2 className={`w-6 h-6 mb-2 ${registrationType === 'company' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">Company</span>
              </button>
            </motion.div>

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
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <motion.div whileFocus={{ scale: 1.01 }}>
                            <Input
                              placeholder="Acme Inc."
                              disabled={isLoading}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                const name = e.target.value
                                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                                form.setValue('companySlug', slug)

                                // Debounce slug check
                                const timer = setTimeout(() => {
                                  checkSlugAvailability(slug)
                                }, 500)
                              }}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companySlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Slug</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <motion.div whileFocus={{ scale: 1.01 }}>
                              <Input
                                placeholder="acme-inc"
                                disabled={isLoading}
                                className="pr-10"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                  form.setValue('companySlug', slug)
                                  const timer = setTimeout(() => {
                                    checkSlugAvailability(slug)
                                  }, 500)
                                }}
                              />
                            </motion.div>
                          </FormControl>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {checkingSlug && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                            {!checkingSlug && slugAvailable === true && <Check className="w-4 h-4 text-green-600" />}
                            {!checkingSlug && slugAvailable === false && <X className="w-4 h-4 text-red-600" />}
                          </div>
                        </div>
                        {slugAvailable === false && (
                          <p className="text-xs text-destructive mt-1">Slug already taken</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Country</FormLabel>
                        <FormControl>
                          <motion.div whileFocus={{ scale: 1.01 }}>
                            <select
                              {...field}
                              disabled={isLoading}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select Country</option>
                              <option value="IN">India</option>
                              <option value="US">United States</option>
                              <option value="GB">United Kingdom</option>
                              <option value="CA">Canada</option>
                              <option value="AU">Australia</option>
                              <option value="SG">Singapore</option>
                              <option value="AE">UAE</option>
                              <option value="DE">Germany</option>
                              <option value="FR">France</option>
                              <option value="JP">Japan</option>
                            </select>
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Registration Number</FormLabel>
                        <FormControl>
                          <motion.div whileFocus={{ scale: 1.01 }}>
                            <Input
                              placeholder="e.g., CIN, EIN, or Company Number"
                              disabled={isLoading}
                              {...field}
                            />
                          </motion.div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="h-px bg-gray-200 my-4" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Full Name
                    </FormLabel>
                    <FormControl>
                      <motion.div whileFocus={{ scale: 1.01 }}>
                        <Input placeholder="John Doe" disabled={isLoading} {...field} />
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </FormLabel>
                    <FormControl>
                      <motion.div whileFocus={{ scale: 1.01 }}>
                        <Input placeholder="name@example.com" type="email" disabled={isLoading} {...field} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Password
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <motion.div whileFocus={{ scale: 1.01 }}>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="At least 8 characters"
                            className="pr-10"
                            disabled={isLoading}
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

            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Confirm Password
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <motion.div whileFocus={{ scale: 1.01 }}>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-enter password"
                            className="pr-10"
                            disabled={isLoading}
                            {...field}
                          />
                        </motion.div>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Terms and Conditions */}
            <motion.div variants={itemVariants}>
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TermsCheckbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        error={form.formState.errors.acceptTerms?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <MotionButton
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading || !form.watch('acceptTerms')}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign up now'
                )}
              </MotionButton>
            </motion.div>

            {/* Social Sign Up */}
            <motion.div variants={itemVariants}>
              <SocialSignUp />
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
        </Form>
      )}
    </div>
  )
}
