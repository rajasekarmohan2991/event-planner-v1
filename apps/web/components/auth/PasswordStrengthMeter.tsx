'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

export function PasswordStrengthMeter({ password, className = '' }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<{
    score: number
    label: string
    color: string
    suggestions: string[]
  }>({ score: 0, label: '', color: 'bg-gray-200', suggestions: [] })

  useEffect(() => {
    if (!password) {
      setStrength({
        score: 0,
        label: '',
        color: 'bg-gray-200',
        suggestions: [],
      })
      return
    }

    // Calculate password strength
    const calculateStrength = (pwd: string) => {
      let score = 0
      const suggestions: string[] = []
      
      // Length check
      if (pwd.length < 8) {
        suggestions.push('Use at least 8 characters')
      } else {
        score += 1
      }
      
      // Contains lowercase
      if (!/[a-z]/.test(pwd)) {
        suggestions.push('Add a lowercase letter')
      } else {
        score += 1
      }
      
      // Contains uppercase
      if (!/[A-Z]/.test(pwd)) {
        suggestions.push('Add an uppercase letter')
      } else {
        score += 1
      }
      
      // Contains number
      if (!/[0-9]/.test(pwd)) {
        suggestions.push('Add a number')
      } else {
        score += 1
      }
      
      // Contains special char
      if (!/[^A-Za-z0-9]/.test(pwd)) {
        suggestions.push('Add a special character')
      } else {
        score += 1
      }
      
      // Common passwords or patterns (simplified for example)
      const commonPasswords = ['password', '12345678', 'qwerty', 'letmein']
      if (commonPasswords.some(cp => pwd.toLowerCase().includes(cp))) {
        score = Math.max(0, score - 2)
        suggestions.push('Avoid common words and patterns')
      }
      
      // Sequential characters (e.g., 'abcd', '1234')
      if (/(.)\1{2,}/.test(pwd) || /(123|234|345|456|567|678|789|890)/.test(pwd)) {
        score = Math.max(0, score - 1)
        if (!suggestions.includes('Avoid repeated or sequential characters')) {
          suggestions.push('Avoid repeated or sequential characters')
        }
      }
      
      // Determine strength level
      let label = ''
      let color = ''
      
      if (score <= 1) {
        label = 'Very Weak'
        color = 'bg-red-500'
      } else if (score === 2) {
        label = 'Weak'
        color = 'bg-orange-500'
      } else if (score === 3) {
        label = 'Fair'
        color = 'bg-yellow-500'
      } else if (score === 4) {
        label = 'Strong'
        color = 'bg-blue-500'
      } else {
        label = 'Very Strong'
        color = 'bg-green-500'
      }
      
      return { score, label, color, suggestions: [...new Set(suggestions)] }
    }
    
    // Debounce the calculation
    const timer = setTimeout(() => {
      setStrength(calculateStrength(password))
    }, 200)
    
    return () => clearTimeout(timer)
  }, [password])

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Password Strength: {strength.label || '—'}</span>
        <span className="text-xs font-medium">
          {password ? `${Math.min(100, Math.max(0, strength.score * 20))}%` : '0%'}
        </span>
      </div>
      
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${strength.color || 'bg-gray-200'}`}
          initial={{ width: '0%' }}
          animate={{ 
            width: `${password ? Math.min(100, Math.max(0, strength.score * 20)) : 0}%`,
            backgroundColor: strength.color || 'bg-gray-200'
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      
      <AnimatePresence>
        {password && strength.suggestions.length > 0 && (
          <motion.ul 
            className="text-xs text-gray-500 space-y-1 mt-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {strength.suggestions.map((suggestion, index) => (
              <motion.li 
                key={index}
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <svg 
                  className="w-3 h-3 text-red-500 mr-1.5 mt-0.5 flex-shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
                {suggestion}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      
      {password && strength.score >= 4 && (
        <motion.div 
          className="text-xs text-green-600 flex items-center mt-1"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <svg 
            className="w-3 h-3 mr-1.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          Your password is strong!
        </motion.div>
      )}
    </div>
  )
}
