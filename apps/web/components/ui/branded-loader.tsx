"use client"

import { motion } from "framer-motion"
import { Calendar, PartyPopper } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandedLoaderProps {
    text?: string
    className?: string
}

export function BrandedLoader({ text = "Loading...", className }: BrandedLoaderProps) {
    return (
        <div className={cn("flex h-full min-h-[50vh] w-full flex-col items-center justify-center bg-white", className)}>
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex flex-col items-center justify-center gap-8"
            >
                {/* Animated Logo Container */}
                <div className="relative">
                    <motion.div
                        animate={{
                            rotate: [0, -5, 5, -5, 0],
                            y: [0, -10, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-24 h-24 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-200"
                    >
                        <Calendar className="w-12 h-12 text-white" />
                    </motion.div>

                    {/* Floating Elements */}
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="absolute -top-3 -right-3 bg-yellow-400 p-2 rounded-full text-white shadow-lg border-4 border-white"
                    >
                        <PartyPopper className="w-5 h-5" />
                    </motion.div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-3">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-black text-slate-900 tracking-tight"
                    >
                        Welcome
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <p className="text-base text-slate-500 font-medium">{text}</p>
                        <div className="flex gap-1.5 mt-2">
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    className="w-2 h-2 rounded-full bg-rose-500"
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
