"use client"

import { cn } from "@/lib/utils"

interface BrandedLoaderProps {
    text?: string
    className?: string
}

export function BrandedLoader({ text = "Loading...", className }: BrandedLoaderProps) {
    return (
        <div className={cn("flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-4 p-8", className)}>
            <div className="relative flex flex-col items-center justify-center gap-4">
                {/* Animated Rings */}
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 animate-ping rounded-full border-2 border-indigo-200 opacity-75"></div>
                    <div className="relative h-16 w-16 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600 shadow-sm"></div>
                    <div className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-indigo-50"></div>
                </div>

                {/* Text content */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-xl font-bold text-transparent animate-pulse">
                        Ayphen Technologies
                    </h3>
                    <p className="text-sm text-muted-foreground">{text}</p>
                </div>
            </div>
        </div>
    )
}
