'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { AnimatedButton } from '@/components/ui/AnimatedButton'

const artists = [
  { id: 'a1', name: 'Artist One', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop' },
  { id: 'a2', name: 'Artist Two', img: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1200&auto=format&fit=crop' },
  { id: 'a3', name: 'Artist Three', img: 'https://images.unsplash.com/photo-1518444188633-9fa057f88a40?q=80&w=1200&auto=format&fit=crop' },
  { id: 'a4', name: 'Artist Four', img: 'https://images.unsplash.com/photo-1517260739337-6799d3b5f6f2?q=80&w=1200&auto=format&fit=crop' },
  { id: 'a5', name: 'Artist Five', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop' },
  { id: 'a6', name: 'Artist Six', img: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1200&auto=format&fit=crop' },
  { id: 'a7', name: 'Artist Seven', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop' },
  { id: 'a8', name: 'Artist Eight', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop' },
]

export default function ArtistsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollBy = (delta: number) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Artists in your District</h2>
        <div className="hidden gap-2 sm:flex">
          <AnimatedButton variant="outline" size="icon" icon="ui.arrowLeft" onClick={() => scrollBy(-320)} />
          <AnimatedButton variant="outline" size="icon" icon="ui.arrowRight" onClick={() => scrollBy(320)} />
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {artists.map((artist) => (
            <motion.div
              key={artist.id}
              whileHover={{ y: -4 }}
              className="snap-start"
            >
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-slate-100 shadow-sm">
                <Image
                  src={artist.img}
                  alt={artist.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <p className="mt-2 w-28 truncate text-center text-xs font-medium text-slate-700">{artist.name}</p>
            </motion.div>
          ))}
        </div>

        {/* Mobile chevrons */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden items-center bg-gradient-to-r from-white to-transparent pl-2 sm:hidden">
          <div className="pointer-events-auto">
            <AnimatedButton variant="outline" size="icon" icon="ui.arrowLeft" onClick={() => scrollBy(-240)} />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center bg-gradient-to-l from-white to-transparent pr-2 sm:hidden">
          <div className="pointer-events-auto">
            <AnimatedButton variant="outline" size="icon" icon="ui.arrowRight" onClick={() => scrollBy(240)} />
          </div>
        </div>
      </div>
    </section>
  )
}
