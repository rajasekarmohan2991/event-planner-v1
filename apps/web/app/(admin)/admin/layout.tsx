import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The parent layout already handles authentication and navigation
  // This layout just provides styling and toaster
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
