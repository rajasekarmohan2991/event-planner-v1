"use client"

import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Mail, Share2, Twitter, MessageCircle } from 'lucide-react'

export type SocialShareProps = {
  url?: string
  title?: string
  text?: string
  className?: string
  compact?: boolean
}

export default function SocialShare({ url, title, text, className, compact = false }: SocialShareProps) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareTitle = title || 'Check this out'
  const shareText = text || ''

  const openWindow = (href: string) => {
    const w = 640
    const h = 480
    const y = window.top ? Math.max(0, (window.top.outerHeight - h) / 2) : 0
    const x = window.top ? Math.max(0, (window.top.outerWidth - w) / 2) : 0
    window.open(href, '_blank', `width=${w},height=${h},top=${y},left=${x}`)
  }

  const onNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
      } catch (_) {
        // user cancelled
      }
    }
  }, [shareTitle, shareText, shareUrl])

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch (_) {
      // noop
    }
  }, [shareUrl])

  const onWhatsApp = useCallback(() => {
    const u = encodeURIComponent(shareUrl)
    const t = encodeURIComponent(`${shareTitle}\n${shareText}`.trim())
    openWindow(`https://wa.me/?text=${t}%20${u}`)
  }, [shareUrl, shareTitle, shareText])

  const onTwitter = useCallback(() => {
    const u = encodeURIComponent(shareUrl)
    const t = encodeURIComponent(shareTitle)
    openWindow(`https://twitter.com/intent/tweet?url=${u}&text=${t}`)
  }, [shareUrl, shareTitle])

  const onEmail = useCallback(() => {
    const subject = encodeURIComponent(shareTitle)
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }, [shareUrl, shareTitle, shareText])

  if (compact && typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
    return (
      <div className={className}>
        <Button variant="outline" onClick={onNativeShare} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Button variant="outline" onClick={onWhatsApp} className="gap-2">
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </Button>
      <Button variant="outline" onClick={onTwitter} className="gap-2">
        <Twitter className="h-4 w-4" /> X
      </Button>
      <Button variant="outline" onClick={onEmail} className="gap-2">
        <Mail className="h-4 w-4" /> Email
      </Button>
      <Button variant="outline" onClick={onCopy} className="gap-2">
        <Copy className="h-4 w-4" /> Copy link
      </Button>
    </div>
  )
}
