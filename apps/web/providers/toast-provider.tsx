'use client'

import dynamic from 'next/dynamic'
import { useToast } from '@/hooks/use-toast'

// Dynamically import the Toaster component to avoid SSR issues
const Toaster = dynamic(
  () => import('@/components/ui/toaster').then((mod) => mod.Toaster),
  { ssr: false }
)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

// Export the toast hook with proper typing
export { useToast } from '@/hooks/use-toast'
