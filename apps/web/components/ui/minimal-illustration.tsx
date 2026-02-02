'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MinimalIllustrationProps {
  type: 'empty-state' | 'success' | 'error' | 'loading' | 'no-events' | 'no-registrations' | 'calendar' | 'analytics'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-32 h-32',
  md: 'w-48 h-48',
  lg: 'w-64 h-64'
}

export function MinimalIllustration({ type, size = 'md', className }: MinimalIllustrationProps) {
  const illustrations = {
    'empty-state': (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="url(#grad1)" opacity="0.1"/>
        <rect x="60" y="70" width="80" height="60" rx="8" fill="url(#grad2)" opacity="0.3"/>
        <circle cx="100" cy="100" r="15" fill="url(#grad3)"/>
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    ),
    'success': (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="url(#success-grad1)" opacity="0.1"/>
        <circle cx="100" cy="100" r="50" fill="url(#success-grad2)" opacity="0.2"/>
        <path d="M70 100 L90 120 L130 80" stroke="url(#success-grad3)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="success-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="success-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="success-grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
    ),
    'no-events': (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="50" width="120" height="100" rx="12" fill="url(#event-grad1)" opacity="0.1"/>
        <rect x="50" y="40" width="100" height="120" rx="12" fill="url(#event-grad2)" opacity="0.2"/>
        <circle cx="100" cy="100" r="25" fill="url(#event-grad3)" opacity="0.3"/>
        <path d="M70 80 L70 50 M130 80 L130 50" stroke="url(#event-grad4)" strokeWidth="6" strokeLinecap="round"/>
        <defs>
          <linearGradient id="event-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="event-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="event-grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="event-grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    ),
    'no-registrations': (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="80" r="30" fill="url(#reg-grad1)" opacity="0.2"/>
        <path d="M70 120 Q100 110 130 120 L130 160 Q100 170 70 160 Z" fill="url(#reg-grad2)" opacity="0.2"/>
        <circle cx="100" cy="80" r="15" fill="url(#reg-grad3)" opacity="0.4"/>
        <defs>
          <linearGradient id="reg-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="reg-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="reg-grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    ),
    'calendar': (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="60" width="120" height="100" rx="12" fill="url(#cal-grad1)" opacity="0.1"/>
        <rect x="40" y="60" width="120" height="30" rx="12" fill="url(#cal-grad2)" opacity="0.3"/>
        <circle cx="70" cy="75" r="4" fill="url(#cal-grad3)"/>
        <circle cx="100" cy="75" r="4" fill="url(#cal-grad3)"/>
        <circle cx="130" cy="75" r="4" fill="url(#cal-grad3)"/>
        <rect x="60" y="110" width="15" height="15" rx="3" fill="url(#cal-grad4)" opacity="0.5"/>
        <rect x="92" y="110" width="15" height="15" rx="3" fill="url(#cal-grad4)" opacity="0.5"/>
        <rect x="124" y="110" width="15" height="15" rx="3" fill="url(#cal-grad4)" opacity="0.5"/>
        <defs>
          <linearGradient id="cal-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="cal-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="cal-grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="cal-grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    ),
    'analytics': (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="50" y="120" width="20" height="40" rx="4" fill="url(#ana-grad1)" opacity="0.3"/>
        <rect x="80" y="90" width="20" height="70" rx="4" fill="url(#ana-grad2)" opacity="0.4"/>
        <rect x="110" y="70" width="20" height="90" rx="4" fill="url(#ana-grad3)" opacity="0.5"/>
        <rect x="140" y="100" width="20" height="60" rx="4" fill="url(#ana-grad4)" opacity="0.4"/>
        <path d="M50 130 L80 100 L110 80 L140 110" stroke="url(#ana-grad5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <defs>
          <linearGradient id="ana-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="ana-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="ana-grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="ana-grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="ana-grad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    ),
    'error': (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="url(#error-grad1)" opacity="0.1"/>
        <circle cx="100" cy="100" r="50" fill="url(#error-grad2)" opacity="0.2"/>
        <path d="M80 80 L120 120 M120 80 L80 120" stroke="url(#error-grad3)" strokeWidth="8" strokeLinecap="round"/>
        <defs>
          <linearGradient id="error-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="error-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <linearGradient id="error-grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
      </svg>
    ),
    'loading': (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.circle
          cx="100"
          cy="100"
          r="60"
          stroke="url(#load-grad1)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="180 180"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <defs>
          <linearGradient id="load-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(sizeClasses[size], className)}
    >
      {illustrations[type]}
    </motion.div>
  )
}
