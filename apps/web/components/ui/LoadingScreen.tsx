"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
    message?: string
    className?: string
    fullscreen?: boolean
}

export function LoadingScreen({
    message = "Loading...",
    className,
    fullscreen = true
}: LoadingScreenProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-4 bg-background/50",
            fullscreen ? "min-h-screen fixed inset-0 z-50 backdrop-blur-sm" : "h-full w-full py-12",
            className
        )}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
            >
                <div className="relative w-16 h-16 mb-8">
                    {/* Outer ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/50"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Inner ring */}
                    <motion.div
                        className="absolute inset-3 rounded-full border-4 border-transparent border-b-secondary border-l-secondary/50"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    {/* Center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    </div>
                </div>

                <div className="space-y-2 text-center">
                    <motion.h3
                        className="text-lg font-medium text-foreground tracking-tight"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {message}
                    </motion.h3>
                    <motion.div
                        className="h-1 w-24 bg-muted overflow-hidden rounded-full mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary to-purple-500"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
