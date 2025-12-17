"use client"

import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'

export function useSessionKeepAlive(intervalMinutes: number = 15) {
  const { data: session, update } = useSession()
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!session) return

    intervalRef.current = setInterval(async () => {
      try {
        await update()
        console.log('[Session] Refreshed at', new Date().toLocaleTimeString())
      } catch (error) {
        console.error('[Session] Failed to refresh:', error)
      }
    }, intervalMinutes * 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session, update, intervalMinutes])

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && session) {
        try {
          await update()
          console.log('[Session] Refreshed on tab focus')
        } catch (error) {
          console.error('[Session] Failed to refresh on focus:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session, update])
}

interface SessionKeepAliveProps {
  children: React.ReactNode
  intervalMinutes?: number
}

export function SessionKeepAlive({ children, intervalMinutes = 15 }: SessionKeepAliveProps) {
  useSessionKeepAlive(intervalMinutes)
  return <>{children}</>
}
