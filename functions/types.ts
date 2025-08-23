// This file provides the necessary types for the Cloud Function.
// It should be kept in sync with src/lib/types.ts

export type WarrantyCategory =
  | "Electronics"
  | "Appliances"
  | "Furniture"
  | "Vehicles"
  | "Other";

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

    