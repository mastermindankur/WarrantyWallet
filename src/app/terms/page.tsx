import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-grow pt-32 pb-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-6 text-muted-foreground">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Terms and Conditions</h1>
            <p className="text-lg">Last updated: {lastUpdated}</p>
            
            <p>By accessing the website at WarrantyWallet, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>

            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">1. Use License</h2>
            <p>Permission is granted to temporarily download one copy of the materials (information or software) on WarrantyWallet's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>modify or copy the materials;</li>
                <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                <li>attempt to decompile or reverse engineer any software contained on WarrantyWallet's website;</li>
                <li>remove any copyright or other proprietary notations from the materials; or</li>
                <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
            <p>This license shall automatically terminate if you violate any of these restrictions and may be terminated by WarrantyWallet at any time.</p>

            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">2. Disclaimer</h2>
            <p>The materials on WarrantyWallet's website are provided on an 'as is' basis. WarrantyWallet makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            
            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">3. Limitations</h2>
            <p>In no event shall WarrantyWallet or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on WarrantyWallet's website, even if WarrantyWallet or a WarrantyWallet authorized representative has been notified orally or in writing of the possibility of such damage.</p>
            
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
