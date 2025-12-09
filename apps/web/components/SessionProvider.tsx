'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session = null }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchOnWindowFocus={true}
      refetchInterval={300} // Refetch every 5 minutes
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      {children}
    </NextAuthSessionProvider>
  );
}
