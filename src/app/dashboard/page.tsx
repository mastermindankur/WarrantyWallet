
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { PlusCircle, SortAsc, SortDesc } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import type { Warranty } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import WarrantyCard from '@/components/warranty-card';
import { WarrantyFormDialog } from '@/components/warranty-form-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Frown } from 'lucide-react';

export default function Dashboard() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWarranties = async () => {
    if (!user || !db) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'warranties'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedWarranties = querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          
          // Defensive check for Timestamp fields to prevent crashes on malformed data
          if (!(data.purchaseDate && typeof data.purchaseDate.toDate === 'function') || !(data.expiryDate && typeof data.expiryDate.toDate === 'function')) {
            console.warn(`Skipping warranty with invalid date format: ${doc.id}`);
            return null;
          }

          return {
            id: doc.id,
            ...data,
            purchaseDate: (data.purchaseDate as Timestamp).toDate(),
            expiryDate: (data.expiryDate as Timestamp).toDate(),
          } as Warranty;
        })
        .filter((w): w is Warranty => w !== null);

      setWarranties(fetchedWarranties);
    } catch (err) {
      console.error('Error fetching warranties:', err);
      setError('Failed to load your warranties. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWarranties();
    }
  }, [user]);

  const sortedWarranties = [...warranties].sort((a, b) => {
    const dateA = a.expiryDate.getTime();
    const dateB = b.expiryDate.getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const handleWarrantyUpdate = () => {
    fetchWarranties();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (warranties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-12 text-center">
                <div className="mb-4 rounded-full border border-dashed p-4">
                    <Frown className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">No Warranties Found</h2>
                <p className="text-muted-foreground">Click the button below to add your first warranty.</p>
                <WarrantyFormDialog onSave={handleWarrantyUpdate}>
                    <Button className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Warranty
                    </Button>
                </WarrantyFormDialog>
            </div>
        );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedWarranties.map((warranty) => (
          <WarrantyCard key={warranty.id} warranty={warranty} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-3xl font-bold">Your Warranties</h1>
          <p className="text-muted-foreground">An overview of all your product warranties.</p>
        </div>
        {warranties.length > 0 && (
            <div className="flex items-center gap-2">
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" /> Expires Soonest
                  </div>
                </SelectItem>
                <SelectItem value="desc">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4" /> Expires Latest
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <WarrantyFormDialog onSave={handleWarrantyUpdate}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Warranty
              </Button>
            </WarrantyFormDialog>
          </div>
        )}
      </div>
      {renderContent()}
    </div>
  );
}
