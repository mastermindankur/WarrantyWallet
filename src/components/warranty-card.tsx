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
} from 'lucide-react';
import type { Warranty } from '@/lib/types';
import { cn } from '@/lib/utils';
import CategoryIcon from './category-icon';

interface WarrantyCardProps {
  warranty: Warranty;
}

export default function WarrantyCard({ warranty }: WarrantyCardProps) {
  const { productName, category, expiryDate, invoiceImage, warrantyCardImage, notes } = warranty;
  const hasExpired = isPast(expiryDate);
  const timeLeft = formatDistanceToNow(expiryDate, { addSuffix: true });

  const getExpiryColor = () => {
    if (hasExpired) return 'text-red-500';
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    if (expiryDate.getTime() - new Date().getTime() < oneMonth) {
      return 'text-amber-500';
    }
    return 'text-green-600';
  };

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
                {invoiceImage && (
                <a href={invoiceImage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <FileText className="h-4 w-4" /> Invoice
                </a>
                )}
                {warrantyCardImage && (
                <a href={warrantyCardImage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <FileText className="h-4 w-4" /> Warranty Card
                </a>
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
