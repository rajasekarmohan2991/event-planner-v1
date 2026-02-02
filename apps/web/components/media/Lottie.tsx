'use client'

import { useEffect, useId } from 'react'

// Client-only Lottie Web Component wrapper using unpkg (free/open)
// Usage: <Lottie src="/animations/login.json" loop autoplay style={{ width: 320, height: 320 }} />
export default function Lottie({
  src,
  loop = true,
  autoplay = true,
  speed = 1,
  style,
  className,
  background = 'transparent',
}: {
  src: string
  loop?: boolean
  autoplay?: boolean
  speed?: number
  style?: React.CSSProperties
  className?: string
  background?: string
}) {
  const id = useId()

  useEffect(() => {
    // Ensure lottie-player script is present once
    const existing = document.querySelector('script[data-lottie-player]') as HTMLScriptElement | null
    if (!existing) {
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js'
      s.async = true
      s.setAttribute('data-lottie-player', 'true')
      document.head.appendChild(s)
    }
  }, [])

  // Render the custom element directly; TypeScript doesn't know this tag
  return (
    // eslint-disable-next-line react/no-unknown-property
    // @ts-ignore
    <lottie-player
      id={id}
      src={src}
      loop={loop}
      autoplay={autoplay}
      speed={speed}
      background={background}
      style={style}
      // eslint-disable-next-line react/no-unknown-property
      class={className}
      mode="normal"
    />
  )
}
