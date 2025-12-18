"use client"

import Image from 'next/image'
import { cn } from "@/lib/utils"

interface BrandedLoaderProps {
    text?: string
    className?: string
}

export function BrandedLoader({ text = "Loading...", className }: BrandedLoaderProps) {
    return (
        <div className={cn("flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-6 p-8", className)}>
            <div className="relative flex flex-col items-center justify-center gap-6">
                {/* Ayphen Logo with animations */}
                <div className="relative w-64 h-24 animate-pulse">
                    <Image
                        src="/images/ayphen-logo.png"
                        alt="Ayphen Technologies"
                        fill
                        className="object-contain animate-fade-in"
                        priority
                    />
                </div>

                {/* Loading text with animated dots */}
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground font-medium">{text}</p>
                    <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out;
                }
            `}</style>
        </div>
    )
}
