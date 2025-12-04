// Purchases Feature Types

export type Currency = "EGP" | "USD" | "GBP";

export interface Purchase {
  id: string;
  productName: string;
  quantity: number;
  unitPurchasePrice: number; // Price per unit (purchase)
  purchasePrice: number; // Total purchase price (unitPurchasePrice × quantity)
  unitSellingPrice: number; // Price per unit (selling)
  sellingPrice: number; // Total selling price (unitSellingPrice × quantity)
  supplierName: string;
  supplierPhone: string;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface PurchaseFormData {
  productName: string;
  quantity: number;
  unitPurchasePrice: number; // Price per unit (purchase)
  purchasePrice: number; // Total purchase price (unitPurchasePrice × quantity)
  unitSellingPrice: number; // Price per unit (selling)
  sellingPrice: number; // Total selling price (unitSellingPrice × quantity)
  supplierName: string;
  supplierPhone: string;
  currency: Currency;
}

export interface PurchasesState {
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EGP: "ج.م",
  USD: "$",
  GBP: "£",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  EGP: "جنيه مصري",
  USD: "دولار أمريكي",
  GBP: "جنيه إسترليني",
};

// Exchange rates to EGP (Egyptian Pound)
export const EXCHANGE_RATES_TO_EGP: Record<Currency, number> = {
  EGP: 1,
  USD: 50, // 1 USD = 50 EGP (approximate)
  GBP: 65, // 1 GBP = 65 EGP (approximate)
};
