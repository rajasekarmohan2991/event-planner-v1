"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden relative">
            <div className="absolute inset-0 w-full h-full bg-grid-slate-200/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-50/[0.05]" />
            <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-20 text-center px-4"
            >
                <motion.h1
                    className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-primary/60 to-primary/20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                    404
                </motion.h1>
                <motion.h2
                    className="text-2xl md:text-3xl font-bold mt-4 text-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Page not found
                </motion.h2>
                <motion.p
                    className="text-muted-foreground mt-4 max-w-lg mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
                </motion.p>

                <motion.div
                    className="mt-8 flex justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                >
                    <Button asChild size="lg" className="rounded-full px-8">
                        <Link href="/dashboard">
                            Go to Dashboard
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                        <Link href="/">
                            Back Home
                        </Link>
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    )
}
