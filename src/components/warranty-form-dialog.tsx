'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addMonths, format, isValid, parse } from 'date-fns';
import { CalendarIcon, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { doc, setDoc, collection } from 'firebase/firestore';

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
import { Separator } from '@/components/ui/separator';
import { cn, fileToDataUri } from '@/lib/utils';
import type { Warranty, WarrantyCategory } from '@/lib/types';
import { detectWarrantyPeriod } from '@/ai/flows/detect-warranty-period';
import { warnShortWarranties } from '@/ai/flows/warn-short-warranties';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { uploadFileToS3 } from '@/app/actions/upload-action';

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
  onSave: () => void;
}

export function WarrantyFormDialog({ children, warranty, onSave }: WarrantyFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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
      
      const parseDate = (dateString: string | undefined): Date | null => {
        if (!dateString) return null;
        let d = parse(dateString, 'yyyy-MM-dd', new Date());
        if (isValid(d)) {
          return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        }
        d = new Date(dateString);
        if (isValid(d)) {
          return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        }
        return null;
      };

      let reasoningParts: string[] = [];
      if (warrantyResult.reasoning) {
        reasoningParts.push(warrantyResult.reasoning);
      }
      
      const purchaseDate = parseDate(warrantyResult.purchaseDate);
      let expiryDate = parseDate(warrantyResult.expiryDate);

      if (purchaseDate) {
        form.setValue('purchaseDate', purchaseDate, { shouldValidate: true });
        reasoningParts.push('AI detected the purchase date.');
        
        if (!expiryDate && warrantyResult.warrantyPeriodMonths) {
          expiryDate = addMonths(purchaseDate, warrantyResult.warrantyPeriodMonths);
          reasoningParts.push(`AI calculated expiry from a ${warrantyResult.warrantyPeriodMonths}-month warranty.`);
        }
      }

      if (expiryDate) {
        form.setValue('expiryDate', expiryDate, { shouldValidate: true });
        reasoningParts.push('AI detected the expiry date.');
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
    if (!user || !db) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to save a warranty.',
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const docRef = warranty?.id
        ? doc(db, 'warranties', warranty.id)
        : doc(collection(db, 'warranties'));
      
      let invoiceKey = warranty?.invoiceKey;
      let warrantyCardKey = warranty?.warrantyCardKey;

      const invoiceFile = data.invoice?.[0];
      if (invoiceFile) {
        const dataUri = await fileToDataUri(invoiceFile);
        invoiceKey = await uploadFileToS3(user.uid, docRef.id, dataUri, invoiceFile.name);
      }
      
      const warrantyCardFile = data.warrantyCard?.[0];
      if (warrantyCardFile) {
        const dataUri = await fileToDataUri(warrantyCardFile);
        warrantyCardKey = await uploadFileToS3(user.uid, docRef.id, dataUri, warrantyCardFile.name);
      }
      
      const warrantyDataForDb = {
        userId: user.uid,
        productName: data.productName,
        category: data.category,
        purchaseDate: data.purchaseDate,
        expiryDate: data.expiryDate,
        notes: data.notes || '',
        invoiceKey: invoiceKey || null,
        warrantyCardKey: warrantyCardKey || null,
      };
      
      await setDoc(docRef, warrantyDataForDb, { merge: true });
      
      onSave();
      
      toast({ title: 'Success', description: 'Your warranty has been saved.' });
      setOpen(false);
      form.reset();
      
    } catch (error: any) {
      console.error('Error saving warranty:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'There was an error saving your warranty.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh] p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-grow overflow-hidden">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>{warranty ? 'Edit Warranty' : 'Add New Warranty'}</DialogTitle>
              <DialogDescription>
                Fill in the details below. You can upload an invoice or warranty card to let AI autofill the dates for you.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-grow space-y-6 py-4 overflow-y-auto px-6">
              {/* Product Info Section */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              <Separator />

              {/* Attachments Section */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">AI Document Scan (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoice"
                    render={({ field }) => {
                      const { value, ...rest } = field;
                      return (
                        <FormItem>
                          <FormLabel>Invoice</FormLabel>
                          <FormControl>
                            <Input
                              {...rest}
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(event) => {
                                field.onChange(event.target.files);
                                runAiExtraction('invoice', event.target.files);
                              }}
                            />
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
                          <FormLabel>Warranty Card</FormLabel>
                          <FormControl>
                            <Input
                              {...rest}
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(event) => {
                                field.onChange(event.target.files);
                                runAiExtraction('warrantyCard', event.target.files);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                {isAiRunning && (
                  <div className="flex items-center text-sm text-muted-foreground pt-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing your document... this may take a moment.
                  </div>
                )}
              </div>
              
              <Separator />

              {/* Dates Section */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Warranty Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              defaultMonth={field.value}
                            />
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
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              defaultMonth={field.value}
                            />
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
              </div>
              
              <Separator />

              {/* Notes Section */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Additional Information</h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes, e.g., serial number, gift receipt, special conditions..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </div>

            <DialogFooter className="p-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving || isAiRunning}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Warranty
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
