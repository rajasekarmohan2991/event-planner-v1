'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function ToastExample() {
  const { toast, success, error } = useToast()

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            toast('Default Toast', 'This is a default toast message')
          }}
        >
          Show Default Toast
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            success('Success!', 'Your action was completed successfully')
          }}
        >
          Show Success Toast
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            error('Error!', 'Something went wrong. Please try again.')
          }}
        >
          Show Error Toast
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Click the buttons above to see different toast notifications.</p>
      </div>
    </div>
  )
}
