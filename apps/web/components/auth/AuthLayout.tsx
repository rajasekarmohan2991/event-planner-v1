'use client'

import { ReactNode, useState, useEffect } from 'react'
import { AuthIllustration } from './AuthIllustration'
import { useSession } from 'next-auth/react'
import { Lock, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Note: LottieAnimation intentionally removed from this layout to avoid runtime element-type errors

type AnimationType = 'login' | 'register' | 'success' | 'loading'

interface AuthLayoutProps {
  children: ReactNode
  animationType?: AnimationType
  lottieSrc?: string
  backgroundImageUrl?: string
  title?: string
  subtitle?: string
  animationPlacement?: 'left' | 'form'
  backgroundOnly?: boolean
  disableBackgroundAnimations?: boolean
}

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

const Lottie = dynamic(() => import('@/components/media/Lottie'), { ssr: false, loading: () => null })

export function AuthLayout({ children, animationType = 'login', lottieSrc, backgroundImageUrl, title, subtitle, animationPlacement = 'left', backgroundOnly = false, disableBackgroundAnimations = false }: AuthLayoutProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Simulate loading animation
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [animationType])

  const getIllustrationFallback = () => {
    return (
      <motion.div 
        className="w-full h-full flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center p-6">
          <motion.div 
            className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Lock className="h-12 w-12 text-primary" />
          </motion.div>
          <motion.h3 
            className="text-2xl font-semibold text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Welcome to Ayphen
          </motion.h3>
          <motion.p 
            className="mt-2 text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Plan amazing events with ease
          </motion.p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 isolate">
      
      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left side - Illustration */}
      <div className="w-full md:w-3/5 xl:w-2/3 bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 flex items-center justify-center p-4 md:p-8 xl:p-12 relative overflow-hidden pointer-events-none select-none">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {backgroundImageUrl && (
            <div
              className="absolute inset-0 bg-center bg-cover opacity-20"
              style={{ backgroundImage: `url(${backgroundImageUrl})` }}
              aria-hidden
            />
          )}
          {!backgroundOnly && !disableBackgroundAnimations && (
            <>
              <motion.div
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"
              />
              <motion.div
                animate={{
                  x: [0, -80, 0],
                  y: [0, 100, 0],
                  rotate: [0, -180, -360],
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute bottom-20 right-20 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl"
              />
              <motion.div
                animate={{
                  x: [0, 60, 0],
                  y: [0, -80, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-1/2 left-1/4 w-16 h-16 bg-indigo-200/25 rounded-full blur-lg"
              />
            </>
          )}
        </div>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              className="flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </motion.div>
          ) : (
            !backgroundOnly && animationPlacement === 'left' && lottieSrc ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 w-full h-full flex items-center justify-center"
              >
                <Lottie
                  src={lottieSrc}
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100vh' }}
                />
              </motion.div>
            ) : (
              !backgroundOnly ? <AuthIllustration animationType={animationType} /> : <div className="w-full h-full" />
            )
          )}
        </AnimatePresence>
      </div>
      
      {/* Right side - Form */}
      <div className="w-full md:w-2/5 xl:w-1/3 flex items-center justify-center p-8 xl:p-12 bg-white/80 backdrop-blur-sm relative z-10">
        <motion.div 
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {!backgroundOnly && animationPlacement === 'form' && lottieSrc && (
            <motion.div
              className="-mt-4 mb-4 flex items-center justify-center"
              variants={itemVariants}
            >
              <Lottie src={lottieSrc} loop autoplay style={{ width: 320, height: 220, maxWidth: '80vw' }} />
            </motion.div>
          )}
          <motion.div className="text-center mb-8" variants={itemVariants}>
            <motion.h1 
              className="text-3xl font-bold text-gray-900 mb-2"
              variants={itemVariants}
            >
              {title ?? (
                animationType === 'login' ? 'Welcome Back' :
                animationType === 'register' ? 'Create an Account' :
                animationType === 'success' ? 'Success!' :
                'Loading...'
              )}
            </motion.h1>
            <motion.p 
              className="text-gray-600"
              variants={itemVariants}
            >
              {subtitle ?? (
                animationType === 'login' ? 'Sign in to your account to continue' :
                animationType === 'register' ? 'Join us to start planning your events' :
                animationType === 'success' ? 'Your action was successful!' :
                'Please wait while we process your request'
              )}
            </motion.p>
          </motion.div>
          
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="space-y-6">
                <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-md animate-pulse"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
