import { useState } from 'react';
import { format, formatDistanceToNow, isPast, intervalToDuration } from 'date-fns';
import { doc, deleteDoc } from 'firebase/firestore';
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
import { db } from '@/lib/firebase';
import CategoryIcon from './category-icon';
import { getPresignedUrl } from '@/app/actions/upload-action';
import { deleteWarrantyFiles } from '@/app/actions/warranty-actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { WarrantyFormDialog } from './warranty-form-dialog';

interface WarrantyCardProps {
  warranty: Warranty;
  onUpdate: () => void;
}

function formatRemainingTime(expiryDate: Date): string {
  const now = new Date();
  if (isPast(expiryDate)) {
    return `Expired ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
  }

  const duration = intervalToDuration({ start: now, end: expiryDate });

  const years = duration.years || 0;
  const months = duration.months || 0;
  const days = duration.days || 0;

  if (years > 0) {
    const parts = [`${years} year${years > 1 ? 's' : ''}`];
    if (months > 0) {
      parts.push(`${months} month${months > 1 ? 's' : ''}`);
    }
    return `Expires in ${parts.join(' and ')}`;
  }

  if (months > 0) {
    return `Expires in ${months} month${months > 1 ? 's' : ''}`;
  }
  
  if (days > 0) {
      return `Expires in ${days} day${days > 1 ? 's' : ''}`;
  }
  
  // For less than a day
  return `Expires ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
}


export default function WarrantyCard({ warranty, onUpdate }: WarrantyCardProps) {
  const { id, productName, category, expiryDate, invoiceKey, warrantyCardKey, notes } = warranty;
  const hasExpired = isPast(expiryDate);

  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // First, attempt to delete associated files from S3 via the server action.
      // We proceed even if this fails to ensure the primary database record is removed.
      await deleteWarrantyFiles({
        invoiceKey,
        warrantyCardKey,
      });

      // Then, delete the document from Firestore on the client-side.
      // This ensures the request is authenticated with the current user's credentials.
      if (!db) {
        throw new Error('Firebase is not configured.');
      }
      await deleteDoc(doc(db, 'warranties', id));

      toast({
        title: 'Success',
        description: 'Warranty deleted successfully.',
      });
      onUpdate();

    } catch (error: any) {
      console.error('Failed to delete warranty:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Could not delete the warranty. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={cn(
        "flex flex-col overflow-hidden transition-all duration-300",
        !hasExpired && "hover:shadow-lg hover:-translate-y-1",
        hasExpired && "bg-muted/40 opacity-80"
      )}>
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
                {formatRemainingTime(expiryDate)}
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
            <WarrantyFormDialog warranty={warranty} onSave={onUpdate}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> Edit
              </Button>
            </WarrantyFormDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-destructive hover:text-destructive" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    warranty and any associated files from the servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
