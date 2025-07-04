'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function PublicHeader() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">WarrantyWallet</span>
          </Link>
        </div>
        <div className="flex flex-1 justify-end items-center gap-x-6">
          <Button
            asChild
            className={cn(
              { hidden: pathname === '/login' },
              { 'hidden sm:flex': isHomePage }
            )}
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className={cn({ hidden: pathname === '/signup' })}>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
