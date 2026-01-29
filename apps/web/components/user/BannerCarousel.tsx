'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Play, Ticket, Info } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface BannerEvent {
    id: string
    name: string
    description?: string
    bannerUrl?: string
    imageUrl?: string
    category?: string
    startsAt: string
}

interface BannerCarouselProps {
    events?: BannerEvent[]
}

const defaultSlides = [
    {
        id: 'default-1',
        title: "Find Your Next Experience",
        subtitle: "EXPLORE",
        description: "Discover concerts, workshops, and conferences happening around you.",
        cta: "Browse Events",
        ctaLink: "/events",
        detailsLink: "/events",
        bgGradient: "bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900",
        imageGradient: "from-purple-900/90 to-transparent",
        floatingImages: [
            { color: "bg-purple-500", position: "right-40 top-10", size: "w-64 h-64", blur: "blur-3xl" },
            { color: "bg-blue-500", position: "right-10 bottom-10", size: "w-72 h-72", blur: "blur-3xl" }
        ],
        accentColor: "text-purple-400",
        buttonColor: "bg-white text-purple-900 hover:bg-gray-100",
        bannerUrl: undefined
    }
]

// Helper to generate consistent gradients based on string hash or category
const getGradientForEvent = (category: string = '') => {
    const cat = category.toLowerCase()
    if (cat === 'music' || cat === 'concert') return {
        bg: "bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900",
        accent: "text-pink-300",
        btn: "bg-purple-600 hover:bg-purple-700",
        float1: "bg-purple-500",
        float2: "bg-pink-500"
    }
    if (cat === 'technology' || cat === 'tech') return {
        bg: "bg-gradient-to-r from-slate-900 via-zinc-900 to-neutral-800",
        accent: "text-cyan-400",
        btn: "bg-cyan-600 hover:bg-cyan-700",
        float1: "bg-cyan-500",
        float2: "bg-blue-500"
    }
    if (cat === 'business') return {
        bg: "bg-gradient-to-r from-blue-900 via-sky-900 to-cyan-900",
        accent: "text-sky-400",
        btn: "bg-blue-600 hover:bg-blue-700",
        float1: "bg-blue-500",
        float2: "bg-sky-500"
    }
    // Default
    return {
        bg: "bg-gradient-to-r from-violet-900 via-purple-900 to-fuchsia-900",
        accent: "text-violet-400",
        btn: "bg-violet-600 hover:bg-violet-700",
        float1: "bg-violet-500",
        float2: "bg-fuchsia-500"
    }
}

export function BannerCarousel({ events = [] }: BannerCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)

    // Map real events to slides format
    const slides = events.length > 0 ? events.map(event => {
        const theme = getGradientForEvent(event.category)
        return {
            id: event.id,
            title: event.name,
            subtitle: (event.category || 'EVENT').toUpperCase(),
            description: event.description || `Join us for ${event.name}`,
            cta: "Book Now",
            ctaLink: `/events/${event.id}/register`,
            detailsLink: `/events/${event.id}/public`,
            bgGradient: theme.bg,
            accentColor: theme.accent,
            buttonColor: theme.btn,
            floatingImages: [
                { color: theme.float1, position: "right-40 top-10", size: "w-64 h-64", blur: "blur-3xl" },
                { color: theme.float2, position: "right-10 bottom-10", size: "w-72 h-72", blur: "blur-3xl" }
            ],
            bannerUrl: event.bannerUrl || event.imageUrl
        }
    }) : defaultSlides

    useEffect(() => {
        if (slides.length <= 1) return
        const timer = setInterval(() => {
            nextSlide()
        }, 5000)
        return () => clearInterval(timer)
    }, [currentIndex, slides.length])

    const nextSlide = () => {
        setDirection(1)
        setCurrentIndex((prev) => (prev + 1) % slides.length)
    }

    const prevSlide = () => {
        setDirection(-1)
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
    }

    const goToSlide = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1)
        setCurrentIndex(index)
    }

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
        }),
    }

    const currentSlide = slides[currentIndex]

    return (
        <div className="relative w-full h-[400px] md:h-[450px] overflow-hidden rounded-2xl shadow-2xl mb-12 group bg-gray-900">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentSlide.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                    }}
                    className={`absolute inset-0 w-full h-full ${currentSlide.bgGradient}`}
                >
                    {/* Background Image (if available) with overlay */}
                    {currentSlide.bannerUrl && (
                        <>
                            <Image
                                src={currentSlide.bannerUrl}
                                alt={currentSlide.title}
                                fill
                                className="object-cover opacity-60 mix-blend-overlay"
                                priority={currentIndex === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                        </>
                    )}

                    {/* Decorative background elements (only if no banner, or to add mood) */}
                    {!currentSlide.bannerUrl && currentSlide.floatingImages?.map((img, i) => (
                        <div
                            key={i}
                            className={`absolute rounded-full opacity-60 mix-blend-screen pointer-events-none ${img.color} ${img.position} ${img.size} ${img.blur}`}
                        />
                    ))}

                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

                    <div className="relative z-10 h-full max-w-7xl mx-auto px-8 md:px-16 flex items-center">
                        <div className="max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className={`inline-block px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-sm font-semibold mb-4 tracking-wider ${currentSlide.accentColor}`}
                            >
                                {currentSlide.subtitle}
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight line-clamp-2"
                                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                            >
                                {currentSlide.title}
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg md:text-xl text-white/90 mb-8 max-w-lg font-light leading-relaxed line-clamp-3"
                            >
                                {currentSlide.description}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-4"
                            >
                                <Link href={currentSlide.ctaLink || '#'} className={`px-8 py-3.5 rounded-lg font-bold text-white shadow-lg shadow-black/20 hover:scale-105 transition-transform flex items-center gap-2 ${currentSlide.buttonColor}`}>
                                    <Ticket className="w-5 h-5" />
                                    {currentSlide.cta}
                                </Link>
                                <Link href={(currentSlide as any).detailsLink || currentSlide.ctaLink || '#'} className="px-8 py-3.5 rounded-lg font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors backdrop-blur-sm flex items-center gap-2">
                                    More Details
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={prevSlide}
                            className="p-3 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={nextSlide}
                            className="p-3 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50 transition-colors"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Dots Navigation */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === currentIndex
                                        ? 'bg-white w-8'
                                        : 'bg-white/40 hover:bg-white/70'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
