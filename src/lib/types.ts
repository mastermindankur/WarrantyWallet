export type WarrantyCategory = 'Electronics' | 'Appliances' | 'Furniture' | 'Vehicles' | 'Other';

export interface Warranty {
  id: string;
  productName: string;
  category: WarrantyCategory;
  purchaseDate: Date;
  expiryDate: Date;
  invoiceImage?: string;
  warrantyCardImage?: string;
  notes?: string;
}
