
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.03-4.56 2.03-3.86 0-7-3.14-7-7s3.14-7 7-7c2.18 0 3.66.86 4.69 1.83l2.7-2.7C18.28 2.37 15.65 1 12.48 1 5.83 1 1 5.83 1 12.48S5.83 23.96 12.48 23.96c3.99 0 6.83-1.37 8.99-3.55 2.27-2.3 2.89-5.33 2.89-8.1 0-1.15-.1-1.64-.26-2.39H12.48z" fill="currentColor" />
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // State for password reset dialog
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!auth) {
      setError("Firebase is not configured. Please add your Firebase credentials to the .env file.");
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = 'Failed to sign in. Please try again later.';
        }
      }
      setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    if (!auth) {
      setError("Firebase is not configured. Please add your Firebase credentials to the .env file.");
      setIsLoading(false);
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
        console.error("Google sign-in error", error);
        let errorMessage = 'Failed to sign in with Google. Please try again.';
        if(error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in process was cancelled.';
        }
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Email is required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }

    setResetLoading(true);
    if (!auth) {
      toast({ variant: "destructive", title: "Error", description: "Firebase is not configured." });
      setResetLoading(false);
      return;
    }

    const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
    };

    try {
      await sendPasswordResetEmail(auth, resetEmail, actionCodeSettings);
      toast({
        title: "Check your inbox",
        description: `A password reset link has been sent to ${resetEmail}. You will be redirected here after reset.`,
      });
      setIsResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Could not send reset email. Please check the email address and try again.",
      });
    } finally {
      setResetLoading(false);
    }
  };
  
  if (authLoading || user) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex flex-grow flex-col items-center justify-center p-4 pt-32">
        
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Your Password</DialogTitle>
              <DialogDescription>
                Enter your account's email address and we will send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="sr-only">Email</Label>
                <Input
                  id="reset-email"
                  placeholder="you@example.com"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={resetLoading}
                  autoComplete="email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsResetDialogOpen(false)} disabled={resetLoading}>Cancel</Button>
              <Button type="button" onClick={handlePasswordReset} disabled={resetLoading}>
                {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="w-full max-w-md">
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <ShieldCheck className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold sm:text-3xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your warranties.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading}/>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-sm font-normal"
                      onClick={() => setIsResetDialogOpen(true)}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                  <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log In
                </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                 Log In with Google
              </Button>
              
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

    