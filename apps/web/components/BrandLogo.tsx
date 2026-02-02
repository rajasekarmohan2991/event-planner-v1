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

  // Modern geometric logo
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Modern Geometric Logo Icon */}
      <div className="relative">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer hexagon */}
          <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z"
            stroke="url(#gradient1)"
            strokeWidth="2"
            fill="url(#gradient2)"
            className="drop-shadow-lg" />
          {/* Inner star/spark */}
          <path d="M20 12L23 18H29L24 22L26 28L20 24L14 28L16 22L11 18H17L20 12Z"
            fill="white"
            className="opacity-90" />
          <defs>
            <linearGradient id="gradient1" x1="5" y1="2" x2="35" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EC4899" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="5" y1="2" x2="35" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EC4899" stopOpacity="0.2" />
              <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Modern Typography */}
      <div className="flex flex-col">
        <span className={cn(
          "text-xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent",
          isDark && "from-pink-400 to-purple-400"
        )}>
          EventPlanner
        </span>
        {showSubtitle && (
          <span className={cn(
            "text-[0.6rem] font-medium tracking-widest uppercase",
            isDark ? "text-slate-400" : "text-slate-500"
          )}>
            Premium Events
          </span>
        )}
      </div>
    </div>
  )
}
