'use client'

import LottieAnimation from '@/components/ui/LottieAnimation'

type AuthPageLayoutProps = {
  children: React.ReactNode
  heading?: string
  subheading?: string
  animationSrc?: string
}

// Using a simple animation that's included locally to avoid external dependencies
const DEFAULT_ANIMATION = '/animations/register.json'

export default function AuthPageLayout({
  children,
  heading,
  subheading,
  animationSrc = DEFAULT_ANIMATION,
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen w-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Animated visual (hidden on small screens) */}
      <div className="relative hidden md:flex items-center justify-center bg-gradient-to-br from-indigo-50 via-sky-50 to-fuchsia-50 p-10 lg:p-12">
        <div className="w-full max-w-2xl">
          <div className="relative h-80 md:h-[32rem] lg:h-[36rem]">
            <LottieAnimation src={animationSrc} className="absolute inset-0" loop autoplay />
          </div>
          {(heading || subheading) && (
            <div className="mt-8 text-center">
              {heading && (
                <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900">{heading}</h2>
              )}
              {subheading && (
                <p className="mt-3 text-sm text-muted-foreground">{subheading}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Auth content */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
