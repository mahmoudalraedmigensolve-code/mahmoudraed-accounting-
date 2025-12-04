// Suppliers Feature Types

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  totalBalance: number; // إجمالي المستحق للمورد
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  paymentAmount: number;
  previousBalance: number;
  currentBalance: number;
  paymentDate: Date;
  userId: string;
}

export interface SupplierStatement {
  id: string;
  date: Date;
  description: string; // البيان
  debit: number; // مدين (المشتريات)
  credit: number; // دائن (المدفوعات)
  balance: number; // الرصيد
  type: "purchase" | "payment";
}
