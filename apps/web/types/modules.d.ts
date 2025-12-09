declare module '@/components/theme-provider' {
  import type { ThemeProviderProps } from 'next-themes/dist/types';
  export const ThemeProvider: React.FC<ThemeProviderProps>;
}

declare module '@/components/mode-toggle' {
  export const ModeToggle: React.FC<{}>;
}
