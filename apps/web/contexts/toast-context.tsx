'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

export type ToastVariant = 'default' | 'destructive'

export type Toast = {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastContextType = {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = uuidv4()
    
    setToasts((currentToasts) => [
      ...currentToasts,
      { id, title, description, variant, duration },
    ])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts((currentToasts) => 
          currentToasts.filter((toast) => toast.id !== id)
        )
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((currentToasts) => 
      currentToasts.filter((toast) => toast.id !== id)
    )
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
