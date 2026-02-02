import React from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface UserNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function UserNav({ user }: UserNavProps) {
  const { data: session, status } = useSession();
  const currentUser = user || session?.user;
  const gender = (currentUser as any)?.gender as ('MALE' | 'FEMALE' | 'OTHER' | undefined);

  // While auth is resolving on the client, do not flash Sign In/Up
  if (status === 'loading') {
    return null;
  }

  // Don't show Sign In/Sign Up buttons - removed per user preference
  if (!currentUser && status === 'unauthenticated') {
    return null;
  }

  const userInitials = currentUser?.name
    ? String(currentUser.name)
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : (currentUser?.email ? String(currentUser.email).charAt(0).toUpperCase() : 'U');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button data-testid="user-menu-trigger" variant="ghost" className="relative h-8 w-8 rounded-full focus:ring-2 focus:ring-white/60 p-0 overflow-hidden">
          {currentUser?.image ? (
            <Avatar className="h-8 w-8 ring-2 ring-white/50 border border-white/30 bg-white/10 text-white">
              <AvatarImage src={currentUser.image} alt={currentUser?.name || ''} />
              <AvatarFallback className="bg-white/10 text-white font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="relative h-8 w-8">
              {/* Ping ring */}
              <span className="absolute inset-0 m-auto h-7 w-7 rounded-full bg-indigo-400/40 animate-ping" />
              {/* Animated gradient avatar */}
              <span
                aria-hidden
                className="relative block h-8 w-8 rounded-full ring-2 ring-white/50 border border-white/30"
                style={{
                  background: 'linear-gradient(120deg, #6366f1, #a78bfa, #f472b6)',
                  backgroundSize: '200% 200%',
                  animation: 'gradientShift 3s ease infinite',
                }}
              />
              <style jsx>{`
                @keyframes gradientShift {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
              `}</style>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>

        </DropdownMenuGroup>
        {/* Sign out removed per request */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserNav;
