'use client'

import { motion } from 'framer-motion'
import LottieAnimation from '@/components/LottieAnimation'
import { useLottieAnimation } from '@/hooks/useLottieAnimation'
import { getAnimation } from '@/data/animations'
import ExploreEvents from '@/components/dashboard/ExploreEvents'
import ArtistsCarousel from '@/components/dashboard/ArtistsCarousel'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
}

export default function HomeClient() {
  const heroAnimation = getAnimation('success')
  const { animationData: heroAnimData } = useLottieAnimation(heroAnimation?.url as string)

  const categoryAnims = {
    music: useLottieAnimation(getAnimation('categories.music')?.url as string),
    food: useLottieAnimation(getAnimation('categories.food')?.url as string),
    sports: useLottieAnimation(getAnimation('categories.sports')?.url as string),
    tech: useLottieAnimation(getAnimation('categories.tech')?.url as string),
  }

  const categories = [
    { id: 'music', name: 'Music', animation: categoryAnims.music.animationData },
    { id: 'food', name: 'Food & Drink', animation: categoryAnims.food.animationData },
    { id: 'sports', name: 'Sports', animation: categoryAnims.sports.animationData },
    { id: 'tech', name: 'Tech', animation: categoryAnims.tech.animationData },
  ]

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero Section with Animation */}
      <section className="relative overflow-hidden rounded-2xl border bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-md md:p-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <motion.p variants={fadeUp} className="text-sm font-medium tracking-wide text-blue-600">
              Discover events near you
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-2 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl md:text-5xl"
            >
              Find Your Next
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Unforgettable Experience
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-slate-600 md:text-lg">
              From concerts to workshops, discover events that match your interests.
              Our curated selection ensures you'll find something amazing.
            </motion.p>

            <motion.div variants={stagger} className="mt-8 flex flex-wrap gap-4">
              <motion.button
                variants={fadeUp}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Explore Events
              </motion.button>
              <motion.button
                variants={fadeUp}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Create an Event
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            className="relative h-64 md:h-80"
          >
            {heroAnimData && (
              <LottieAnimation animationData={heroAnimData} className="absolute inset-0" loop autoplay />
            )}
          </motion.div>
        </div>
      </section>

      {/* Explore Events */}
      <section>
        <ExploreEvents />
      </section>

      {/* Artists Carousel */}
      <section>
        <ArtistsCarousel />
      </section>

      {/* Upcoming Events Section (placeholder) */}
      <section>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div className="mb-8 flex items-end justify-between">
            <div>
              <motion.h2 variants={fadeUp} className="text-2xl font-bold text-slate-900 md:text-3xl">
                Upcoming Events
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-600">
                Don't miss out on these exciting events
              </motion.p>
            </div>
            <motion.button variants={fadeUp} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all events →
            </motion.button>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                variants={fadeUp}
                className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50" />
                <div className="p-5">
                  <div className="mb-2 flex items-center space-x-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">Music</span>
                    <span className="text-sm text-slate-500">Fri, 19 Sep</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">Sunset Music Festival 2023</h3>
                  <p className="mb-4 text-sm text-slate-600">
                    Join us for an evening of live music under the stars with top artists from around the world.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">From $49</span>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Learn more →</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  )
}
