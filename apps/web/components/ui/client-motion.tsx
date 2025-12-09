'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface ClientMotionProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

export function ClientMotion({ children, ...props }: ClientMotionProps) {
  // Define known valid motion div props to avoid type issues
  const validMotionProps = [
    'initial', 'animate', 'exit', 'transition', 'variants',
    'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'viewport',
    'layout', 'layoutId', 'onAnimationStart', 'onAnimationComplete',
    'onUpdate', 'onDragStart', 'onDragEnd', 'onDrag', 'onMeasure'
  ];

  // Filter out any non-standard props that might cause type issues
  const motionProps = Object.entries(props).reduce((acc, [key, value]) => {
    // Only include valid motion div props or event handlers
    if (validMotionProps.includes(key) || key.startsWith('on')) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  return <motion.div {...motionProps}>{children}</motion.div>;
}

export const motionComponents = {
  div: ClientMotion,
  // Add other motion components as needed
} as const;
