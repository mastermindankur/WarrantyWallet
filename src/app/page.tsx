'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Sparkles, Cloud, BellRing } from 'lucide-react';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { useAuth } from '@/contexts/auth-context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  if (loading || user) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <PublicHeader />

      <main className="isolate">
        {/* Hero section */}
        <div className="relative pt-14">
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#51ffc8] to-[#009e9e] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Stop Losing Receipts.
                  <br />
                  Start Winning at Warranties.
                </h1>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  WarrantyWallet is your digital fortress for every proof of purchase. Snap, save, and never worry about a lost warranty again. It's that simple. 💅
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Button asChild size="lg">
                    <Link href="/signup">Claim Your Free Account</Link>
                  </Button>
                  <Button asChild variant="link" size="lg">
                    <Link href="/login">Log In &rarr;</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#51ffc8] to-[#009e9e] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>

        {/* Feature section */}
        <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-24 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
                <p className="text-base font-semibold leading-7 text-primary">Your Warranty Superpowers</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything you need, nothing you don't</h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                    We built WarrantyWallet to be dead simple. No clutter, no confusing features. Just the essential tools to manage your warranties like a pro.
                </p>
            </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  AI-Powered Scanning
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">Our AI rips the warranty info straight from your uploads. Dates, details, done.</dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Cloud className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Secure Cloud Vault
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">Your docs are locked down in the cloud. Access them anytime, anywhere, on any device.</dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <BellRing className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Expiry Alerts
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">We'll hit you up before your warranty expires so you never miss a claim deadline.</dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary-foreground"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                  </div>
                  Category Filters
                </dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">Organize your warranties by category for quick access. No more endless scrolling.</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
