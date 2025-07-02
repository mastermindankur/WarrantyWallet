import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';

export default function DisclaimerPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-grow pt-32 pb-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-6 text-muted-foreground">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Disclaimer</h1>
            <p className="text-lg">Last updated: {lastUpdated}</p>
            
            <p>The information provided by WarrantyWallet ("we," "us," or "our") on this website is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.</p>

            <p>Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the site or reliance on any information provided on the site. Your use of the site and your reliance on any information on the site is solely at your own risk.</p>

            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">AI Feature Disclaimer</h2>
            <p>The AI-powered features for data extraction from documents are provided for your convenience. While we strive for accuracy, the AI may make mistakes or misinterpret information. It is your responsibility to review and verify all automatically extracted information for accuracy. WarrantyWallet is not liable for any inaccuracies or for any damages resulting from reliance on the AI-generated data.</p>
            
            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">External Links Disclaimer</h2>
            <p>The site may contain (or you may be sent through the site) links to other websites or content belonging to or originating from third parties. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.</p>
            
            <p className="pt-6 font-bold text-foreground">This is a placeholder disclaimer. You should replace this with your own disclaimer, especially if you handle sensitive user data.</p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
