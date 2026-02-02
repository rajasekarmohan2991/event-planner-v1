import * as React from 'react';

declare module '@/components/ui/skeleton' {
  interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    show?: boolean;
    count?: number;
    circle?: boolean;
    style?: React.CSSProperties;
    containerClassName?: string;
    containerTestId?: string;
    containerStyle?: React.CSSProperties;
  }

  const Skeleton: React.FC<SkeletonProps>;
  
  export default Skeleton;
  
  // For named exports
  export const Skeleton: React.FC<SkeletonProps>;
}

// Extend the JSX namespace to include the Skeleton component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'skeleton': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          className?: string;
          show?: boolean;
          count?: number;
          circle?: boolean;
        },
        HTMLElement
      >;
    }
  }
}
