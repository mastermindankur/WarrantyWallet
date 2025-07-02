'use client';

import { useState } from 'react';
import { PlusCircle, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WarrantyCard from '@/components/warranty-card';
import { mockWarranties } from '@/lib/data';
import type { Warranty } from '@/lib/types';
import { WarrantyFormDialog } from '@/components/warranty-form-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const [warranties, setWarranties] = useState<Warranty[]>(mockWarranties);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedWarranties = [...warranties].sort((a, b) => {
    const dateA = a.expiryDate.getTime();
    const dateB = b.expiryDate.getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const handleAddWarranty = (newWarranty: Warranty) => {
    setWarranties(prev => [...prev, { ...newWarranty, id: (prev.length + 1).toString() }]);
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-3xl font-bold">Your Warranties</h1>
          <p className="text-muted-foreground">An overview of all your product warranties.</p>
        </div>
        <div className="flex items-center gap-2">
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="asc"><div className="flex items-center gap-2"><SortAsc className="h-4 w-4"/> Expires Soonest</div></SelectItem>
                    <SelectItem value="desc"><div className="flex items-center gap-2"><SortDesc className="h-4 w-4"/> Expires Latest</div></SelectItem>
                </SelectContent>
            </Select>
            <WarrantyFormDialog onSave={handleAddWarranty}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Warranty
              </Button>
            </WarrantyFormDialog>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedWarranties.map((warranty) => (
          <WarrantyCard key={warranty.id} warranty={warranty} />
        ))}
      </div>
    </div>
  );
}
