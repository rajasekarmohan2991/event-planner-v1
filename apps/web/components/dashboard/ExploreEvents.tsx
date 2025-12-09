'use client'

import { motion } from 'framer-motion'
import LottieAnimation from '@/components/LottieAnimation'
import { useLottieAnimation } from '@/hooks/useLottieAnimation'
import { getAnimation } from '@/data/animations'

interface ExploreItem {
  id: string
  label: string
  animKey: string
}

const items: ExploreItem[] = [
  { id: 'music', label: 'Music', animKey: 'categories.music' },
  { id: 'navratri', label: 'Navratri', animKey: 'categories.music' },
  { id: 'nightlife', label: 'Nightlife', animKey: 'categories.music' },
  { id: 'comedy', label: 'Comedy', animKey: 'categories.food' },
  { id: 'sports', label: 'Sports', animKey: 'categories.sports' },
  { id: 'performances', label: 'Performances', animKey: 'categories.music' },
  { id: 'food', label: 'Food & Drinks', animKey: 'categories.food' },
  { id: 'fests', label: 'Fests & Fairs', animKey: 'hero.celebration' },
  { id: 'mixers', label: 'Social Mixers', animKey: 'categories.food' },
  { id: 'fitness', label: 'Fitness', animKey: 'categories.sports' },
  { id: 'conferences', label: 'Conferences', animKey: 'categories.tech' },
  { id: 'expos', label: 'Expos', animKey: 'categories.tech' },
]

export default function ExploreEvents() {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Explore Events</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <ExploreTile key={item.id} item={item} />)
        )}
      </div>
    </section>
  )
}

function ExploreTile({ item }: { item: ExploreItem }) {
  const anim = getAnimation(item.animKey)
  const { animationData } = useLottieAnimation(anim?.url)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -4 }}
      className="relative flex h-36 flex-col justify-between overflow-hidden rounded-2xl border border-yellow-200 bg-gradient-to-b from-yellow-50 to-amber-100 p-3 shadow-sm ring-1 ring-black/5"
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.9),rgba(255,255,255,0)_60%)]" />
      <div className="relative mx-auto h-16 w-16">
        {animationData && (
          <LottieAnimation animationData={animationData} loop autoplay className="h-full w-full" />
        )}
      </div>
      <div className="relative text-center">
        <span className="text-xs font-semibold tracking-wide text-slate-900">{item.label.toUpperCase()}</span>
      </div>
    </motion.div>
  )
}
