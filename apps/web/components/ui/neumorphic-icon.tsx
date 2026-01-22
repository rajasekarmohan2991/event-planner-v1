'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NeumorphicIconProps {
  icon: LucideIcon
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28'
}

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14'
}

const variantClasses = {
  primary: 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),inset_2px_2px_5px_rgba(99,102,241,0.15)]',
  secondary: 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),inset_2px_2px_5px_rgba(100,116,139,0.15)]',
  success: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),inset_2px_2px_5px_rgba(16,185,129,0.15)]',
  warning: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),inset_2px_2px_5px_rgba(245,158,11,0.15)]',
  danger: 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),inset_2px_2px_5px_rgba(244,63,94,0.15)]',
  info: 'bg-gradient-to-br from-sky-50 to-sky-100 text-sky-600 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),inset_2px_2px_5px_rgba(14,165,233,0.15)]'
}

export function NeumorphicIcon({
  icon: Icon,
  size = 'md',
  variant = 'primary',
  className
}: NeumorphicIconProps) {
  return (
    <div
      className={cn(
        'rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <Icon className={cn(iconSizes[size], 'stroke-[2]')} />
    </div>
  )
}

export function NeumorphicIconButton({
  icon: Icon,
  size = 'md',
  variant = 'primary',
  className,
  onClick
}: NeumorphicIconProps & { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <Icon className={cn(iconSizes[size], 'stroke-[2]')} />
    </button>
  )
}
