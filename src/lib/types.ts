export type WarrantyCategory = 'Electronics' | 'Appliances' | 'Furniture' | 'Vehicles' | 'Other';

export interface Warranty {
  id: string;
  userId: string;
  productName: string;
  category: WarrantyCategory;
  purchaseDate: Date;
  expiryDate: Date;
  invoiceKey?: string;
  warrantyCardKey?: string;
  notes?: string;
}
