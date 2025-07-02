'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  Laptop,
  Settings,
  ShieldCheck,
  Smartphone,
  Sofa,
  Car,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';
import type { WarrantyCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

const navItems: { href: string; label: string; icon: LucideIcon; category?: WarrantyCategory | 'All' }[] = [
  { href: '/dashboard', label: 'All', icon: Home, category: 'All' },
  { href: '/dashboard?category=Electronics', label: 'Electronics', icon: Laptop, category: 'Electronics' },
  { href: '/dashboard?category=Appliances', label: 'Appliances', icon: Smartphone, category: 'Appliances' },
  { href: '/dashboard?category=Furniture', label: 'Furniture', icon: Sofa, category: 'Furniture' },
  { href: '/dashboard?category=Vehicles', label: 'Vehicles', icon: Car, category: 'Vehicles' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  const isActive = (itemCategory?: WarrantyCategory | 'All') => {
    if (pathname !== '/dashboard') return false;
    if (itemCategory === 'All') return !currentCategory;
    return itemCategory === currentCategory;
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <ShieldCheck className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">WarrantyWallet</span>
          </Link>
          {navItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    isActive(item.category) && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
