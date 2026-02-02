'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface BrandLogoProps {
  className?: string
  variant?: 'light' | 'dark' // light bg (dark text), dark bg (light text)
  showSubtitle?: boolean
}

export function BrandLogo({
  className,
  variant = "light",
  showSubtitle = true
}: BrandLogoProps) {
  const isDark = variant === "dark"
  const { data: session } = useSession()
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompanyLogo() {
      try {
        const res = await fetch('/api/company/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.logoUrl && data.logoUrl !== '') {
            setCompanyLogo(data.logoUrl)
            setCompanyName(data.companyName || null)
          }
        }
      } catch (error) {
        console.log('Could not fetch company logo, using default')
      }
    }

    // Only fetch company logo if user is logged in and not super admin
    const userRole = (session?.user as any)?.role
    if (session && userRole !== 'SUPER_ADMIN') {
      fetchCompanyLogo()
    }
  }, [session])

  // If company has a logo, show that instead
  if (companyLogo) {
    return (
      <div className={cn("flex flex-col items-start relative", className)}>
        <div className="relative h-12 w-auto">
          <Image
            src={companyLogo}
            alt={companyName || 'Company Logo'}
            width={180}
            height={48}
            className="h-12 w-auto object-contain"
            style={{ background: 'transparent' }}
            priority
          />
        </div>
      </div>
    )
  }

  // Default text logo (replacing Ayphen logo)
  return (
    <div className={cn("flex flex-col items-start relative", className)}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center",
          isDark ? "bg-primary-500" : "bg-primary-600"
        )}>
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <div className="flex flex-col">
          <span className={cn(
            "text-lg font-bold leading-none",
            isDark ? "text-white" : "text-slate-900"
          )}>
            Event
          </span>
          <span className={cn(
            "text-sm font-medium leading-none",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            Planner
          </span>
        </div>
      </div>
    </div>
  )
}
