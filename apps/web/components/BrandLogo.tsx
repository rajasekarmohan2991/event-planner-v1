import { cn } from '@/lib/utils'
import Image from 'next/image'

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
            isDark ? "" : "mix-blend-multiply"
          )}
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 65%, 38% 65%, 38% 100%, 0 100%)' }}
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
