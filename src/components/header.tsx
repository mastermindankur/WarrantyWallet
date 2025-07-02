'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  Laptop,
  Menu,
  ShieldCheck,
  Smartphone,
  Sofa,
  Car,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import UserNav from './user-nav';
import type { LucideIcon } from 'lucide-react';
import type { WarrantyCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

const mobileNavItems: { href: string; label: string; icon: LucideIcon; category?: WarrantyCategory | 'All' }[] = [
  { href: '/dashboard', label: 'All', icon: Home, category: 'All' },
  { href: '/dashboard?category=Electronics', label: 'Electronics', icon: Laptop, category: 'Electronics' },
  { href: '/dashboard?category=Appliances', label: 'Appliances', icon: Smartphone, category: 'Appliances' },
  { href: '/dashboard?category=Furniture', label: 'Furniture', icon: Sofa, category: 'Furniture' },
  { href: '/dashboard?category=Vehicles', label: 'Vehicles', icon: Car, category: 'Vehicles' },
];

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  const isActive = (itemCategory?: WarrantyCategory | 'All') => {
    if (pathname !== '/dashboard') return false;
    if (itemCategory === 'All') return !currentCategory;
    return itemCategory === currentCategory;
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <ShieldCheck className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">WarrantyWallet</span>
            </Link>
            {mobileNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                  isActive(item.category) && "font-semibold text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
             <Link
                href="#"
                className="mt-auto flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
          </nav>
        </SheetContent>
      </Sheet>
      
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Search can be added here in the future */}
      </div>
      <UserNav />
    </header>
  );
}
