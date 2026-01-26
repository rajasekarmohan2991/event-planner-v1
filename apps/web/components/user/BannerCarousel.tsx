'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Play, Ticket, Calendar, MapPin } from 'lucide-react'
import Image from 'next/image'

const slides = [
    {
        id: 1,
        title: "WICKED",
        subtitle: "FOR GOOD",
        description: "The epic conclusion needs you to call dibs!",
        cta: "Buy/Rent Online",
        // Simulating specific movie banner logic
        bgGradient: "bg-gradient-to-r from-green-900 via-green-800 to-pink-900",
        imageGradient: "from-green-900/90 to-transparent",
        floatingImages: [
            { color: "bg-green-500", position: "right-40 top-10", size: "w-64 h-64", blur: "blur-3xl" },
            { color: "bg-pink-500", position: "right-10 bottom-10", size: "w-72 h-72", blur: "blur-3xl" }
        ],
        accentColor: "text-green-400",
        buttonColor: "bg-rose-600 hover:bg-rose-700"
    },
    {
        id: 2,
        title: "GLOBAL MUSIC TOUR 2026",
        subtitle: "WORLD PREMIERE",
        description: "Experience the rhythm that unites the world. Limited tickets available!",
        cta: "Book Now",
        bgGradient: "bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900",
        imageGradient: "from-indigo-900/90 to-transparent",
        floatingImages: [
            { color: "bg-blue-500", position: "right-20 top-20", size: "w-80 h-80", blur: "blur-[100px]" },
            { color: "bg-purple-500", position: "right-60 bottom-0", size: "w-60 h-60", blur: "blur-[80px]" }
        ],
        accentColor: "text-blue-400",
        buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
        id: 3,
        title: "TECH SUMMIT 2026",
        subtitle: "FUTURE IS HERE",
        description: "Join 5000+ developers for the biggest tech conference of the year.",
        cta: "Register Early",
        bgGradient: "bg-gradient-to-r from-slate-900 via-zinc-900 to-neutral-900",
        imageGradient: "from-slate-900/90 to-transparent",
        floatingImages: [
            { color: "bg-cyan-500", position: "right-40 top-10", size: "w-40 h-40", blur: "blur-[60px]" },
            { color: "bg-orange-500", position: "right-10 bottom-20", size: "w-40 h-40", blur: "blur-[60px]" }
        ],
        accentColor: "text-cyan-400",
        buttonColor: "bg-white text-black hover:bg-gray-200"
    }
]

export function BannerCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide()
        }, 5000)

        return () => clearInterval(timer)
    }, [currentIndex])

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

    return (
        <div className="relative w-full h-[400px] md:h-[450px] overflow-hidden rounded-2xl shadow-2xl mb-12 group">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                    }}
                    className={`absolute inset-0 w-full h-full ${slides[currentIndex].bgGradient}`}
                >
                    {/* Decorative background elements */}
                    {slides[currentIndex].floatingImages.map((img, i) => (
                        <div
                            key={i}
                            className={`absolute rounded-full opacity-60 mix-blend-screen pointer-events-none ${img.color} ${img.position} ${img.size} ${img.blur}`}
                        />
                    ))}

                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

                    <div className="relative z-10 h-full max-w-7xl mx-auto px-8 md:px-16 flex items-center">
                        <div className="max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className={`inline-block px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-sm font-semibold mb-4 tracking-wider ${slides[currentIndex].accentColor}`}
                            >
                                {slides[currentIndex].subtitle}
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight"
                                style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                            >
                                {slides[currentIndex].title}
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg md:text-xl text-white/90 mb-8 max-w-lg font-light leading-relaxed"
                            >
                                {slides[currentIndex].description}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-4"
                            >
                                <button className={`px-8 py-3.5 rounded-lg font-bold text-white shadow-lg shadow-black/20 hover:scale-105 transition-transform flex items-center gap-2 ${slides[currentIndex].buttonColor}`}>
                                    {currentIndex === 0 ? <Play className="w-5 h-5 fill-current" /> : <Ticket className="w-5 h-5" />}
                                    {slides[currentIndex].cta}
                                </button>
                                <button className="px-8 py-3.5 rounded-lg font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors backdrop-blur-sm">
                                    More Details
                                </button>
                            </motion.div>
                        </div>

                        {/* Visual element on right side (Simulating poster art) */}
                        <div className="hidden lg:block absolute right-20 top-1/2 -translate-y-1/2 w-[400px] h-[500px]">
                            {/* This space would normally hold the movie poster or main character art */}
                            {/* We rely on the large blurs for now to create the mood */}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
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
        </div>
    )
}
