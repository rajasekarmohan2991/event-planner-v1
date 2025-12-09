import { User } from 'next-auth';
import { ThemeProviderProps } from 'next-themes/dist/types';

declare module '@/components/theme-provider' {
  export const ThemeProvider: React.FC<ThemeProviderProps>;
}

declare module '@/components/mode-toggle' {
  export const ModeToggle: React.FC<{}>;
}

declare module '@/components/UserNav' {
  interface UserNavProps {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  
  const UserNav: React.FC<UserNavProps>;
  export default UserNav;
}

declare module '@/components/ui/empty-state' {
  interface EmptyStateProps {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
  }
  
  export const EmptyState: React.FC<EmptyStateProps>;
}

declare module '@/components/ui/loading-state' {
  interface LoadingStateProps {
    className?: string;
    text?: string;
  }
  
  export const LoadingState: React.FC<LoadingStateProps>;
}

declare module '@/components/ui/lottie-animation' {
  interface LottieAnimationProps {
    animationData: any;
    className?: string;
    loop?: boolean;
    autoplay?: boolean;
  }
  
  export const LottieAnimation: React.FC<LottieAnimationProps>;
}

declare module '@/components/ui/animated-button' {
  import { ButtonHTMLAttributes } from 'react';
  
  interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'link' | 'primary' | 'secondary' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
    loadingText?: string;
  }
  
  export const AnimatedButton: React.FC<AnimatedButtonProps>;
}
