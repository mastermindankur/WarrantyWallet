import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-muted/40">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 lg:px-8">
        <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
          <div className="pb-6">
            <Link href="/terms" className="text-sm leading-6 text-muted-foreground hover:text-primary">
              Terms
            </Link>
          </div>
          <div className="pb-6">
            <Link href="/privacy" className="text-sm leading-6 text-muted-foreground hover:text-primary">
              Privacy
            </Link>
          </div>
           <div className="pb-6">
            <Link href="/disclaimer" className="text-sm leading-6 text-muted-foreground hover:text-primary">
              Disclaimer
            </Link>
          </div>
          <div className="pb-6">
            <a href="mailto:mastermindankur@duck.com" className="text-sm leading-6 text-muted-foreground hover:text-primary">
              Contact
            </a>
          </div>
        </nav>
        <div className="mt-10 flex justify-center space-x-10">
           <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
            <ShieldCheck className="h-6 w-6" />
             <span className="sr-only">WarrantyWallet</span>
           </Link>
        </div>
        <p className="mt-10 text-center text-xs leading-5 text-muted-foreground">
          &copy; {new Date().getFullYear()} WarrantyWallet. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
