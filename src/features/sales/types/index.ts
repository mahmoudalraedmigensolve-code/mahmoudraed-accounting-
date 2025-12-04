// Sales Feature Types

export type InvoiceType = "cash" | "credit" | "payment"; // نقدي أو آجل أو دفعة

export interface InvoiceItem {
  productId: string; // Reference to purchase product
  productName: string;
  quantity: number;
  unitPrice: number; // سعر بيع الوحدة من المشتريات
  totalPrice: number; // quantity × unitPrice
  availableQuantity: number; // للتحقق من الكمية المتاحة
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalBalance: number; // إجمالي الرصيد (المتبقي من جميع الفواتير)
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string; // رقم الفاتورة
  customerId: string; // Reference to customer
  customerName: string;
  customerPhone: string;
  invoiceType: InvoiceType;
  items: InvoiceItem[]; // المنتجات المباعة
  totalAmount: number; // الإجمالي (مجموع أسعار المنتجات)
  paidAmount: number; // المدفوع
  deferredAmount: number; // الأجل (totalAmount - paidAmount)
  previousBalance: number; // الرصيد السابق من الفواتير القديمة
  currentBalance: number; // الرصيد الحالي (previousBalance + deferredAmount)
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface SaleFormData {
  invoiceNumber: string;
  customerId?: string; // Optional for new customers
  customerName: string;
  customerPhone: string;
  invoiceType: InvoiceType;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  deferredAmount: number;
  previousBalance: number;
  currentBalance: number;
}

export interface CustomerReceipt {
  id: string;
  receiptNumber: string; // رقم الإيصال
  customerId: string;
  customerName: string;
  paidAmount: number; // المبلغ المدفوع
  previousBalance: number; // الرصيد السابق
  currentBalance: number; // الرصيد الحالي بعد الدفع
  receiptDate: Date; // تاريخ الإيصال
  notes?: string; // ملاحظات
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface SalesState {
  sales: Sale[];
  customers: Customer[];
  receipts: CustomerReceipt[];
  isLoading: boolean;
  error: string | null;
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  cash: "نقدي",
  credit: "آجل",
  payment: "دفعة",
};
