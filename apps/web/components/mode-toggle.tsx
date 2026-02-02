'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type ModeToggleProps = {
  className?: string
  /** When true, renders styles suitable for dark/inverted headers (e.g. white icon) */
  inverted?: boolean
}

export function ModeToggle({ className = '', inverted = false }: ModeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure the component is mounted to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'opacity-0',
          className
        )}
      >
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative h-9 w-9',
            inverted
              ? 'text-white hover:bg-white/10 hover:text-white'
              : 'text-foreground hover:bg-accent',
            className
          )}
        >
          <Sun className={cn(
            'h-4 w-4 rotate-0 scale-100 transition-all',
            'dark:-rotate-90 dark:scale-0',
            inverted ? 'text-white' : 'text-foreground'
          )} />
          <Moon className={cn(
            'absolute h-4 w-4 rotate-90 scale-0 transition-all',
            'dark:rotate-0 dark:scale-100',
            inverted ? 'text-white' : 'text-foreground'
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={12}
        alignOffset={0}
        className={cn(
          'z-[1000] mt-1 min-w-[8rem] overflow-hidden rounded-xl border bg-popover p-1 shadow-xl',
          'text-popover-foreground',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'backdrop-blur-sm bg-opacity-80 dark:bg-opacity-90',
          'border-border/50 dark:border-border/30'
        )}
        forceMount
      >
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={cn(
            'flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
            theme === 'light' ? 'bg-accent text-accent-foreground' : ''
          )}
        >
          <Sun className="mr-2 h-3.5 w-3.5" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={cn(
            'flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
            theme === 'dark' ? 'bg-accent text-accent-foreground' : ''
          )}
        >
          <Moon className="mr-2 h-3.5 w-3.5" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={cn(
            'flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
            theme === 'system' ? 'bg-accent text-accent-foreground' : ''
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-3.5 w-3.5"
          >
            <rect width="14" height="6" x="5" y="14" rx="2" />
            <rect width="10" height="6" x="7" y="4" rx="2" />
            <path d="M2 14h20" />
            <path d="M2 4h20" />
          </svg>
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
