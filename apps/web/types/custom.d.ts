import { ThemeProviderProps } from 'next-themes/dist/types';
import { ReactNode } from 'react';

declare module '@/components/theme-provider' {
  const ThemeProvider: React.FC<ThemeProviderProps>;
  export { ThemeProvider };
}

declare module '@/components/mode-toggle' {
  const ModeToggle: React.FC<{}>;
  export { ModeToggle };
}

