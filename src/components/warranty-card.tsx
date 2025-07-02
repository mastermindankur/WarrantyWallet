import { useState } from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  Pencil,
  Trash2,
  CalendarClock,
  NotebookText,
  Loader2,
} from 'lucide-react';
import type { Warranty } from '@/lib/types';
import { cn } from '@/lib/utils';
import CategoryIcon from './category-icon';
import { getPresignedUrl } from '@/app/actions/upload-action';
import { useToast } from '@/hooks/use-toast';

interface WarrantyCardProps {
  warranty: Warranty;
}

export default function WarrantyCard({ warranty }: WarrantyCardProps) {
  const { productName, category, expiryDate, invoiceKey, warrantyCardKey, notes } = warranty;
  const hasExpired = isPast(expiryDate);
  const timeLeft = formatDistanceToNow(expiryDate, { addSuffix: true });

  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const { toast } = useToast();

  const getExpiryColor = () => {
    if (hasExpired) return 'text-red-500';
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    if (expiryDate.getTime() - new Date().getTime() < oneMonth) {
      return 'text-amber-500';
    }
    return 'text-green-600';
  };

  const handleViewFile = async (key: string | undefined, type: 'invoice' | 'card') => {
    if (!key) return;

    if (type === 'invoice') setIsLoadingInvoice(true);
    else setIsLoadingCard(true);

    try {
        const url = await getPresignedUrl(key);
        window.open(url, '_blank');
    } catch (error) {
        console.error("Failed to get presigned URL", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not retrieve the file. Please try again.",
        });
    } finally {
        if (type === 'invoice') setIsLoadingInvoice(false);
        else setIsLoadingCard(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold">{productName}</CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
                 <CategoryIcon category={category} className="h-5 w-5" />
            </div>
        </div>
        <CardDescription className="flex items-center gap-2 pt-2">
            <CalendarClock className="h-4 w-4" />
            <span>Expires on {format(expiryDate, 'MMM d, yyyy')}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
            <div className={cn('font-medium', getExpiryColor())}>
                {hasExpired ? `Expired ${timeLeft}` : `Expires ${timeLeft}`}
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                {invoiceKey && (
                  <Button variant="link" className="p-0 h-auto gap-1 text-muted-foreground hover:text-primary" onClick={() => handleViewFile(invoiceKey, 'invoice')} disabled={isLoadingInvoice}>
                      {isLoadingInvoice ? <Loader2 className="animate-spin" /> : <FileText />}
                      Invoice
                  </Button>
                )}
                {warrantyCardKey && (
                  <Button variant="link" className="p-0 h-auto gap-1 text-muted-foreground hover:text-primary" onClick={() => handleViewFile(warrantyCardKey, 'card')} disabled={isLoadingCard}>
                      {isLoadingCard ? <Loader2 className="animate-spin" /> : <FileText />}
                      Warranty Card
                  </Button>
                )}
            </div>
            {notes && (
                <div className="pt-2 text-sm border-t mt-2">
                    <h4 className="font-medium text-foreground flex items-center gap-2"><NotebookText className="h-4 w-4" /> Notes</h4>
                    <p className="pt-1 text-muted-foreground whitespace-pre-wrap">{notes}</p>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50/50 p-2 dark:bg-slate-900/50">
        <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
