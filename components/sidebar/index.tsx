import * as React from 'react'
import { cn } from '@/lib/utils'

export function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex h-full flex-col border-r bg-background', className)} {...props}>
      <div className="flex-1 overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          {/* Sidebar items will go here */}
        </nav>
      </div>
    </div>
  )
}
