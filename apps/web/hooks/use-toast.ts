'use client'

import { useToastContext } from '@/contexts/toast-context'

type ToastOptions = {
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const { toast } = useToastContext()
  
  return {
    toast: (title: string, description?: string, options: ToastOptions = {}) => {
      return toast({
        title,
        description,
        variant: options.variant || 'default',
        duration: options.duration
      })
    },
    success: (title: string, description?: string, duration?: number) => {
      return toast({
        title,
        description,
        variant: 'default',
        duration
      })
    },
    error: (title: string, description?: string, duration?: number) => {
      return toast({
        title,
        description,
        variant: 'destructive',
        duration
      })
    }
  }
}
