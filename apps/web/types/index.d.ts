import { HTMLAttributes } from 'react';

declare module 'framer-motion' {
  export interface HTMLMotionProps<TagName extends keyof JSX.IntrinsicElements> 
    extends HTMLAttributes<TagName> {
    initial?: object;
    animate?: object;
    whileInView?: object;
    viewport?: {
      once?: boolean;
      amount?: number | 'some' | 'all';
    };
    transition?: object;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
