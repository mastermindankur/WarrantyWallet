
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { sendTestReminder } from '@/app/actions/reminder-actions';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { addDays, subDays } from 'date-fns';

export default function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/login');
  };
  
  const handleSendReminder = async () => {
    if (!user || !db) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to send a test reminder.',
      });
      return;
    }

    setIsSending(true);
    try {
      // 1. Fetch expiring and expired warranties on the client
      const now = new Date();
      const expiryLimit = addDays(now, 30);
      
      // Query for warranties expiring soon (next 30 days)
      const expiringQuery = query(
        collection(db, 'warranties'),
        where('userId', '==', user.uid),
        where('expiryDate', '<=', Timestamp.fromDate(expiryLimit)),
        where('expiryDate', '>=', Timestamp.fromDate(now))
      );
      
      // Query for warranties that have already expired (most recent 50)
      const expiredQuery = query(
        collection(db, 'warranties'),
        where('userId', '==', user.uid),
        where('expiryDate', '<', Timestamp.fromDate(now)),
        orderBy('expiryDate', 'desc'),
        limit(50) // Limit to the 50 most recently expired warranties
      );
      
      const [expiringSnapshot, expiredSnapshot] = await Promise.all([
        getDocs(expiringQuery),
        getDocs(expiredQuery)
      ]);

      const serializeWarranties = (snapshot: any) => {
          return snapshot.docs.map((doc: any) => {
              const data = doc.data();
              // Serialize data for the server action
              return {
                  ...data,
                  id: doc.id,
                  purchaseDate: (data.purchaseDate as Timestamp).toDate().toISOString(),
                  expiryDate: (data.expiryDate as Timestamp).toDate().toISOString(),
              }
          });
      }

      const expiringWarranties = serializeWarranties(expiringSnapshot);
      const expiredWarranties = serializeWarranties(expiredSnapshot);
      
      // 2. Pass the data to the server action
      const result = await sendTestReminder({
          userEmail: user.email!,
          expiringWarranties,
          expiredWarranties,
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Send Reminder',
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error("Error sending reminder:", error);
      toast({
        variant: 'destructive',
        title: 'An Unexpected Error Occurred',
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return null;
  }

  const getInitials = (email: string | null) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "user"} />
            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSendReminder} disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Email Summary
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
