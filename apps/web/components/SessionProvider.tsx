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
      refetchOnWindowFocus={true}
      refetchInterval={60} // Refetch every 60 seconds to keep session fresh
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      <SessionKeepAlive intervalMinutes={10}>
        {children}
      </SessionKeepAlive>
    </NextAuthSessionProvider>
  );
}
