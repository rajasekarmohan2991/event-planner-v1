#!/bin/bash

# Navigate to the web directory
cd "$(dirname "$0")/.."

# Update layout.tsx
cat > app/layout.tsx << 'EOL'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Header from '@/components/Header'
import { MotionProvider } from './motion-provider'

export const metadata: Metadata = {
  title: 'Event Planner',
  description: 'Organizer portal and microsites',
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 antialiased`}>
        <Providers>
          <MotionProvider>
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </MotionProvider>
        </Providers>
      </body>
    </html>
  )
}
EOL

echo "✅ Updated layout.tsx"

# Make the script executable
chmod +x scripts/fix-layout.sh

echo "✅ Fix script created. Run it with: ./scripts/fix-layout.sh"
