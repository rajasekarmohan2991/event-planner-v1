'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { SessionKeepAlive } from '@/lib/useSessionKeepAlive';

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session = null }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchOnWindowFocus={false} // Disabled to prevent CORS errors
      refetchInterval={0} // Disabled to prevent CORS errors
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      {children}
    </NextAuthSessionProvider>
  );
}
