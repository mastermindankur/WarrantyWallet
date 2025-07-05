
'use client';

import { useEffect, useState, Suspense } from 'react';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { Frown, PlusCircle, SortAsc, SortDesc, AlertTriangle, Search } from 'lucide-react';
import { isPast } from 'date-fns';

import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import type { Warranty } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import WarrantyCard from '@/components/warranty-card';
import { WarrantyFormDialog } from '@/components/warranty-form-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

function DashboardContent() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [sortOption, setSortOption] = useState<'asc' | 'desc' | 'expired'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCategory = searchParams.get('category');

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

  const filteredAndSortedWarranties = [...warranties]
    .filter(warranty => {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = warranty.productName.toLowerCase().includes(searchLower);
      const notesMatch = warranty.notes?.toLowerCase().includes(searchLower) || false;
      const searchMatch = searchQuery ? nameMatch || notesMatch : true;
      if (!searchMatch) return false;

      const categoryMatch = !selectedCategory || warranty.category === selectedCategory;
      if (!categoryMatch) return false;

      if (sortOption === 'expired') {
        return isPast(warranty.expiryDate);
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = a.expiryDate.getTime();
      const dateB = b.expiryDate.getTime();
      if (sortOption === 'asc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });

  const handleWarrantyUpdate = () => {
    fetchWarranties();
  };

  const getPageSubtitle = () => {
    if (sortOption === 'expired') {
      if (selectedCategory) {
        return `Viewing expired warranties in ${selectedCategory}`;
      }
      return 'Viewing all your expired warranties.';
    }
    if (selectedCategory) {
      return `Viewing warranties in ${selectedCategory}`;
    }
    return 'An overview of all your product warranties.';
  };

  const getEmptyStateMessage = () => {
    if (searchQuery) {
        return `No warranties found matching your search.`;
    }
    if (sortOption === 'expired') {
      if (selectedCategory) {
        return `No expired warranties found in the "${selectedCategory}" category.`;
      }
      return 'You have no expired warranties.';
    }
    if (selectedCategory) {
      return `No warranties found in the "${selectedCategory}" category.`;
    }
    return 'No warranties match the current filters.';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSortOption('asc');
    router.push('/dashboard');
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

    if (filteredAndSortedWarranties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-12 text-center">
                <div className="mb-4 rounded-full border border-dashed p-4">
                    <Frown className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">No Warranties Found</h2>
                <p className="text-muted-foreground">{getEmptyStateMessage()}</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
            </div>
        );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAndSortedWarranties.map((warranty) => (
          <WarrantyCard key={warranty.id} warranty={warranty} onUpdate={handleWarrantyUpdate} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-col items-start gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Warranties</h1>
          <p className="text-muted-foreground">
            {getPageSubtitle()}
          </p>
        </div>
        {warranties.length > 0 && (
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search warranties..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <Select value={sortOption} onValueChange={(value: 'asc' | 'desc' | 'expired') => setSortOption(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
                  <SelectItem value="expired">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Expired
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <WarrantyFormDialog onSave={handleWarrantyUpdate}>
                <Button className="w-full sm:w-auto">
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

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center"><p>Loading warranties...</p></div>}>
            <DashboardContent />
        </Suspense>
    );
}
