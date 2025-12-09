"use client"

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function ParallaxHero({
  src,
  alt = '',
  speed = 0.5,
  className = '',
  children,
}: {
  src: string;
  alt?: string;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100 * speed]);
  const springY = useSpring(y, { stiffness: 400, damping: 90 });

  return (
    <div ref={ref} className={`relative h-[80vh] overflow-hidden ${className}`}>
      <motion.div 
        className="absolute inset-0"
        style={{ y: springY }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority
        />
      </motion.div>
      {children}
    </div>
  );
}
