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

  // Default Ayphen logo with Red branding
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
          <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex flex-col justify-center">
        <span className={cn(
          "text-lg font-extrabold tracking-tight leading-none",
          isDark ? "text-white" : "text-slate-900"
        )}>
          Ayphen
        </span>
        {showSubtitle && (
          <span className="text-[0.65rem] font-bold tracking-[0.15em] uppercase text-rose-600 leading-tight">
            Event Planner
          </span>
        )}
      </div>
    </div>
  )
}
