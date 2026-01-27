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

  // Default Ayphen logo with transparent background styling
  return (
    <div className={cn("flex flex-col items-start relative", className)}>
      <div className="relative h-14 w-48">
        <Image
          src="/logo.png"
          alt="Ayphen Logo"
          width={180}
          height={60}
          className={cn(
            "absolute top-0 left-0 h-full w-auto max-w-none object-contain object-left-top",
            // Remove white background using mix-blend-mode
            "mix-blend-darken"
          )}
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 65%, 38% 65%, 38% 100%, 0 100%)',
            background: 'transparent'
          }}
          priority
        />
      </div>
      {showSubtitle && (
        <span className={cn(
          "text-[0.65rem] font-bold tracking-[0.2em] uppercase leading-none ml-[5.2rem] -mt-4 relative z-10",
          isDark ? "text-slate-300" : "text-slate-600"
        )}>
          Event Planner
        </span>
      )}
    </div>
  )
}
