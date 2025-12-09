"use client"

import { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  const scrollContainer = useRef<HTMLDivElement>(null);

  const scroll = (scrollOffset: number) => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollLeft += scrollOffset;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => scroll(-300)}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
        aria-label="Scroll left"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      
      <div 
        ref={scrollContainer}
        className="flex space-x-4 overflow-x-auto scroll-smooth py-4 px-2 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      
      <button
        onClick={() => scroll(300)}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
        aria-label="Scroll right"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
