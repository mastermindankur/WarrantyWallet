import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-grow pt-32 pb-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-6 text-muted-foreground">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Privacy Policy</h1>
            <p className="text-lg">Last updated: {lastUpdated}</p>
            
            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">1. Information We Collect</h2>
            <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used. The only personal information we collect is your email address for authentication purposes.</p>

            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">2. How We Use Your Information</h2>
            <p>We use the information we collect in various ways, including to:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>Provide, operate, and maintain our website</li>
                <li>Improve, personalize, and expand our website</li>
                <li>Understand and analyze how you use our website</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>Send you emails for account-related purposes</li>
                <li>Find and prevent fraud</li>
            </ul>
            
            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">3. Log Files and Data Storage</h2>
            <p>WarrantyWallet follows a standard procedure of using log files. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, and tracking users' movement on the website.</p>
            <p>The warranty data you upload, including images and document details, is stored securely and is only accessible by you. We do not access, share, or analyze your personal warranty information.</p>

            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">4. Security</h2>
            <p>The security of your data is important to us. We use industry-standard encryption and security measures to protect your information. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.</p>

            <h2 className="text-2xl font-bold tracking-tight text-foreground pt-6">5. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
            
            <p className="pt-6 font-bold text-foreground">This is a placeholder privacy policy. You should replace this with your own policy.</p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
