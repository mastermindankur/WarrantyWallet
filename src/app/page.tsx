
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Sparkles, CloudUpload, BellRing, ScanLine, ArrowRight, Laptop, Smartphone } from 'lucide-react';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { useAuth } from '@/contexts/auth-context';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-card p-6 rounded-lg shadow-md border border-border/50 transition-transform hover:-translate-y-1">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const HowItWorksStep = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="relative pl-16">
        <dt className="text-base font-semibold leading-7">
            <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                {icon}
            </div>
            {title}
        </dt>
        <dd className="mt-2 text-base leading-7 text-muted-foreground">{description}</dd>
    </div>
);


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

      <main className="overflow-x-hidden">
        {/* Hero Section */}
        <div className="relative bg-card">
          <div className="mx-auto max-w-7xl">
            <div className="relative z-10 lg:w-full lg:max-w-2xl">
              <svg
                className="absolute inset-y-0 right-8 hidden h-full w-80 translate-x-1/2 transform fill-card lg:block"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon points="0,0 90,0 50,100 0,100" />
              </svg>
              <div className="relative px-6 py-32 sm:py-40 lg:px-8 lg:py-56 lg:pr-0">
                <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-6xl sm:leading-snug bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-snug">
                    Never Lose a Warranty Again.
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-muted-foreground">
                    WarrantyWallet turns your messy pile of receipts into a searchable, organized digital library. Snap a photo, and let our AI handle the rest.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    <Button asChild size="lg">
                      <Link href="/signup">Get Started for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <Image
              className="aspect-[3/2] object-cover lg:aspect-auto lg:h-full lg:w-full"
              src="/hero-image.png"
              alt="Digital wallet illustration"
              width={1200}
              height={800}
              data-ai-hint="digital organization"
              priority
            />
          </div>
        </div>

        {/* Feature Section */}
        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
                <p className="text-base font-semibold leading-7 text-primary">Flawless Organization</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Why You'll Love WarrantyWallet</h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  We've built the simplest, smartest way to manage your product warranties. It's powerful, secure, and designed for real life.
                </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              <FeatureCard
                icon={<ScanLine className="h-6 w-6" />}
                title="AI-Powered Scanning"
                description="Our AI reads your receipts and warranty cards, automatically pulling out dates, product names, and warranty periods."
              />
              <FeatureCard
                icon={<CloudUpload className="h-6 w-6" />}
                title="Secure Cloud Vault"
                description="Your documents are encrypted and stored securely. Access them from any device, anytime you need them."
              />
              <FeatureCard
                icon={<BellRing className="h-6 w-6" />}
                title="Smart Expiry Alerts"
                description="Get timely notifications before a warranty expires, so you have plenty of time to make a claim if you need to."
              />
            </div>
          </div>
        </div>
        
        {/* How it Works Section */}
        <div className="bg-muted/40 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple as 1, 2, 3</h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  Go from shoebox to dashboard in minutes. Our process is designed to be effortless.
                </p>
                <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 lg:max-w-none">
                   <HowItWorksStep
                     icon={<Sparkles className="h-6 w-6 text-primary-foreground" />}
                     title="Snap or Upload"
                     description="Take a picture of your receipt or warranty card, or upload a PDF. That's it. Your job is done."
                   />
                   <HowItWorksStep
                     icon={<ScanLine className="h-6 w-6 text-primary-foreground" />}
                     title="AI Does the Work"
                     description="Our system intelligently scans the document, extracts the key details, and files it away neatly for you."
                   />
                   <HowItWorksStep
                     icon={<BellRing className="h-6 w-6 text-primary-foreground" />}
                     title="Relax & Get Notified"
                     description="We'll keep an eye on expiry dates and send you a heads-up so you never miss a deadline."
                   />
                </dl>
              </div>
              <div className="flex items-center justify-center rounded-xl bg-card p-8 shadow-xl ring-1 ring-border/50">
                <div className="w-full max-w-md">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-background p-4 shadow-sm">
                            <div className="space-y-1">
                                <p className="font-medium">ProBook Laptop</p>
                                <p className="text-sm text-green-500">Expires in 1 year</p>
                            </div>
                            <div className="rounded-full bg-primary/10 p-2 text-primary"><Laptop className="h-5 w-5" /></div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-background p-4 shadow-sm">
                            <div className="space-y-1">
                                <p className="font-medium">Smart Fridge</p>
                                <p className="text-sm text-amber-500">Expires in 2 months</p>
                            </div>
                            <div className="rounded-full bg-primary/10 p-2 text-primary"><Smartphone className="h-5 w-5" /></div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-background p-4 opacity-60 shadow-sm">
                            <div className="space-y-1">
                                <p className="font-medium">Wireless Headphones</p>
                                <p className="text-sm text-red-500">Expired 3 months ago</p>
                            </div>
                            <div className="rounded-full bg-primary/10 p-2 text-primary"><Laptop className="h-5 w-5" /></div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Final CTA Section */}
        <div className="relative isolate overflow-hidden bg-primary/90">
            <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <ShieldCheck className="h-16 w-16 text-primary-foreground mx-auto mb-4" />
                    <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                        Ready to Ditch the Clutter?
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
                        Take control of your warranties today. Your future self will thank you.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Button asChild size="lg" variant="secondary">
                            <Link href="/signup">Create Your Free Account</Link>
                        </Button>
                    </div>
                </div>
            </div>
            <svg
              viewBox="0 0 1024 1024"
              className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
              aria-hidden="true"
            >
              <circle cx={512} cy={512} r={512} fill="url(#8d958450-c69f-4251-94bc-4e091a323369)" fillOpacity="0.7" />
              <defs>
                <radialGradient id="8d958450-c69f-4251-94bc-4e091a323369">
                  <stop stopColor="#51ffc8" />
                  <stop offset={1} stopColor="#009e9e" />
                </radialGradient>
              </defs>
            </svg>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
