'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

const variantStyles = {
  primary: {
    bg: 'bg-gradient-to-br from-rose-50 via-white to-pink-50',
    iconBg: 'bg-gradient-to-br from-rose-100 to-pink-200',
    iconColor: 'text-rose-600',
    border: 'border-rose-100',
    shadow: 'shadow-[8px_8px_16px_rgba(225,29,72,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)]'
  },
  secondary: {
    bg: 'bg-gradient-to-br from-slate-50 via-white to-slate-50',
    iconBg: 'bg-gradient-to-br from-slate-100 to-slate-200',
    iconColor: 'text-slate-600',
    border: 'border-slate-100',
    shadow: 'shadow-[8px_8px_16px_rgba(100,116,139,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)]'
  },
  success: {
    bg: 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50',
    iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-100',
    shadow: 'shadow-[8px_8px_16px_rgba(16,185,129,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)]'
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-50 via-white to-amber-50',
    iconBg: 'bg-gradient-to-br from-amber-100 to-amber-200',
    iconColor: 'text-amber-600',
    border: 'border-amber-100',
    shadow: 'shadow-[8px_8px_16px_rgba(245,158,11,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)]'
  },
  danger: {
    bg: 'bg-gradient-to-br from-rose-50 via-white to-rose-50',
    iconBg: 'bg-gradient-to-br from-rose-100 to-rose-200',
    iconColor: 'text-rose-600',
    border: 'border-rose-100',
    shadow: 'shadow-[8px_8px_16px_rgba(244,63,94,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)]'
  },
  info: {
    bg: 'bg-gradient-to-br from-sky-50 via-white to-sky-50',
    iconBg: 'bg-gradient-to-br from-sky-100 to-sky-200',
    iconColor: 'text-sky-600',
    border: 'border-sky-100',
    shadow: 'shadow-[8px_8px_16px_rgba(14,165,233,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)]'
  }
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'primary',
  trend,
  className
}: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:scale-[1.02]',
        styles.bg,
        styles.border,
        styles.shadow,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-slate-500">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'rounded-2xl p-4 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),inset_2px_2px_5px_rgba(0,0,0,0.1)]',
            styles.iconBg
          )}
        >
          <Icon className={cn('w-6 h-6 stroke-[2]', styles.iconColor)} />
        </div>
      </div>
    </motion.div>
  )
}
