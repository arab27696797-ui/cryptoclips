'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  Palette,
  Settings,
  CreditCard,
  Video,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: FolderOpen,
  },
  {
    name: 'Renders',
    href: '/dashboard/renders',
    icon: Video,
  },
  {
    name: 'Brand Presets',
    href: '/dashboard/brand-presets',
    icon: Palette,
  },
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-600">
            <Video className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">CryptoClips</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-700 hover:bg-white hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 p-4 text-white">
          <p className="text-sm font-medium">Need more generations?</p>
          <p className="mt-1 text-xs opacity-90">
            Upgrade your plan to create more crypto clips
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-3 block rounded-md bg-white px-3 py-1.5 text-center text-sm font-medium text-orange-600 transition-opacity hover:opacity-90"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}
