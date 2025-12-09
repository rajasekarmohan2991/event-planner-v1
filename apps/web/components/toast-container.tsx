'use client'

import { useEffect, useState } from 'react'
import { Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'
import { useToastContext, type ToastVariant } from '@/contexts/toast-context'

export function ToastContainer() {
  const { toasts, removeToast } = useToastContext()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col p-4 gap-2 w-full max-w-xs">
      {toasts.map(({ id, title, description, variant = 'default' as ToastVariant }) => (
        <Toast
          key={id}
          variant={variant}
          onOpenChange={(open) => !open && removeToast(id)}
          className="w-full"
        >
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </div>
  )
}
