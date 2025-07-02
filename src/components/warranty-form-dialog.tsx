
'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addMonths, format, isValid } from 'date-fns';
import { CalendarIcon, Loader2, AlertTriangle, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn, fileToDataUri } from '@/lib/utils';
import type { Warranty, WarrantyCategory } from '@/lib/types';
import { detectWarrantyPeriod } from '@/ai/flows/detect-warranty-period';
import { warnShortWarranties } from '@/ai/flows/warn-short-warranties';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  productName: z.string().min(2, 'Product name must be at least 2 characters.'),
  category: z.enum(['Electronics', 'Appliances', 'Furniture', 'Vehicles', 'Other']),
  notes: z.string().optional(),
  purchaseDate: z.date(),
  expiryDate: z.date(),
  invoice: z.any().optional(),
  warrantyCard: z.any().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface WarrantyFormDialogProps {
  children: ReactNode;
  warranty?: Warranty;
  onSave: (data: Warranty) => void;
}

export function WarrantyFormDialog({ children, warranty, onSave }: WarrantyFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      productName: warranty?.productName || '',
      category: warranty?.category || 'Electronics',
      purchaseDate: warranty?.purchaseDate || new Date(),
      expiryDate: warranty?.expiryDate || addMonths(new Date(), 12),
      notes: warranty?.notes || '',
    },
  });

  const runAiExtraction = async (changedFieldName: 'invoice' | 'warrantyCard', files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const productName = form.getValues('productName');
    if (!productName) {
      form.setError('productName', { type: 'manual', message: 'Please enter a product name first.' });
      form.resetField(changedFieldName);
      return;
    }

    setIsAiRunning(true);
    setAiWarning(null);
    setAiReasoning(null);

    try {
      const invoiceFile = changedFieldName === 'invoice' ? file : form.getValues('invoice')?.[0];
      const warrantyCardFile = changedFieldName === 'warrantyCard' ? file : form.getValues('warrantyCard')?.[0];

      const invoiceDataUri = invoiceFile ? await fileToDataUri(invoiceFile) : undefined;
      const warrantyCardDataUri = warrantyCardFile ? await fileToDataUri(warrantyCardFile) : undefined;

      if (!invoiceDataUri && !warrantyCardDataUri) {
        setIsAiRunning(false);
        return;
      }
      
      const [warrantyResult, shortWarrantyResult] = await Promise.all([
        detectWarrantyPeriod({ invoiceDataUri, warrantyCardDataUri, productDescription: productName }),
        warnShortWarranties({ invoiceDataUri, warrantyCardDataUri, productDescription: productName }),
      ]);
      
      let reasoningParts: string[] = [];
      if (warrantyResult.reasoning) {
        reasoningParts.push(warrantyResult.reasoning);
      }

      const parseDate = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        // Handle YYYY-MM-DD and YYYY-MM-DDTHH:mm:ss.sssZ formats by taking only the date part
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        
        // Check if all parts are valid numbers
        if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month > 0 && day > 0) {
            // Using Date.UTC is safer for timezone issues than new Date('YYYY-MM-DD')
            const date = new Date(Date.UTC(year, month - 1, day));
            if (isValid(date)) {
                return date;
            }
        }
        return null;
      }

      const purchaseDateFromAi = parseDate(warrantyResult.purchaseDate);
      const expiryDateFromAi = parseDate(warrantyResult.expiryDate);

      // Set purchase date if available
      if (purchaseDateFromAi) {
        form.setValue('purchaseDate', purchaseDateFromAi, { shouldValidate: true });
        reasoningParts.push('AI detected the purchase date.');
      }

      // Determine and set expiry date
      if (expiryDateFromAi) {
        form.setValue('expiryDate', expiryDateFromAi, { shouldValidate: true });
        reasoningParts.push('AI detected the expiry date.');
      } else if (purchaseDateFromAi && warrantyResult.warrantyPeriodMonths) {
        // Calculate from purchase date and warranty period if no explicit expiry date
        const calculatedExpiryDate = addMonths(purchaseDateFromAi, warrantyResult.warrantyPeriodMonths);
        form.setValue('expiryDate', calculatedExpiryDate, { shouldValidate: true });
        reasoningParts.push(`AI calculated expiry from a ${warrantyResult.warrantyPeriodMonths}-month warranty.`);
      }

      const confidenceText = `(Confidence: ${Math.round(warrantyResult.confidenceScore * 100)}%)`;
      setAiReasoning(`${reasoningParts.join(' ')} ${confidenceText}`);

      if (shortWarrantyResult.isShortWarranty) {
        setAiWarning(shortWarrantyResult.warningMessage);
      }

    } catch (error) {
      console.error('AI processing failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description: 'Could not analyze the document. Please set the dates manually.',
      });
    } finally {
      setIsAiRunning(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const newWarrantyData: Partial<Warranty> & Pick<Warranty, 'id'> = {
      id: warranty?.id || Date.now().toString(),
      productName: data.productName,
      category: data.category,
      purchaseDate: data.purchaseDate,
      expiryDate: data.expiryDate,
      notes: data.notes,
    };

    if (data.invoice?.[0]) {
      newWarrantyData.invoiceImage = await fileToDataUri(data.invoice[0]);
    }
    
    if (data.warrantyCard?.[0]) {
      newWarrantyData.warrantyCardImage = await fileToDataUri(data.warrantyCard[0]);
    }

    onSave(newWarrantyData as Warranty);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{warranty ? 'Edit Warranty' : 'Add New Warranty'}</DialogTitle>
              <DialogDescription>Fill in the details of your product warranty.</DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ProBook Laptop 15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(['Electronics', 'Appliances', 'Furniture', 'Vehicles', 'Other'] as WarrantyCategory[]).map(cat => (
                         <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes, e.g. gift receipt, special conditions..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoice"
              render={({ field }) => {
                const { value, ...rest } = field;
                return (
                  <FormItem>
                    <FormLabel>Invoice (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...rest}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(event) => {
                            field.onChange(event.target.files);
                            runAiExtraction('invoice', event.target.files);
                          }}
                          className="pr-12"
                        />
                        {isAiRunning && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="warrantyCard"
              render={({ field }) => {
                const { value, ...rest } = field;
                return (
                  <FormItem>
                    <FormLabel>Warranty Card (Optional)</FormLabel>
                    <FormControl>
                     <div className="relative">
                        <Input
                          {...rest}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(event) => {
                            field.onChange(event.target.files);
                            runAiExtraction('warrantyCard', event.target.files);
                          }}
                          className="pr-12"
                        />
                        {isAiRunning && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Purchase Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {aiReasoning && (
                 <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>AI Analysis</AlertTitle>
                    <AlertDescription>{aiReasoning}</AlertDescription>
                </Alert>
            )}

            {aiWarning && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warranty Warning</AlertTitle>
                    <AlertDescription>{aiWarning}</AlertDescription>
                </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save Warranty</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
