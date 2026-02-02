import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ayphen - Authentication',
  description: 'Authentication pages for Ayphen',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Pass-through layout; individual pages control their own AuthLayout
  return children
}
