'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface NeumorphicButtonProps {
  children: React.ReactNode
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const variantStyles = {
  primary: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[4px_4px_12px_rgba(225,29,72,0.3),-4px_-4px_12px_rgba(244,63,94,0.1)] hover:shadow-[6px_6px_16px_rgba(225,29,72,0.4),-6px_-6px_16px_rgba(244,63,94,0.2)]',
  secondary: 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 shadow-[4px_4px_12px_rgba(100,116,139,0.2),-4px_-4px_12px_rgba(255,255,255,0.9)] hover:shadow-[6px_6px_16px_rgba(100,116,139,0.3),-6px_-6px_16px_rgba(255,255,255,1)]',
  success: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[4px_4px_12px_rgba(16,185,129,0.3),-4px_-4px_12px_rgba(52,211,153,0.1)] hover:shadow-[6px_6px_16px_rgba(16,185,129,0.4),-6px_-6px_16px_rgba(52,211,153,0.2)]',
  warning: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-[4px_4px_12px_rgba(245,158,11,0.3),-4px_-4px_12px_rgba(251,191,36,0.1)] hover:shadow-[6px_6px_16px_rgba(245,158,11,0.4),-6px_-6px_16px_rgba(251,191,36,0.2)]',
  danger: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[4px_4px_12px_rgba(244,63,94,0.3),-4px_-4px_12px_rgba(251,113,133,0.1)] hover:shadow-[6px_6px_16px_rgba(244,63,94,0.4),-6px_-6px_16px_rgba(251,113,133,0.2)]',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-50'
}

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
}

export function NeumorphicButton({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button'
}: NeumorphicButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 justify-center',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </motion.button>
  )
}
