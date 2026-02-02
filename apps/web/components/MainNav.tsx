'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { UserRole, UserRoleWithGuest } from '@/types/user';
import { useEffect, useState } from 'react';

type NavItem = {
  title: string;
  href: string;
  roles: UserRoleWithGuest[];
  icon?: string;
};

const mainNavItems: NavItem[] = [
  {
    title: 'Create Event',
    href: '/events/create',
    roles: [UserRole.ADMIN, UserRole.ORGANIZER],
    icon: '➕',
  },
  {
    title: 'My Events',
    href: '/my-events',
    roles: [UserRole.USER],
  },
  {
    title: 'Organizer Dashboard',
    href: '/organizer/dashboard',
    roles: [UserRole.ORGANIZER, UserRole.ADMIN],
  },
  {
    title: 'Admin',
    href: '/admin/dashboard',
    roles: [UserRole.ADMIN],
  },
];

const MainNav = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<UserRoleWithGuest>('GUEST');

  useEffect(() => {
    if (session?.user?.role) {
      setUserRole(session.user.role as UserRoleWithGuest);
    }
  }, [session]);

  const filteredNavItems = mainNavItems.filter(
    (item) => item.roles.includes(userRole) || item.roles.includes('GUEST')
  );

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {filteredNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-foreground'
              : 'text-muted-foreground',
            item.icon && 'flex items-center gap-1'
          )}
        >
          {item.icon && <span>{item.icon}</span>}
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export default MainNav;

