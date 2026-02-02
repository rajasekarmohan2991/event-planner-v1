"use client"

import React, { useMemo, useState } from "react"

type AvatarIconProps = {
  seed: string
  size?: number
  title?: string
  className?: string
  squared?: boolean
  // If query is provided, we fetch a themed image from Unsplash Source (no key).
  // Example: query="technology,conference" -> appropriate image.
  query?: string
  collection?:
    | "fun-emoji"
    | "identicon"
    | "shapes"
    | "thumbs"
    | "avataaars"
    | "bottts-neutral"
    | "pixel-art"
}

/**
 * AvatarIcon renders a lightweight, cacheable SVG image from DiceBear based on a deterministic seed.
 * Default collection is `fun-emoji` to resemble playful badge icons like in your screenshot.
 * No API key, free to use. The URL is deterministic for a given seed and collection.
 */
export function AvatarIcon({
  seed,
  size = 28,
  title,
  className = "",
  squared = false,
  query,
  collection = "shapes",
}: AvatarIconProps) {
  const safeSeed = encodeURIComponent(seed || "seed")
  const borderRadius = squared ? "rounded" : "rounded-full"

  // Simple deterministic hash for sig param
  const hash = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return h
  }
  const dicebear = useMemo(() => `https://api.dicebear.com/7.x/${collection}/svg?seed=${safeSeed}&scale=100`, [collection, safeSeed])
  const unsplash = useMemo(() => {
    if (!query || !query.trim()) return null
    const q = encodeURIComponent(query)
    const dim = Math.max(64, size * 3)
    const sig = hash(seed)
    return `https://source.unsplash.com/${dim}x${dim}/?${q}&sig=${sig}`
  }, [query, seed, size])

  const [src, setSrc] = useState<string>(unsplash || dicebear)

  return (
    <img
      src={src}
      alt={title || seed}
      title={title || seed}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={`${borderRadius} border bg-white object-cover ${className}`}
      loading="lazy"
      onError={() => { if (src !== dicebear) setSrc(dicebear) }}
    />
  )
}

export default AvatarIcon
